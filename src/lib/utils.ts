import crypto from 'crypto';

/**
 * Generate a new API key with vk- prefix
 */
export function generateApiKey(): string {
  const random = crypto.randomBytes(24).toString('hex');
  return `vk-${random}`;
}

/**
 * Hash an API key using SHA-256 for secure storage
 */
export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

/**
 * Extract the prefix from an API key for display
 * Shows first 7 chars and last 4 chars: vk-a3f8...d2e3
 */
export function getKeyPrefix(key: string): string {
  if (key.length < 12) return key;
  return `${key.slice(0, 7)}...${key.slice(-4)}`;
}

/**
 * Format a date to a human-readable relative time
 */
export function timeAgo(date: string | null): string {
  if (!date) return 'Never';
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`;
  return then.toLocaleDateString();
}

/**
 * Format large numbers with K/M suffixes
 */
export function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

/**
 * Simple rate limiter using in-memory store
 * In production, replace with Redis
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 60,
  windowMs: number = 60_000
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record || now > record.resetAt) {
    rateLimitStore.set(identifier, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt };
  }

  record.count++;
  return { allowed: true, remaining: maxRequests - record.count, resetAt: record.resetAt };
}

/**
 * Validate chat completion request body
 */
export function validateChatRequest(body: unknown): {
  valid: boolean;
  error?: string;
} {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body is required' };
  }

  const { messages } = body as { messages?: unknown };

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return { valid: false, error: 'messages array is required and must not be empty' };
  }

  // Limit message count to prevent abuse
  if (messages.length > 100) {
    return { valid: false, error: 'Too many messages. Maximum 100 messages per request.' };
  }

  for (const msg of messages) {
    if (!msg.role || !['system', 'user', 'assistant'].includes(msg.role)) {
      return { valid: false, error: 'Each message must have a valid role (system, user, or assistant)' };
    }
    if (typeof msg.content !== 'string') {
      return { valid: false, error: 'Each message must have a string content field' };
    }
    // Limit individual message size (32KB)
    if (msg.content.length > 32_768) {
      return { valid: false, error: 'Message content too long. Maximum 32,768 characters per message.' };
    }
  }

  return { valid: true };
}

/**
 * Classname merge helper
 */
export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
