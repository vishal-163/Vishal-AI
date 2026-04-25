/**
 * Web Search Integration for Vishal AI
 * Uses Brave Search API for real-time information retrieval
 */

interface SearchResult {
  title: string;
  url: string;
  description: string;
}

interface SearchResponse {
  results: SearchResult[];
  query: string;
}

export async function webSearch(query: string): Promise<SearchResponse> {
  const braveKey = process.env.BRAVE_SEARCH_API_KEY;
  const serperKey = process.env.SERPER_API_KEY;

  if (!braveKey && !serperKey) {
    console.warn('⚠️ No search API key found (BRAVE_SEARCH_API_KEY or SERPER_API_KEY). Search is disabled.');
    return { results: [], query };
  }

  try {
    // --- Option A: Serper.dev (Google Results) ---
    if (serperKey) {
      const res = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': serperKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ q: query, num: 5 }),
      });

      if (res.ok) {
        const data = await res.json();
        const results = (data.organic || []).map((r: any) => ({
          title: r.title,
          url: r.link,
          description: (r.snippet || '').replace(/<[^>]*>?/gm, ''), // Strip HTML tags
        }));
        return { results, query };
      }
    }

    // --- Option B: Brave Search ---
    if (braveKey) {
      const params = new URLSearchParams({ q: query, count: '5' });
      const res = await fetch(`https://api.search.brave.com/res/v1/web/search?${params}`, {
        headers: { 'X-Subscription-Token': braveKey, 'Accept': 'application/json' },
      });

      if (res.ok) {
        const data = await res.json();
        const results = (data.web?.results || []).map((r: any) => ({
          title: r.title,
          url: r.url,
          description: (r.description || '').replace(/<[^>]*>?/gm, ''), // Strip HTML tags
        }));
        return { results, query };
      }
    }

    return { results: [], query };
  } catch (err) {
    console.error('Search error:', err);
    return { results: [], query };
  }
}

/**
 * Format search results into context for the AI
 */
export function formatSearchContext(search: SearchResponse): string {
  if (search.results.length === 0) return '';

  let context = `\n\n[WEB SEARCH RESULTS for "${search.query}"]:\n`;
  search.results.forEach((r, i) => {
    context += `\n${i + 1}. ${r.title}\n   ${r.description}\n   Source: ${r.url}\n`;
  });
  context += '\nUse the above search results to provide an accurate, up-to-date answer. Cite sources when referencing specific information.\n';

  return context;
}
