/**
 * Smart Query Classifier for Vishal AI
 * Detects query type AND complexity to route to the best model
 */

export type QueryType = 'search' | 'coding' | 'reasoning' | 'general';
export type Complexity = 'simple' | 'complex';

export interface QueryClassification {
  type: QueryType;
  complexity: Complexity;
}

// Keywords that indicate a need for real-time/current information
const SEARCH_TRIGGERS = [
  // Time-sensitive
  'latest', 'recent', 'current', 'today', 'now', 'right now', 'this week',
  'this month', 'this year', '2024', '2025', '2026', 'yesterday', 'tomorrow',
  // News & events
  'news', 'update', 'breaking', 'announced', 'released', 'launched',
  'trending', 'viral', 'happening', 'just happened',
  // Sports
  'score', 'match', 'game result', 'ipl', 'world cup', 'cricket', 'football score',
  'standings', 'fixture', 'tournament', 'champion', 'won the',
  // Finance
  'stock price', 'share price', 'market', 'bitcoin', 'crypto', 'nifty', 'sensex',
  'exchange rate', 'dollar to rupee', 'gold price', 'oil price',
  // Weather
  'weather', 'temperature', 'forecast', 'rain', 'climate today',
  // Politics & government
  'election', 'minister', 'government', 'policy', 'legislation', 'vote',
  'president', 'prime minister', 'chief minister',
  // Tech & entertainment
  'release date', 'trailer', 'movie', 'series', 'album', 'song',
  'iphone', 'android',
  // Factual lookups
  'who is', 'what is', 'what happened', 'when did', 'where is',
  'how much', 'how many', 'population', 'ceo of', 'founder of',
  'capital of', 'gdp', 'salary', 'net worth', 'biography', 'history of',
  'tell me about', 'search for', 'look up', 'find out',
];

// Keywords for coding queries
const CODING_TRIGGERS = [
  'code', 'function', 'debug', 'error', 'fix this', 'write a program',
  'algorithm', 'api', 'database', 'sql', 'html', 'css', 'javascript',
  'python', 'java', 'typescript', 'react', 'node', 'next.js', 'git',
  'bug', 'syntax', 'compile', 'runtime', 'exception', 'import',
  'class', 'interface', 'component', 'hook', 'useState', 'useEffect',
  'npm', 'package', 'install', 'deploy', 'docker', 'kubernetes',
  'regex', 'parse', 'json', 'xml', 'fetch', 'axios', 'async',
  'promise', 'callback', 'loop', 'array', 'object', 'string',
];

// Keywords for reasoning/math
const REASONING_TRIGGERS = [
  'solve', 'calculate', 'prove', 'derive', 'equation', 'formula',
  'math', 'algebra', 'calculus', 'geometry', 'probability', 'statistics',
  'logic', 'puzzle', 'riddle', 'brain teaser', 'step by step',
  'explain why', 'analyze', 'compare', 'evaluate', 'assess',
  'pros and cons', 'advantages', 'disadvantages', 'difference between',
];

// Indicators that a query is complex (needs a stronger model)
const COMPLEXITY_TRIGGERS = [
  // Deep analysis
  'analyze', 'in depth', 'in-depth', 'detailed', 'comprehensive', 'thorough',
  'explain in detail', 'break down', 'elaborate',
  // Multi-step reasoning
  'step by step', 'walk me through', 'how does', 'why does', 'explain how',
  // Creative/nuanced
  'write an essay', 'write a story', 'create a plan', 'design a',
  'strategy', 'architecture', 'system design',
  // Comparisons and evaluations
  'compare', 'contrast', 'pros and cons', 'trade-offs', 'tradeoffs',
  'which is better', 'should i use', 'recommend',
  // Multi-part questions
  'and also', 'additionally', 'furthermore', 'moreover',
];

// Simple greetings and short prompts that don't need a big model
const SIMPLE_PATTERNS = [
  /^(hi|hello|hey|yo|sup|hola|namaste|good morning|good evening|good afternoon|thanks|thank you|ok|okay|bye|goodbye|gm|gn)\b/i,
  /^.{0,15}$/,  // Very short messages (under 15 chars)
];

export function classifyQuery(message: string): QueryType {
  return fullClassify(message).type;
}

/**
 * Full classification: returns both type and complexity
 */
export function fullClassify(message: string): QueryClassification {
  const lower = message.toLowerCase().trim();

  // ─── Check for simple greetings first ─────────
  for (const pattern of SIMPLE_PATTERNS) {
    if (pattern.test(lower)) {
      return { type: 'general', complexity: 'simple' };
    }
  }

  // ─── Score each category ──────────────────────
  const searchScore = SEARCH_TRIGGERS.filter(t => lower.includes(t)).length;
  const codingScore = CODING_TRIGGERS.filter(t => lower.includes(t)).length;
  const reasoningScore = REASONING_TRIGGERS.filter(t => lower.includes(t)).length;
  const complexityScore = COMPLEXITY_TRIGGERS.filter(t => lower.includes(t)).length;

  // ─── Determine type ───────────────────────────
  let type: QueryType = 'general';

  // Priority: search > reasoning > coding > general
  if (searchScore >= 1) {
    type = 'search';
  } else if (reasoningScore >= 1) {
    type = 'reasoning';
  } else if (codingScore >= 2) {
    type = 'coding';
  }

  // Questions about facts/entities that weren't caught by keywords
  if (type === 'general' && lower.includes('?') && lower.length > 20) {
    if (/\b(who|what|when|where|how much|how many|is it true|did)\b/.test(lower)) {
      type = 'search';
    }
  }

  // ─── Determine complexity ─────────────────────
  let complexity: Complexity = 'simple';

  if (complexityScore >= 1) {
    complexity = 'complex';
  } else if (lower.length > 150) {
    // Long messages are usually more complex
    complexity = 'complex';
  } else if (type === 'reasoning') {
    // Reasoning queries are inherently complex
    complexity = 'complex';
  } else if ((lower.match(/\?/g) || []).length >= 2) {
    // Multiple questions = complex
    complexity = 'complex';
  }

  return { type, complexity };
}

/**
 * Get mode-specific system prompt additions
 */
export function getModePrompt(type: QueryType): string {
  switch (type) {
    case 'search':
      return `\n\nSEARCH MODE ACTIVE: You have access to web search results below. Use them to give accurate, current information. Always cite your sources naturally (e.g., "According to..." or "Based on recent reports..."). If the search results don't have the answer, say so honestly.`;
    case 'coding':
      return `\n\nCODING MODE ACTIVE: Provide clean, working code with clear explanations. Use proper syntax highlighting. Include error handling. Explain your approach briefly before the code.`;
    case 'reasoning':
      return `\n\nREASONING MODE ACTIVE: Think through this step by step. Show your work clearly. Use numbered steps for complex problems. Double-check your logic.`;
    default:
      return '';
  }
}
