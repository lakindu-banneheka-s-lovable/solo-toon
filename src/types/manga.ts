export interface ConsumetMangaProvider {
  id: string;
  name: string;
  languages: string[];
}

export interface MangaSearchResult {
  mal_id: number | string;
  title: string;
  title_english?: string;
  title_japanese?: string;
  images: {
    jpg: {
      image_url: string;
      small_image_url: string;
      large_image_url: string;
    };
  };
  status: string;
  chapters?: number;
  volumes?: number;
  score?: number;
  synopsis?: string;
  genres: Array<{
    mal_id: number;
    name: string;
  }>;
  authors: Array<{
    mal_id: number;
    name: string;
  }>;
  published: {
    from: string;
    to?: string;
  };
  provider?: string;
  providerId?: string;
}

export interface MangaDetails extends Omit<MangaSearchResult, 'chapters'> {
  chaptersData?: Chapter[];
  chapters?: number;
  members?: number;
  provider?: string;
  providerId?: string;
}

export interface Chapter {
  id: string;
  title: string;
  chapter: string;
  pages: number;
  publishAt: string;
  readAt?: string;
  externalUrl?: string;
  provider?: string;
  providerId?: string;
}

export interface LibrarySeries {
  source: 'jikan' | 'custom' | 'consumet';
  seriesId: string;
  title: string;
  coverUrl: string;
  lang: string;
  addedAt: string;
  lastReadAt?: string;
  status: 'reading' | 'completed' | 'plan-to-read' | 'dropped';
  provider?: string;
  providerId?: string;
}

export interface ReadingProgress {
  seriesId: string;
  chapterId: string;
  lastPage: number;
  totalPages: number;
  percent: number;
  updatedAt: string;
}

export interface AppSettings {
  dataSaver: boolean;
  prefetchCount: number;
  preferredLanguage: string;
  theme: 'light' | 'dark' | 'system';
  readerMode: 'webtoon' | 'pages';
  autoSync: boolean;
  syncInterval: number;
}

export interface SyncData {
  library: LibrarySeries[];
  progress: Record<string, ReadingProgress>;
  settings: AppSettings;
  lastSync: string;
}