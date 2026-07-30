import { env } from "@/lib/env";

export interface SearchResult {
  title: string;
  url: string;
  content: string;
  score?: number;
  publishedAt?: string;
}

export interface SearchProvider {
  search(query: string, options?: { maxResults?: number; days?: number }): Promise<SearchResult[]>;
}

const BRAVE_REQUEST_INTERVAL_MS = 1_100;
const BRAVE_MAX_ATTEMPTS = 4;

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function retryDelay(response: Response, attempt: number): number {
  const retryAfter = response.headers.get("retry-after");
  const seconds = retryAfter ? Number(retryAfter) : Number.NaN;
  return Number.isFinite(seconds)
    ? Math.max(BRAVE_REQUEST_INTERVAL_MS, seconds * 1_000)
    : BRAVE_REQUEST_INTERVAL_MS * attempt;
}

export class BraveSearchProvider implements SearchProvider {
  private queue: Promise<void> = Promise.resolve();
  private nextRequestAt = 0;

  search(
    query: string,
    options: { maxResults?: number; days?: number } = {}
  ): Promise<SearchResult[]> {
    const request = this.queue.then(() => this.searchWithRetry(query, options));
    this.queue = request.then(
      () => undefined,
      () => undefined
    );
    return request;
  }

  private async searchWithRetry(
    query: string,
    options: { maxResults?: number; days?: number }
  ): Promise<SearchResult[]> {
    const freshness =
      (options.days ?? 7) <= 1
        ? "pd"
        : (options.days ?? 7) <= 7
          ? "pw"
          : (options.days ?? 7) <= 31
            ? "pm"
            : "py";
    const url = new URL("https://api.search.brave.com/res/v1/web/search");
    url.searchParams.set("q", query);
    url.searchParams.set("count", String(Math.min(options.maxResults ?? 5, 20)));
    url.searchParams.set("freshness", freshness);
    url.searchParams.set("search_lang", "en");
    url.searchParams.set("country", "US");
    url.searchParams.set("safesearch", "moderate");
    url.searchParams.set("extra_snippets", "true");

    for (let attempt = 1; attempt <= BRAVE_MAX_ATTEMPTS; attempt += 1) {
      const pacingDelay = Math.max(0, this.nextRequestAt - Date.now());
      if (pacingDelay) await wait(pacingDelay);
      this.nextRequestAt = Date.now() + BRAVE_REQUEST_INTERVAL_MS;

      const response = await fetch(url, {
        headers: {
          accept: "application/json",
          "X-Subscription-Token": env().BRAVE_SEARCH_API_KEY ?? ""
        },
        signal: AbortSignal.timeout(25_000)
      });
      if (response.status === 429 && attempt < BRAVE_MAX_ATTEMPTS) {
        await wait(retryDelay(response, attempt));
        continue;
      }
      if (!response.ok) {
        throw new Error(`Brave Search failed with ${response.status}`);
      }
      const data = (await response.json()) as {
        web?: {
          results: Array<{
            title: string;
            url: string;
            description: string;
            extra_snippets?: string[];
            age?: string;
            page_age?: string;
          }>;
        };
      };
      return (data.web?.results ?? []).map((result, index) => ({
        title: result.title,
        url: result.url,
        content: [result.description, ...(result.extra_snippets ?? [])].join("\n"),
        score: 1 / (index + 1),
        publishedAt: result.page_age ?? result.age
      }));
    }
    return [];
  }
}

export class MockSearchProvider implements SearchProvider {
  async search(query: string): Promise<SearchResult[]> {
    return [
      {
        title: "Mock trend signal: show the workflow, not the promise",
        url: "https://example.com/mock/product-demo",
        content: `Creators discussing ${query} are favoring short, credible product proof over cinematic generated ads.`,
        score: 0.9,
        publishedAt: new Date().toISOString()
      },
      {
        title: "Mock trend signal: interface friction memes",
        url: "https://example.com/mock/meme",
        content:
          "Current productivity memes focus on tab overload, context switching, and losing the thread of work.",
        score: 0.82,
        publishedAt: new Date().toISOString()
      }
    ];
  }
}

export function searchProvider(): SearchProvider {
  return env().SEARCH_PROVIDER === "brave"
    ? new BraveSearchProvider()
    : new MockSearchProvider();
}

export async function dailyTrendResearch(provider = searchProvider()) {
  const queries = [
    "AI assistants voice agents launches creator conversation",
    "Windows productivity desktop software trends",
    "current X memes image formats productivity AI",
    "short form UGC creator formats software demos",
    "AI productivity competitor launches screen aware assistant"
  ];
  const settled = await Promise.allSettled(
    queries.map((query) => provider.search(query, { maxResults: 5, days: 7 }))
  );
  const results = settled.flatMap((result) =>
    result.status === "fulfilled" ? result.value : []
  );
  return results;
}
