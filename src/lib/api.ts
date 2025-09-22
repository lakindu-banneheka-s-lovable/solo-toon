// Legacy API - kept for backward compatibility
// New API is in @/lib/manga/api
import { MangaSearchResult, MangaDetails, Chapter as LegacyChapter, ConsumetMangaProvider } from '@/types/manga';
import { searchMangaMulti, getMangaDetails as getNewMangaDetails, getChapters as getNewChapters, MANGA_PROVIDERS as NEW_PROVIDERS } from '@/lib/manga/api';

// Export provider registry for compatibility
export const MANGA_PROVIDERS: ConsumetMangaProvider[] = [
  { id: 'mangadex', name: 'MangaDex', languages: ['en', 'ja', 'ko', 'zh', 'es', 'fr', 'de', 'pt-br', 'ru'] },
  { id: 'comick', name: 'ComicK', languages: ['en', 'ja', 'ko', 'zh'] },
  { id: 'mangasee123', name: 'MangaSee123', languages: ['en'] },
  { id: 'mangakakalot', name: 'Mangakakalot', languages: ['en'] },
  { id: 'mangapark', name: 'MangaPark', languages: ['en', 'ja', 'ko', 'zh'] }
];

export async function searchManga(
  query: string, 
  page = 1, 
  provider = 'mangadex',
  language?: string
): Promise<{
  data: MangaSearchResult[];
  pagination: {
    current_page: number;
    has_next_page: boolean;
    last_visible_page: number;
    items: {
      count: number;
      total: number;
      per_page: number;
    };
  };
}> {
  const encodedQuery = encodeURIComponent(query.trim());
  let url = `${CONSUMET_BASE_URL}/manga/${provider}/${encodedQuery}?page=${page}`;
  
  if (language) {
    url += `&lang=${language}`;
  }
  
  try {
    const response = await apiRequest<any>(url);
    
    // Transform Consumet response to our format
    return {
      data: transformConsumetResults(response.results || [], provider),
      pagination: {
        current_page: response.currentPage || page,
        has_next_page: response.hasNextPage || false,
        last_visible_page: response.totalPages || page,
        items: {
          count: response.results?.length || 0,
          total: response.totalResults || 0,
          per_page: 20
        }
      }
    };
  } catch (error) {
    console.error('Search failed:', error);
    return {
      data: [],
      pagination: {
        current_page: page,
        has_next_page: false,
        last_visible_page: page,
        items: { count: 0, total: 0, per_page: 20 }
      }
    };
  }
}

export async function getPopularManga(page = 1, provider = 'mangadx'): Promise<{
  data: MangaSearchResult[];
  pagination: {
    current_page: number;
    has_next_page: boolean;
    last_visible_page: number;
    items: {
      count: number;
      total: number;
      per_page: number;
    };
  };
}> {
  try {
    // Get popular manga by searching for popular terms using new API
    const popularQueries = ['one piece', 'naruto', 'attack on titan', 'demon slayer'];
    const randomQuery = popularQueries[Math.floor(Math.random() * popularQueries.length)];
    
    const result = await searchMangaMulti(randomQuery, { page, providers: [provider === 'mangadx' ? 'mangadex' : provider] });
    
    return {
      data: result.data.map(manga => transformMangaToLegacy(manga)),
      pagination: result.pagination
    };
  } catch (error) {
    console.error('Failed to get popular manga:', error);
    return {
      data: [],
      pagination: {
        current_page: page,
        has_next_page: false,
        last_visible_page: page,
        items: { count: 0, total: 0, per_page: 20 }
      }
    };
  }
}

export async function searchSuggestions(query: string, provider = 'mangadx'): Promise<{ data: MangaSearchResult[] }> {
  if (!query.trim()) return { data: [] };
  
  try {
    const result = await searchMangaMulti(query, { 
      page: 1, 
      providers: [provider === 'mangadx' ? 'mangadex' : provider],
      limit: 5 
    });
    
    return { 
      data: result.data.map(manga => transformMangaToLegacy(manga))
    };
  } catch (error) {
    console.error('Failed to get suggestions:', error);
    return { data: [] };
  }
}

export async function getMangaDetails(mangaId: string, provider = 'mangadx'): Promise<{ data: MangaDetails }> {
  try {
    const globalId = `${provider === 'mangadx' ? 'mangadex' : provider}:${mangaId}`;
    const manga = await getNewMangaDetails(globalId);
    const chapters = await getNewChapters(globalId);
    
    return { 
      data: {
        ...transformMangaToLegacy(manga),
        chaptersData: chapters.map(chapter => ({
          id: chapter.providerId,
          title: chapter.title,
          chapter: chapter.chapterNumber,
          pages: chapter.pagesCount || 20,
          publishAt: chapter.publishedAt,
          externalUrl: chapter.externalUrl,
          provider: chapter.provider,
          providerId: chapter.providerId
        }))
      }
    };
  } catch (error) {
    console.error('Failed to get manga details:', error);
    throw error;
  }
}

export async function getMangaChapters(mangaId: string, provider = 'mangadx'): Promise<Chapter[]> {
  try {
    const globalId = `${provider === 'mangadx' ? 'mangadex' : provider}:${mangaId}`;
    const chapters = await getNewChapters(globalId);
    
    return chapters.map(chapter => ({
      id: chapter.providerId,
      title: chapter.title,
      chapter: chapter.chapterNumber,
      pages: chapter.pagesCount || 20,
      publishAt: chapter.publishedAt,
      externalUrl: chapter.externalUrl,
      provider: chapter.provider,
      providerId: chapter.providerId
    }));
  } catch (error) {
    console.error('Failed to get manga chapters:', error);
    return [];
  }
}

// Transform new manga format to legacy format
function transformMangaToLegacy(manga: any): MangaSearchResult {
  return {
    mal_id: manga.providerId,
    title: manga.title,
    title_english: manga.titleEnglish,
    images: {
      jpg: {
        image_url: manga.cover,
        small_image_url: manga.cover,
        large_image_url: manga.cover
      }
    },
    status: manga.status,
    chapters: manga.chapters,
    volumes: manga.volumes,
    score: manga.score,
    synopsis: manga.synopsis,
    genres: manga.tags.map((tag: string, idx: number) => ({
      mal_id: idx,
      name: tag
    })),
    authors: manga.authors.map((author: string, idx: number) => ({
      mal_id: idx,
      name: author
    })),
    published: {
      from: manga.year ? `${manga.year}-01-01` : new Date().toISOString(),
      to: manga.status === 'Completed' ? `${manga.year || new Date().getFullYear()}-12-31` : undefined
    },
    provider: manga.provider,
    providerId: manga.providerId
  };
}

function transformConsumetMangaDetails(item: any, provider: string): MangaDetails {
  return {
    mal_id: item.id || `${provider}-details`,
    title: item.title || 'Unknown Title',
    title_english: item.title || undefined,
    images: {
      jpg: {
        image_url: item.image || '/placeholder.svg',
        small_image_url: item.image || '/placeholder.svg',
        large_image_url: item.image || '/placeholder.svg'
      }
    },
    status: item.status || 'Unknown',
    chapters: item.chapters?.length || undefined,
    volumes: item.volumes || undefined,
    score: item.rating || undefined,
    synopsis: item.description || undefined,
    genres: (item.genres || []).map((genre: any, idx: number) => ({
      mal_id: idx,
      name: typeof genre === 'string' ? genre : genre.name || genre
    })),
    authors: (item.authors || []).map((author: any, idx: number) => ({
      mal_id: idx,
      name: typeof author === 'string' ? author : author.name || author
    })),
    published: {
      from: item.releaseDate || new Date().toISOString(),
      to: item.status === 'Completed' ? item.releaseDate : undefined
    },
    provider,
    providerId: item.id,
    chaptersData: transformConsumetChapters(item.chapters || [], item.id, provider)
  };
}

function transformConsumetChapters(chapters: any[], mangaId: string, provider: string): Chapter[] {
  return chapters.map((chapter: any) => ({
    id: chapter.id || `${mangaId}-${chapter.chapterNumber}`,
    title: chapter.title || `Chapter ${chapter.chapterNumber}`,
    chapter: chapter.chapterNumber?.toString() || '0',
    pages: chapter.pages || 20,
    publishAt: chapter.releaseDate || new Date().toISOString(),
    externalUrl: chapter.url,
    providerId: chapter.id,
    provider
  }));
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
  page = 1,
  provider = 'mangadx',
  language?: string,
  maxRetries: number = 3
): Promise<{ data: MangaSearchResult[]; pagination: any }> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await searchManga(query, page, provider, language);
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

// Search across multiple providers to avoid duplicates
export async function searchMultipleProviders(
  query: string,
  page = 1,
  language?: string
): Promise<{ data: MangaSearchResult[]; pagination: any }> {
  const providers = ['mangadx', 'comick', 'mangasee123'];
  const results: MangaSearchResult[] = [];
  const seenTitles = new Set<string>();
  
  for (const provider of providers) {
    try {
      const response = await searchManga(query, page, provider, language);
      
      // Deduplicate based on title similarity
      response.data.forEach(manga => {
        const normalizedTitle = manga.title.toLowerCase().replace(/[^\w\s]/g, '');
        if (!seenTitles.has(normalizedTitle)) {
          seenTitles.add(normalizedTitle);
          results.push(manga);
        }
      });
      
      if (results.length >= 20) break; // Limit results
    } catch (error) {
      console.error(`Failed to search ${provider}:`, error);
    }
  }
  
  return {
    data: results.slice(0, 20),
    pagination: {
      current_page: page,
      has_next_page: results.length >= 20,
      last_visible_page: page + 1,
      items: {
        count: results.length,
        total: results.length,
        per_page: 20
      }
    }
  };
}