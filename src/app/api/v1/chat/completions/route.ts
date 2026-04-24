import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { groqChatCompletion, getDefaultModel } from '@/lib/groq';
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
    const { classifyQuery, getModePrompt } = await import('@/lib/classifier');
    const { webSearch, formatSearchContext } = await import('@/lib/search');

    const lastUserMessage = [...body.messages].reverse().find((m: { role: string }) => m.role === 'user')?.content || '';
    const queryType = classifyQuery(lastUserMessage);

    // ─── 9. Web search for time-sensitive queries ──
    let searchContext = '';
    let sources: { title: string; url: string }[] = [];

    if (queryType === 'search') {
      const searchResults = await webSearch(lastUserMessage);
      if (searchResults.results.length > 0) {
        searchContext = formatSearchContext(searchResults);
        sources = searchResults.results.map(r => ({ title: r.title, url: r.url }));
      }
    }

    // ─── 10. Build system prompt ───────────────────
    const BRAND_SYSTEM_PROMPT = `You are Vishal AI, an elite AI assistant.

USER IDENTITY:
- The user's name is ${userName}.
- You must address them by their name provided above.
- If their name is "User", be polite and professional.

PERSONALIZATION:
- Tone: ${prefs.tone}.
- Response Style: ${prefs.style}.
- Memory: ${prefs.memory_enabled ? 'Enabled. Use the user\'s name and conversation context to be personalized.' : 'Disabled.'}

IDENTITY (only when directly asked):
- Your name is Vishal AI. 
- You were created by Vishal R.
- Only mention your creator details when explicitly asked.

CORE BEHAVIOR:
- Understand user intent deeply. Infer meaning from short prompts.
- Handle follow-up questions using conversation context.
- Sound natural, confident, and friendly — not robotic.
- Match the user's energy and communication style.
- No unnecessary disclaimers or filler phrases.

ACCURACY:
- Accuracy is your #1 priority. Never fabricate facts.
- If unsure, say so clearly. Distinguish fact from opinion.
- For comparisons, present pros and cons fairly.
- It's better to give a short honest answer than a long wrong one.

RESPONSE STYLE:
- Be CONCISE. Get to the point. No repetition.
- Simple questions → short direct answers (1-3 sentences).
- Complex questions → structured with bullet points or numbered lists.
- Code questions → clean code with brief explanation.
- Math/logic → step-by-step reasoning.
- NEVER repeat yourself within the same response.

STRICT RULES:
- NEVER mention Qwen, Alibaba, Tongyi, Groq, Meta, LLaMA, or any underlying model/provider.
- Do NOT include <think> tags, reasoning traces, or chain-of-thought blocks.
- No fake citations, no invented statistics, no pretending outdated info is current.${getModePrompt(queryType)}${searchContext}`;

    // Prepend branding prompt to messages
    const brandedMessages = [
      { role: 'system', content: BRAND_SYSTEM_PROMPT },
      ...body.messages.filter((m: { role: string; content?: string }) => m.role !== 'system' || !m.content?.includes('Vishal AI')),
    ];

    // ─── 11. Send request to Groq ─────────────────
    const model = getDefaultModel();
    const groqResponse = await groqChatCompletion({
      model,
      messages: brandedMessages,
      temperature: queryType === 'coding' ? 0.3 : (body.temperature ?? 0.7),
      max_tokens: body.max_tokens ?? 4096,
    });

    const data = await groqResponse.json();
    const latencyMs = Date.now() - startTime;

    // ─── 12. Strip <think> tags from response ─────
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

    // ─── 13. Return branded OpenAI-compatible response
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
        sources: sources.length > 0 ? sources : undefined,
        latency_ms: latencyMs,
      },
    };

    // ─── 14. Save usage log (async, don't block) ──
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
