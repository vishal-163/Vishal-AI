const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

// ─── Model Tiers ─────────────────────────────────
// Fast: Quick responses for simple queries
const MODEL_FAST = 'llama-3.3-70b-versatile';
// Strong: Better reasoning for complex queries (120B params)
const MODEL_STRONG = 'openai/gpt-oss-120b';
// Compound: Groq's agentic model with built-in web search & code execution
const MODEL_COMPOUND = 'groq/compound';

interface GroqChatRequest {
  model?: string;
  messages: { role: string; content: string }[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export type ModelTier = 'fast' | 'strong' | 'compound';

/**
 * Select the best free model based on query type and complexity
 */
export function selectModel(queryType: string, complexity: 'simple' | 'complex'): { model: string; tier: ModelTier } {
  // Search/factual queries → Compound (has built-in web search)
  if (queryType === 'search') {
    return { model: MODEL_COMPOUND, tier: 'compound' };
  }

  // Complex reasoning or analysis → GPT-OSS 120B (stronger reasoning)
  if (queryType === 'reasoning' || complexity === 'complex') {
    return { model: MODEL_STRONG, tier: 'strong' };
  }

  // Simple general chat, coding → LLaMA 70B (fastest)
  return { model: MODEL_FAST, tier: 'fast' };
}

export async function groqChatCompletion(
  request: GroqChatRequest,
  stream: boolean = false
) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured');
  }

  const body = {
    model: request.model || MODEL_FAST,
    messages: request.messages,
    temperature: request.temperature ?? 0.7,
    max_tokens: request.max_tokens ?? 4096,
    stream,
  };

  const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error (${response.status}): ${error}`);
  }

  return response;
}

export function getDefaultModel() {
  return MODEL_FAST;
}

export function getAvailableModels() {
  return [
    {
      id: MODEL_FAST,
      name: 'Vishal AI Fast',
      description: 'High-speed 70B model for quick responses',
      context_window: 128000,
      provider: 'groq',
    },
    {
      id: MODEL_STRONG,
      name: 'Vishal AI Pro',
      description: 'Advanced 120B model for complex reasoning and analysis',
      context_window: 128000,
      provider: 'groq',
    },
    {
      id: MODEL_COMPOUND,
      name: 'Vishal AI Search',
      description: 'Agentic model with built-in web search and code execution',
      context_window: 128000,
      provider: 'groq',
    },
  ];
}
