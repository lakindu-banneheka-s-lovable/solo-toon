import { ProviderSearchResult, ProviderChapter, ProviderPage } from '../schema';

export interface MangaProvider {
  id: 'mangadex' | 'comick' | 'mangasee123' | 'mangakakalot' | 'mangapark';
  displayName: string;
  supportsPages: boolean;
  languages: string[];
  priority: number; // Higher = preferred for deduplication
  
  search(query: string, page: number, lang?: string): Promise<ProviderSearchResult[]>;
  details(seriesId: string): Promise<ProviderSearchResult>;
  chapters(seriesId: string, opts?: { lang?: string; order?: 'asc' | 'desc' }): Promise<ProviderChapter[]>;
  pages(chapterId: string, opts?: { dataSaver?: boolean }): Promise<ProviderPage[]>;
}

export interface SearchResponse {
  results: ProviderSearchResult[];
  currentPage: number;
  hasNextPage: boolean;
  totalPages?: number;
  totalResults?: number;
}

export interface DetailsResponse extends Omit<ProviderSearchResult, 'chapters'> {
  chapters?: ProviderChapter[];
  totalChapters?: number;
}