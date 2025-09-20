import { MangaSearchResult, MangaDetails, Chapter } from '@/types/manga';

const JIKAN_BASE_URL = 'https://api.jikan.moe/v4';

// Rate limiting helper
class RateLimiter {
  private lastRequest = 0;
  private minInterval = 334; // ~3 requests per second (Jikan limit)

  async throttle() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequest;
    
    if (timeSinceLastRequest < this.minInterval) {
      await new Promise(resolve => 
        setTimeout(resolve, this.minInterval - timeSinceLastRequest)
      );
    }
    
    this.lastRequest = Date.now();
  }
}

const rateLimiter = new RateLimiter();

async function apiRequest<T>(url: string): Promise<T> {
  await rateLimiter.throttle();
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  
  return response.json();
}

export async function searchManga(query: string, page = 1): Promise<{
  data: MangaSearchResult[];
  pagination: {
    current_page: number;
    has_next_page: boolean;
    last_visible_page: number;
  };
}> {
  const encodedQuery = encodeURIComponent(query.trim());
  const url = `${JIKAN_BASE_URL}/manga?q=${encodedQuery}&page=${page}&limit=20&order_by=popularity&sort=desc`;
  
  return apiRequest(url);
}

export async function getMangaDetails(mangaId: number): Promise<{ data: MangaDetails }> {
  const url = `${JIKAN_BASE_URL}/manga/${mangaId}`;
  return apiRequest(url);
}

export async function getMangaCharacters(mangaId: number) {
  const url = `${JIKAN_BASE_URL}/manga/${mangaId}/characters`;
  return apiRequest(url);
}

// Mock chapter data since Jikan doesn't provide chapter lists
export function generateMockChapters(mangaId: number, totalChapters: number = 50): Chapter[] {
  const chapters: Chapter[] = [];
  
  for (let i = 1; i <= Math.min(totalChapters, 100); i++) {
    chapters.push({
      id: `${mangaId}-ch-${i}`,
      title: `Chapter ${i}`,
      chapter: i.toString(),
      pages: Math.floor(Math.random() * 20) + 15, // 15-35 pages
      publishAt: new Date(Date.now() - (totalChapters - i) * 7 * 24 * 60 * 60 * 1000).toISOString(),
      externalUrl: `https://example.com/manga/${mangaId}/chapter/${i}` // Placeholder
    });
  }
  
  return chapters.reverse(); // Latest first
}

// Image proxy for CORS and caching
export function getImageUrl(originalUrl: string, dataSaver: boolean = false): string {
  if (!originalUrl) return '/placeholder.svg';
  
  // For demo purposes, return original URL
  // In production, you'd use your own image proxy
  return originalUrl;
}

export async function searchWithRetry(
  query: string, 
  maxRetries: number = 3
): Promise<{ data: MangaSearchResult[]; pagination: any }> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await searchManga(query);
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries) {
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }
  
  throw lastError!;
}