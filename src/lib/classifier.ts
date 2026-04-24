/**
 * Smart Query Classifier for Vishal AI
 * Detects whether a query needs web search, coding mode, or general chat
 */

export type QueryType = 'search' | 'coding' | 'reasoning' | 'general';

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
  'president', 'prime minister', 'chief minister', 'party',
  // Tech & entertainment
  'release date', 'trailer', 'movie', 'series', 'album', 'song',
  'iphone', 'android', 'update', 'version', 'app',
  // Factual lookups
  'who is', 'what is', 'what happened', 'when did', 'where is',
  'how much', 'how many', 'population', 'ceo of', 'founder of',
  'capital of', 'gdp', 'salary', 'net worth', 'party', 'actor',
  'cast', 'biography', 'history of', 'tell me about',
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

export function classifyQuery(message: string): QueryType {
  const lower = message.toLowerCase();

  // Check for search triggers
  const searchScore = SEARCH_TRIGGERS.filter(t => lower.includes(t)).length;
  const codingScore = CODING_TRIGGERS.filter(t => lower.includes(t)).length;
  const reasoningScore = REASONING_TRIGGERS.filter(t => lower.includes(t)).length;

  // Priority: search > coding > reasoning > general
  if (searchScore >= 1) return 'search';
  if (codingScore >= 2) return 'coding';
  if (reasoningScore >= 1) return 'reasoning';

  // If it's a question that might need facts (contains ?)
  if (lower.includes('?') && lower.length > 20) {
    // Simple heuristic: questions about things/people/places likely need search
    if (/\b(who|what|when|where|how much|how many)\b/.test(lower)) {
      return 'search';
    }
  }

  return 'general';
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
