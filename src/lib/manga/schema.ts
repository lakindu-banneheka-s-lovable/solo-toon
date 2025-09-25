import { z } from 'zod';

// Provider response validation schemas
export const ProviderSearchResultSchema = z.object({
  id: z.string(),
  title: z.string(),
  image: z.string().optional(),
  description: z.string().optional(),
  status: z.string().optional(),
  chapters: z.number().optional(),
  volumes: z.number().optional(),
  rating: z.number().optional(),
  genres: z.array(z.union([z.string(), z.object({ name: z.string() })])).optional(),
  authors: z.array(z.union([z.string(), z.object({ name: z.string() })])).optional(),
  releaseDate: z.string().optional(),
  url: z.string().optional()
});

export const ProviderChapterSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  chapterNumber: z.union([z.string(), z.number()]).optional(),
  releaseDate: z.string().optional(),
  url: z.string().optional(),
  pages: z.number().optional()
});

export const ProviderPageSchema = z.object({
  img: z.string(),
  page: z.number().optional(),
  headerForImage: z.record(z.string(), z.string()).optional()
});

// Normalized domain models
export const MangaSchema = z.object({
  id: z.string(), // provider:rawId format
  title: z.string(),
  titleEnglish: z.string().optional(),
  titleJapanese: z.string().optional(),
  cover: z.string(),
  status: z.string(),
  score: z.number().optional(),
  synopsis: z.string().optional(),
  tags: z.array(z.string()),
  authors: z.array(z.string()),
  year: z.number().optional(),
  provider: z.string(),
  providerId: z.string(),
  sources: z.array(z.object({
    provider: z.string(),
    id: z.string(),
    priority: z.number()
  })).optional(),
  chapters: z.number().optional(),
  volumes: z.number().optional()
});

export const ChapterSchema = z.object({
  id: z.string(),
  seriesId: z.string(),
  chapterNumber: z.string(),
  title: z.string(),
  pagesCount: z.number().optional(),
  publishedAt: z.string(),
  externalUrl: z.string().optional(),
  provider: z.string(),
  providerId: z.string()
});

export const PageImageSchema = z.object({
  index: z.number(),
  originalUrl: z.string(),
  dataSaverUrl: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional()
});

// Types
export type ProviderSearchResult = z.infer<typeof ProviderSearchResultSchema>;
export type ProviderChapter = z.infer<typeof ProviderChapterSchema>;
export type ProviderPage = z.infer<typeof ProviderPageSchema>;
export type Manga = z.infer<typeof MangaSchema>;
export type Chapter = z.infer<typeof ChapterSchema>;
export type PageImage = z.infer<typeof PageImageSchema>;

// Error types
export class MangaApiError extends Error {
  public code: string;
  public provider: string;
  public status?: number;
  public url?: string;

  constructor(
    code: string,
    provider: string,
    status?: number,
    url?: string,
    message?: string
  ) {
    super(message || `API error: ${code}`);
    this.name = 'MangaApiError';
    this.code = code;
    this.provider = provider;
    this.status = status;
    this.url = url;
  }
}