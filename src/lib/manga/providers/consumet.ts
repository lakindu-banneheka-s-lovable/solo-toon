import { MangaProvider, SearchResponse, DetailsResponse } from './base';
import { ProviderSearchResult, ProviderChapter, ProviderPage, ProviderSearchResultSchema, ProviderChapterSchema, ProviderPageSchema } from '../schema';
import { fetchJson } from '../http';

const CONSUMET_BASE_URL = 'https://apiconsumetorg-kappa.vercel.app';

abstract class ConsumetProvider implements MangaProvider {
  abstract id: 'mangadex' | 'comick' | 'mangasee123' | 'mangakakalot' | 'mangapark';
  abstract displayName: string;
  abstract supportsPages: boolean;
  abstract languages: string[];
  abstract priority: number;

  protected getBaseUrl(): string {
    return `${CONSUMET_BASE_URL}/manga/${this.id}`;
  }

  async search(query: string, page: number = 1, lang?: string): Promise<ProviderSearchResult[]> {
    const encodedQuery = encodeURIComponent(query.trim());
    let url = `${this.getBaseUrl()}/${encodedQuery}?page=${page}`;
    
    if (lang && this.languages.includes(lang)) {
      url += `&lang=${lang}`;
    }

    try {
      const response = await fetchJson<SearchResponse>(url);
      const results = response.results || [];
      
      // Validate and normalize results
      return results.map(result => {
        try {
          return ProviderSearchResultSchema.parse(result);
        } catch (error) {
          console.warn(`Invalid result from ${this.id}:`, error);
          return null;
        }
      }).filter(Boolean) as ProviderSearchResult[];
    } catch (error) {
      console.error(`Search failed for ${this.id}:`, error);
      return [];
    }
  }

  async details(seriesId: string): Promise<ProviderSearchResult> {
    const url = `${this.getBaseUrl()}/info/${seriesId}`;
    
    try {
      const response = await fetchJson<DetailsResponse>(url);
      return ProviderSearchResultSchema.parse(response);
    } catch (error) {
      console.error(`Details failed for ${this.id}:`, error);
      throw error;
    }
  }

  async chapters(seriesId: string, opts?: { lang?: string; order?: 'asc' | 'desc' }): Promise<ProviderChapter[]> {
    const url = `${this.getBaseUrl()}/info/${seriesId}`;
    
    try {
      const response = await fetchJson<DetailsResponse>(url);
      const chapters = response.chapters || [];
      
      // Validate and normalize chapters
      const validatedChapters = chapters.map(chapter => {
        try {
          return ProviderChapterSchema.parse(chapter);
        } catch (error) {
          console.warn(`Invalid chapter from ${this.id}:`, error);
          return null;
        }
      }).filter(Boolean) as ProviderChapter[];

      // Sort chapters by number
      const order = opts?.order || 'asc';
      return validatedChapters.sort((a, b) => {
        const aNum = parseFloat(a.chapterNumber?.toString() || '0');
        const bNum = parseFloat(b.chapterNumber?.toString() || '0');
        return order === 'asc' ? aNum - bNum : bNum - aNum;
      });
    } catch (error) {
      console.error(`Chapters failed for ${this.id}:`, error);
      return [];
    }
  }

  async pages(chapterId: string, opts?: { dataSaver?: boolean }): Promise<ProviderPage[]> {
    if (!this.supportsPages) {
      throw new Error(`Provider ${this.id} does not support page reading`);
    }

    const url = `${this.getBaseUrl()}/read/${chapterId}`;
    
    try {
      const response = await fetchJson<ProviderPage[]>(url);
      
      // Validate and normalize pages
      return response.map((page, index) => {
        try {
          const validated = ProviderPageSchema.parse(page);
          return {
            ...validated,
            page: validated.page || index
          };
        } catch (error) {
          console.warn(`Invalid page from ${this.id}:`, error);
          return null;
        }
      }).filter(Boolean) as ProviderPage[];
    } catch (error) {
      console.error(`Pages failed for ${this.id}:`, error);
      return [];
    }
  }
}

// Specific provider implementations
export class MangaDexProvider extends ConsumetProvider {
  id = 'mangadex' as const;
  displayName = 'MangaDex';
  supportsPages = true;
  languages = ['en', 'ja', 'ko', 'zh', 'es', 'fr', 'de', 'pt-br', 'ru'];
  priority = 100;
}

export class ComickProvider extends ConsumetProvider {
  id = 'comick' as const;
  displayName = 'ComicK';
  supportsPages = true;
  languages = ['en', 'ja', 'ko', 'zh'];
  priority = 90;
}

export class MangaSee123Provider extends ConsumetProvider {
  id = 'mangasee123' as const;
  displayName = 'MangaSee123';
  supportsPages = true;
  languages = ['en'];
  priority = 80;
}

export class MangakakalotProvider extends ConsumetProvider {
  id = 'mangakakalot' as const;
  displayName = 'Mangakakalot';
  supportsPages = true;
  languages = ['en'];
  priority = 70;
}

export class MangaParkProvider extends ConsumetProvider {
  id = 'mangapark' as const;
  displayName = 'MangaPark';
  supportsPages = true;
  languages = ['en', 'ja', 'ko', 'zh'];
  priority = 60;
}