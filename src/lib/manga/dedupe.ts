import { Manga, ProviderSearchResult } from './schema';

// Normalize title for comparison
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

// Simple Jaro-Winkler similarity implementation
function jaroWinkler(s1: string, s2: string): number {
  if (s1 === s2) return 1.0;
  
  const len1 = s1.length;
  const len2 = s2.length;
  
  if (len1 === 0 || len2 === 0) return 0.0;
  
  const matchDistance = Math.floor(Math.max(len1, len2) / 2) - 1;
  const s1Matches = new Array(len1).fill(false);
  const s2Matches = new Array(len2).fill(false);
  
  let matches = 0;
  let transpositions = 0;
  
  // Find matches
  for (let i = 0; i < len1; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, len2);
    
    for (let j = start; j < end; j++) {
      if (s2Matches[j] || s1[i] !== s2[j]) continue;
      s1Matches[i] = true;
      s2Matches[j] = true;
      matches++;
      break;
    }
  }
  
  if (matches === 0) return 0.0;
  
  // Count transpositions
  let k = 0;
  for (let i = 0; i < len1; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (s1[i] !== s2[k]) transpositions++;
    k++;
  }
  
  const jaro = (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3;
  
  // Winkler prefix
  let prefix = 0;
  for (let i = 0; i < Math.min(len1, len2, 4); i++) {
    if (s1[i] === s2[i]) prefix++;
    else break;
  }
  
  return jaro + 0.1 * prefix * (1 - jaro);
}

// Calculate similarity between two manga
function calculateSimilarity(manga1: ProviderSearchResult, manga2: ProviderSearchResult): number {
  const title1 = normalizeTitle(manga1.title);
  const title2 = normalizeTitle(manga2.title);
  
  let titleSimilarity = jaroWinkler(title1, title2);
  
  // Boost score if authors match
  if (manga1.authors && manga2.authors) {
    const authors1 = manga1.authors.map(a => typeof a === 'string' ? a : a.name).join(' ').toLowerCase();
    const authors2 = manga2.authors.map(a => typeof a === 'string' ? a : a.name).join(' ').toLowerCase();
    
    if (authors1 && authors2) {
      const authorSimilarity = jaroWinkler(authors1, authors2);
      titleSimilarity = Math.max(titleSimilarity, authorSimilarity * 0.8);
    }
  }
  
  // Consider year if available
  if (manga1.releaseDate && manga2.releaseDate) {
    const year1 = new Date(manga1.releaseDate).getFullYear();
    const year2 = new Date(manga2.releaseDate).getFullYear();
    
    if (Math.abs(year1 - year2) <= 1) {
      titleSimilarity += 0.1; // Small boost for same/close year
    }
  }
  
  return Math.min(titleSimilarity, 1.0);
}

// Convert provider result to normalized manga
function providerResultToManga(result: ProviderSearchResult, provider: string): Manga {
  const id = `${provider}:${result.id}`;
  
  return {
    id,
    title: result.title,
    cover: result.image || '/placeholder.svg',
    status: result.status || 'Unknown',
    score: result.rating,
    synopsis: result.description,
    tags: (result.genres || []).map(g => typeof g === 'string' ? g : g.name),
    authors: (result.authors || []).map(a => typeof a === 'string' ? a : a.name),
    year: result.releaseDate ? new Date(result.releaseDate).getFullYear() : undefined,
    provider,
    providerId: result.id,
    chapters: result.chapters,
    volumes: result.volumes,
    sources: [{
      provider,
      id: result.id,
      priority: getProviderPriority(provider)
    }]
  };
}

// Get provider priority for merging
function getProviderPriority(provider: string): number {
  const priorities: Record<string, number> = {
    'mangadx': 100,
    'comick': 90,
    'mangasee123': 80,
    'mangakakalot': 70,
    'mangapark': 60
  };
  return priorities[provider] || 0;
}

// Main deduplication function
export function dedupeAndMerge(
  results: Array<{ data: ProviderSearchResult[]; provider: string }>
): Manga[] {
  const allManga: Manga[] = [];
  const threshold = 0.85; // Similarity threshold for considering items duplicates
  
  for (const { data, provider } of results) {
    for (const result of data) {
      const manga = providerResultToManga(result, provider);
      
      // Find potential duplicate
      let duplicate = null;
      let maxSimilarity = 0;
      
      for (const existing of allManga) {
        const similarity = calculateSimilarity(result, {
          id: existing.providerId,
          title: existing.title,
          authors: existing.authors.map(a => ({ name: a })),
          releaseDate: existing.year ? `${existing.year}-01-01` : undefined
        } as ProviderSearchResult);
        
        if (similarity > maxSimilarity && similarity >= threshold) {
          maxSimilarity = similarity;
          duplicate = existing;
        }
      }
      
      if (duplicate) {
        // Merge with existing item
        const newSource = { provider, id: result.id, priority: getProviderPriority(provider) };
        duplicate.sources = duplicate.sources || [];
        duplicate.sources.push(newSource);
        
        // Update with higher priority source data if needed
        const currentPriority = getProviderPriority(duplicate.provider);
        const newPriority = getProviderPriority(provider);
        
        if (newPriority > currentPriority) {
          duplicate.provider = provider;
          duplicate.providerId = result.id;
          duplicate.cover = result.image || duplicate.cover;
          duplicate.synopsis = result.description || duplicate.synopsis;
          duplicate.score = result.rating || duplicate.score;
          duplicate.chapters = result.chapters || duplicate.chapters;
          duplicate.volumes = result.volumes || duplicate.volumes;
        }
        
        // Sort sources by priority
        duplicate.sources.sort((a, b) => b.priority - a.priority);
      } else {
        // Add as new item
        allManga.push(manga);
      }
    }
  }
  
  return allManga;
}

// In-memory LRU cache implementation
export class LRUCache<K, V> {
  private cache = new Map<K, V>();
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove least recently used (first item)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}