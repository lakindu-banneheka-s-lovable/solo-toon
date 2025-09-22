import { MangaApiError } from './schema';

interface FetchOptions {
  timeoutMs?: number;
  headers?: Record<string, string>;
}

// Per-host rate limiter using token bucket algorithm
class RateLimiter {
  private buckets = new Map<string, { tokens: number; lastRefill: number }>();
  private maxTokens = 3; // 3 requests per second
  private refillRate = 3000; // 3 seconds to refill bucket

  async throttle(hostname: string): Promise<void> {
    const now = Date.now();
    let bucket = this.buckets.get(hostname);

    if (!bucket) {
      bucket = { tokens: this.maxTokens, lastRefill: now };
      this.buckets.set(hostname, bucket);
    }

    // Refill tokens based on time passed
    const timePassed = now - bucket.lastRefill;
    const tokensToAdd = Math.floor(timePassed / (this.refillRate / this.maxTokens));
    bucket.tokens = Math.min(this.maxTokens, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;

    if (bucket.tokens < 1) {
      // Calculate wait time
      const waitTime = this.refillRate / this.maxTokens;
      await new Promise(resolve => setTimeout(resolve, waitTime));
      bucket.tokens = 1;
    }

    bucket.tokens -= 1;
  }
}

const rateLimiter = new RateLimiter();

export async function fetchJson<T>(
  url: string, 
  options: FetchOptions = {}
): Promise<T> {
  const { timeoutMs = 10000, headers = {} } = options;
  
  // Extract hostname for rate limiting
  const hostname = new URL(url).hostname;
  await rateLimiter.throttle(hostname);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'SoloToon/1.0',
        ...headers
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Handle rate limiting with exponential backoff
      if (response.status === 429 || response.status === 503) {
        const retryAfter = response.headers.get('Retry-After');
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Retry once
        return fetchJson<T>(url, options);
      }

      throw new MangaApiError(
        'HTTP_ERROR',
        hostname,
        response.status,
        url,
        `HTTP ${response.status}: ${response.statusText}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof MangaApiError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new MangaApiError(
        'TIMEOUT',
        hostname,
        undefined,
        url,
        'Request timeout'
      );
    }

    throw new MangaApiError(
      'NETWORK_ERROR',
      hostname,
      undefined,
      url,
      error instanceof Error ? error.message : 'Network error'
    );
  }
}