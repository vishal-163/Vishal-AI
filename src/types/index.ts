// ─── User & Auth ────────────────────────────────
export interface Profile {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  plan: 'free' | 'pro' | 'enterprise';
  created_at: string;
}

// ─── API Keys ───────────────────────────────────
export interface ApiKey {
  id: string;
  user_id: string;
  name: string;
  key_hash: string;
  key_prefix: string;
  created_at: string;
  last_used_at: string | null;
  is_revoked: boolean;
  usage_count: number;
}

export interface ApiKeyCreateResponse {
  id: string;
  name: string;
  key: string;
  key_prefix: string;
  created_at: string;
}

// ─── Usage Logs ─────────────────────────────────
export interface UsageLog {
  id: string;
  user_id: string;
  api_key_id: string | null;
  model: string;
  endpoint: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  latency_ms: number;
  status: string;
  error: string | null;
  created_at: string;
}

// ─── Dashboard Stats ────────────────────────────
export interface DashboardStats {
  total_requests: number;
  requests_today: number;
  requests_month: number;
  total_tokens: number;
  error_rate: number;
  active_keys: number;
}

// ─── Chat Completions (OpenAI-compatible) ───────
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionRequest {
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface ChatCompletionResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: {
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// ─── Chart Data ─────────────────────────────────
export interface ChartDataPoint {
  date: string;
  value: number;
}
