const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

interface GroqChatRequest {
  model?: string;
  messages: { role: string; content: string }[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
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
    model: request.model || DEFAULT_MODEL,
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
  return DEFAULT_MODEL;
}

export function getAvailableModels() {
  return [
    {
      id: DEFAULT_MODEL,
      name: 'Vishal AI v1',
      description: 'High-performance 70B parameter model with superior accuracy',
      context_window: 128000,
      provider: 'groq',
    },
  ];
}
