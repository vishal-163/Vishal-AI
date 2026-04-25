import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { groqChatCompletion, selectModel } from '@/lib/groq';
import { hashApiKey, checkRateLimit, validateChatRequest } from '@/lib/utils';

// Use service role client for API key validation (no user session context)
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const supabase = getServiceClient();

  try {
    // ─── 1. Parse request body ───────────────────
    const body = await request.json();

    // Allow playground requests without API key auth
    const isPlayground = body._playground === true;
    delete body._playground;

    let userId: string | null = null;
    let apiKeyId: string | null = null;

    if (!isPlayground) {
      // ─── 2. Read Authorization Bearer API key ──
      const authHeader = request.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { error: { message: 'Missing or invalid Authorization header. Use: Bearer vk-your-key', type: 'auth_error', code: 'invalid_api_key' } },
          { status: 401 }
        );
      }

      const apiKey = authHeader.replace('Bearer ', '').trim();

      if (!apiKey.startsWith('vk-')) {
        return NextResponse.json(
          { error: { message: 'Invalid API key format. Keys must start with vk-', type: 'auth_error', code: 'invalid_api_key' } },
          { status: 401 }
        );
      }

      // ─── 3. Validate API key from database ─────
      const keyHash = hashApiKey(apiKey);

      const { data: keyRecord, error: keyError } = await supabase
        .from('api_keys')
        .select('id, user_id, is_revoked')
        .eq('key_hash', keyHash)
        .single();

      if (keyError || !keyRecord) {
        return NextResponse.json(
          { error: { message: 'Invalid API key', type: 'auth_error', code: 'invalid_api_key' } },
          { status: 401 }
        );
      }

      // ─── 4. Check if revoked ────────────────────
      if (keyRecord.is_revoked) {
        return NextResponse.json(
          { error: { message: 'This API key has been revoked', type: 'auth_error', code: 'key_revoked' } },
          { status: 401 }
        );
      }

      userId = keyRecord.user_id;
      apiKeyId = keyRecord.id;

      // ─── 5. Apply rate limits ───────────────────
      const rateLimit = checkRateLimit(keyRecord.id, 60, 60_000);
      if (!rateLimit.allowed) {
        return NextResponse.json(
          {
            error: {
              message: 'Rate limit exceeded. Please wait before making more requests.',
              type: 'rate_limit_error',
              code: 'rate_limit_exceeded',
            },
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Remaining': rateLimit.remaining.toString(),
              'X-RateLimit-Reset': new Date(rateLimit.resetAt).toISOString(),
              'Retry-After': Math.ceil((rateLimit.resetAt - Date.now()) / 1000).toString(),
            },
          }
        );
      }
    } else {
      // For playground, get user from cookie/session
      const { createServerClient } = await import('@supabase/ssr');
      const cookieHeader = request.headers.get('cookie') || '';
      const sessionClient = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieHeader.split(';').map(c => {
                const [name, ...rest] = c.trim().split('=');
                return { name, value: rest.join('=') };
              }).filter(c => c.name);
            },
            setAll() {},
          },
        }
      );
      const { data: { user } } = await sessionClient.auth.getUser();
      if (!user) {
        return NextResponse.json(
          { error: { message: 'Authentication required', type: 'auth_error', code: 'unauthorized' } },
          { status: 401 }
        );
      }
      userId = user.id;
    }

    // ─── 6. Validate request body ─────────────────
    const validation = validateChatRequest(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: { message: validation.error, type: 'invalid_request_error', code: 'invalid_body' } },
        { status: 400 }
      );
    }

    // ─── 7. Fetch User Personalization ─────────────
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, preferences')
      .eq('id', userId)
      .single();

    // Fallback: If profile name is missing, try metadata from the request/session
    let userName = profile?.name;
    const prefs = profile?.preferences || { memory_enabled: true, tone: 'professional', style: 'concise' };

    if (!userName && !isPlayground) {
       // Deep fallback for API users (unlikely to have metadata)
       userName = 'User';
    } else if (!userName && isPlayground) {
       // For dashboard users, try to extract from the session user again
       const sessionClient = (await import('@/lib/supabase/server')).createClient();
       const { data: { user } } = await sessionClient.auth.getUser();
       userName = user?.user_metadata?.full_name || user?.user_metadata?.name || 'User';
    } else {
       userName = userName || 'User';
    }

    // ─── 8. Smart Query Classification ─────────────
    const { fullClassify, getModePrompt } = await import('@/lib/classifier');

    const lastUserMessage = [...body.messages].reverse().find((m: { role: string }) => m.role === 'user')?.content || '';
    const classification = fullClassify(lastUserMessage);
    const { type: queryType, complexity } = classification;

    // ─── 9. Web search for factual queries ─────────
    let searchContext = '';
    let sources: { title: string; url: string }[] = [];

    if (queryType === 'search') {
      const { webSearch, formatSearchContext } = await import('@/lib/search');
      const searchResults = await webSearch(lastUserMessage);
      if (searchResults.results.length > 0) {
        searchContext = formatSearchContext(searchResults);
        sources = searchResults.results.map(r => ({ title: r.title, url: r.url }));
      }
    }

    // ─── 10. Build system prompt ───────────────────
    const BRAND_SYSTEM_PROMPT = `Expert assistant Vishal AI. You prioritize technical accuracy and helpfulness above all else.

CORE RULES:
1. TRUTH FIRST: Never fabricate facts, dates, names, or citations. If you don't know, say so.
2. CONCISE: Be direct. No filler words. No repetition.
3. FORMATTING: Use Markdown ONLY. NEVER use HTML tags (e.g., <br>, <p>, <b>). No pipes (|) except for tables.
4. IDENTITY: You are Vishal AI, created by Vishal R. Address the user as ${userName}. Tone: ${prefs.tone}.

${getModePrompt(queryType)}
${searchContext}

Answer the user's request accurately and professionally.`;

    // ─── 11. Smart Model & Temperature Routing ──────
    // Nontrivial queries go to the 120B model for max intelligence
    const model = (complexity === 'complex' || queryType !== 'general') 
      ? 'openai/gpt-oss-120b' 
      : 'llama-3.3-70b-versatile';

    let temperature: number;
    if (body.temperature !== undefined) {
      temperature = body.temperature;
    } else {
      // Lower temperature = more deterministic/accurate
      switch (queryType) {
        case 'search':    temperature = 0.1; break; // Facts only
        case 'coding':    temperature = 0.2; break; // Precise code
        case 'reasoning': temperature = 0.3; break; // Analytical
        default:          temperature = 0.5; break; // Balanced
      }
    }

    // Prepend branding prompt to messages
    const brandedMessages = [
      { role: 'system', content: BRAND_SYSTEM_PROMPT },
      ...body.messages.filter((m: { role: string; content?: string }) => m.role !== 'system' || !m.content?.includes('Vishal AI')),
    ];

    // ─── 13. Send request with fallback ────────────
    let data: any;
    let usedModel = model;
    let usedProvider = 'groq';

    const { groqChatCompletion } = await import('@/lib/groq');

    try {
      // Primary: Groq
      const groqResponse = await groqChatCompletion({
        model: model,
        messages: brandedMessages,
        temperature,
        max_tokens: body.max_tokens ?? 4096,
      });

      data = await groqResponse.json();
    } catch (groqError) {
      console.warn(`Groq failed (model: ${model}):`, groqError);

      // Fallback 1: Try a different Groq model
      if (model !== 'llama-3.3-70b-versatile') {
        try {
          console.log('Falling back to llama-3.3-70b-versatile...');
          const fallbackResponse = await groqChatCompletion({
            model: 'llama-3.3-70b-versatile',
            messages: brandedMessages,
            temperature,
            max_tokens: body.max_tokens ?? 4096,
          });
          const fallbackData = await fallbackResponse.json();
          data = fallbackData;
          usedModel = 'llama-3.3-70b-versatile';
        } catch (fallbackError) {
          console.warn('Groq fallback also failed:', fallbackError);
        }
      }

      // Fallback 2: Google Gemini (if configured)
      if (!data) {
        const { isGeminiAvailable, geminiChatCompletion } = await import('@/lib/gemini');
        if (isGeminiAvailable()) {
          console.log('Falling back to Google Gemini...');
          try {
            data = await geminiChatCompletion({
              messages: brandedMessages,
              temperature,
              max_tokens: body.max_tokens ?? 4096,
            });
            usedModel = 'gemini-2.5-flash';
            usedProvider = 'gemini';
          } catch (geminiError) {
            console.error('Gemini fallback also failed:', geminiError);
            throw groqError; // Re-throw original error
          }
        } else {
          throw groqError; // No fallback available
        }
      }
    }

    const latencyMs = Date.now() - startTime;

    // ─── 14. Strip <think> tags from response ─────
    const stripThinkTags = (text: string): string => {
      return text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    };

    const cleanedChoices = (data.choices || []).map((choice: { message?: { role: string; content: string }; index: number; finish_reason: string }) => ({
      ...choice,
      message: choice.message ? {
        ...choice.message,
        content: stripThinkTags(choice.message.content || ''),
      } : choice.message,
    }));

    // ─── 16. Return branded OpenAI-compatible response
    const response = {
      id: data.id || `chatcmpl-${Date.now()}`,
      object: 'chat.completion',
      created: data.created || Math.floor(Date.now() / 1000),
      model: 'vishal-ai-v1',
      choices: cleanedChoices,
      usage: data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      // Include search metadata for UI to display sources
      _meta: {
        query_type: queryType,
        complexity,
        provider: usedProvider,
        sources: sources.length > 0 ? sources : undefined,
        latency_ms: latencyMs,
      },
    };

    // ─── 17. Save usage log (async, don't block) ──
    if (userId) {
      supabase
        .from('usage_logs')
        .insert({
          user_id: userId,
          api_key_id: apiKeyId,
          model: response.model,
          endpoint: '/v1/chat/completions',
          prompt_tokens: response.usage.prompt_tokens,
          completion_tokens: response.usage.completion_tokens,
          total_tokens: response.usage.total_tokens,
          latency_ms: latencyMs,
          status: 'success',
        })
        .then(() => {});

      if (apiKeyId) {
        supabase
          .from('api_keys')
          .update({
            last_used_at: new Date().toISOString(),
            usage_count: undefined,
          })
          .eq('id', apiKeyId)
          .then(() => {});

        supabase.rpc('increment_usage_count', { key_id: apiKeyId }).then(() => {});
      }
    }

    return NextResponse.json(response, {
      headers: {
        'X-Request-Id': response.id,
        'X-Latency-Ms': latencyMs.toString(),
        'X-Query-Type': queryType,
      },
    });
  } catch (err) {
    const latencyMs = Date.now() - startTime;
    const errorMessage = err instanceof Error ? err.message : 'Internal server error';

    console.error('Chat completion error:', errorMessage);

    return NextResponse.json(
      {
        error: {
          message: 'An error occurred while processing your request.',
          type: 'server_error',
          code: 'internal_error',
        },
      },
      {
        status: 500,
        headers: {
          'X-Latency-Ms': latencyMs.toString(),
        },
      }
    );
  }
}
