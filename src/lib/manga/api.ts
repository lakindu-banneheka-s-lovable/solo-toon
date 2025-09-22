import { providerRegistry } from './providers/registry';
import { dedupeAndMerge, LRUCache } from './dedupe';
import { Manga, Chapter, PageImage, MangaSchema } from './schema';

// Cache instances
const searchCache = new LRUCache<string, { data: Manga[]; pagination: any }>(50);
const detailsCache = new LRUCache<string, Manga>(100);
const chaptersCache = new LRUCache<string, Chapter[]>(100);

interface SearchOptions {
  page?: number;
  lang?: string;
  providers?: string[];
  limit?: number;
}

interface PaginationInfo {
  current_page: number;
  has_next_page: boolean;
  last_visible_page: number;
  items: {
    count: number;
    total: number;
    per_page: number;
  };
}

// Main API functions
export async function searchMangaMulti(
  query: string,
  opts: SearchOptions = {}
): Promise<{ data: Manga[]; pagination: PaginationInfo }> {
  const { page = 1, lang, providers, limit = 20 } = opts;
  
  if (!query?.trim()) {
    return {
      data: [],
      pagination: {
        current_page: page,
        has_next_page: false,
        last_visible_page: page,
        items: { count: 0, total: 0, per_page: limit }
      }
    };
  }

  // Generate cache key
  const cacheKey = `${query}:${page}:${lang || 'all'}:${providers?.join(',') || 'all'}`;
  const cached = searchCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Determine which providers to use
  let targetProviders = providerRegistry.getAllProviders();
  
  if (providers && providers.length > 0) {
    targetProviders = providers
      .map(id => providerRegistry.getProvider(id))
      .filter(Boolean) as any[];
  } else if (lang) {
    targetProviders = providerRegistry.getProvidersByLanguage(lang);
  }

  // Search across providers in parallel
  const searchPromises = targetProviders.map(async provider => {
    try {
      const results = await provider.search(query, page, lang);
      return { data: results, provider: provider.id };
    } catch (error) {
      console.error(`Search failed for provider ${provider.id}:`, error);
      return { data: [], provider: provider.id };
    }
  });

  const results = await Promise.allSettled(searchPromises);
  const successfulResults = results
    .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
    .map(result => result.value);

  // Deduplicate and merge results
  const deduplicatedManga = dedupeAndMerge(successfulResults);
  
  // Paginate results
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedData = deduplicatedManga.slice(startIndex, endIndex);

  const response = {
    data: paginatedData,
    pagination: {
      current_page: page,
      has_next_page: endIndex < deduplicatedManga.length,
      last_visible_page: Math.ceil(deduplicatedManga.length / limit),
      items: {
        count: paginatedData.length,
        total: deduplicatedManga.length,
        per_page: limit
      }
    }
  };

  // Cache the result
  searchCache.set(cacheKey, response);
  return response;
}

export async function getMangaDetails(globalId: string): Promise<Manga> {
  // Check cache first
  const cached = detailsCache.get(globalId);
  if (cached) {
    return cached;
  }

  // Parse global ID (format: provider:id)
  const [providerId, seriesId] = globalId.split(':');
  if (!providerId || !seriesId) {
    throw new Error('Invalid manga ID format. Expected: provider:id');
  }

  const provider = providerRegistry.getProvider(providerId);
  if (!provider) {
    throw new Error(`Provider not found: ${providerId}`);
  }

  try {
    const details = await provider.details(seriesId);
    
    // Convert to normalized format
    const manga: Manga = {
      id: globalId,
      title: details.title,
      cover: details.image || '/placeholder.svg',
      status: details.status || 'Unknown',
      score: details.rating,
      synopsis: details.description,
      tags: (details.genres || []).map(g => typeof g === 'string' ? g : g.name),
      authors: (details.authors || []).map(a => typeof a === 'string' ? a : a.name),
      year: details.releaseDate ? new Date(details.releaseDate).getFullYear() : undefined,
      provider: providerId,
      providerId: seriesId,
      chapters: details.chapters,
      volumes: details.volumes
    };

    // Validate with schema
    const validatedManga = MangaSchema.parse(manga);
    
    // Cache the result
    detailsCache.set(globalId, validatedManga);
    return validatedManga;
  } catch (error) {
    console.error(`Failed to get manga details for ${globalId}:`, error);
    throw error;
  }
}

export async function getChapters(
  globalSeriesId: string,
  opts: { lang?: string; order?: 'asc' | 'desc' } = {}
): Promise<Chapter[]> {
  // Check cache first
  const cacheKey = `${globalSeriesId}:${opts.lang || 'all'}:${opts.order || 'asc'}`;
  const cached = chaptersCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Parse global ID
  const [providerId, seriesId] = globalSeriesId.split(':');
  if (!providerId || !seriesId) {
    throw new Error('Invalid series ID format. Expected: provider:id');
  }

  const provider = providerRegistry.getProvider(providerId);
  if (!provider) {
    throw new Error(`Provider not found: ${providerId}`);
  }

  try {
    const providerChapters = await provider.chapters(seriesId, opts);
    
    // Convert to normalized format
    const chapters: Chapter[] = providerChapters.map(chapter => ({
      id: `${providerId}:${chapter.id}`,
      seriesId: globalSeriesId,
      chapterNumber: chapter.chapterNumber?.toString() || '0',
      title: chapter.title || `Chapter ${chapter.chapterNumber}`,
      pagesCount: chapter.pages,
      publishedAt: chapter.releaseDate || new Date().toISOString(),
      externalUrl: chapter.url,
      provider: providerId,
      providerId: chapter.id
    }));

    // Cache the result
    chaptersCache.set(cacheKey, chapters);
    return chapters;
  } catch (error) {
    console.error(`Failed to get chapters for ${globalSeriesId}:`, error);
    return [];
  }
}

export async function getChapterPages(
  globalChapterId: string,
  opts: { dataSaver?: boolean } = {}
): Promise<PageImage[]> {
  // Parse global chapter ID
  const [providerId, chapterId] = globalChapterId.split(':');
  if (!providerId || !chapterId) {
    throw new Error('Invalid chapter ID format. Expected: provider:id');
  }

  const provider = providerRegistry.getProvider(providerId);
  if (!provider) {
    throw new Error(`Provider not found: ${providerId}`);
  }

  if (!provider.supportsPages) {
    throw new Error(`Provider ${providerId} does not support reading pages`);
  }

  try {
    const providerPages = await provider.pages(chapterId, opts);
    
    // Convert to normalized format
    const pages: PageImage[] = providerPages.map((page, index) => ({
      index: page.page || index,
      originalUrl: page.img,
      dataSaverUrl: opts.dataSaver ? page.img : undefined // Some providers may have different URLs
    }));

    return pages.sort((a, b) => a.index - b.index);
  } catch (error) {
    console.error(`Failed to get pages for ${globalChapterId}:`, error);
    return [];
  }
}

// Utility functions for backward compatibility
export { providerRegistry as MANGA_PROVIDERS };

export function getImageUrl(originalUrl: string, dataSaver: boolean = false): string {
  if (!originalUrl) return '/placeholder.svg';
  
  // Use image proxy for CORS and caching
  const proxyUrl = `/api/image?src=${encodeURIComponent(originalUrl)}`;
  return dataSaver ? `${proxyUrl}&quality=low` : proxyUrl;
}

// Clear all caches
export function clearCache(): void {
  searchCache.clear();
  detailsCache.clear();
  chaptersCache.clear();
}