import localforage from 'localforage';
import { LibrarySeries, ReadingProgress, AppSettings, SyncData } from '@/types/manga';

// Re-export types for convenience
export type { AppSettings, LibrarySeries, ReadingProgress, SyncData };

// Configure localforage
localforage.config({
  name: 'SoloToon',
  version: 1.0,
  storeName: 'manga_data',
  description: 'Solo-Toon manga reader data storage'
});

// Storage keys
const STORAGE_KEYS = {
  LIBRARY: 'library',
  PROGRESS: 'progress',
  SETTINGS: 'settings',
  CHAPTERS_CACHE: 'chaptersCache',
  LAST_SYNC: 'lastSync'
} as const;

// Default settings
export const DEFAULT_SETTINGS: AppSettings = {
  dataSaver: false,
  prefetchCount: 3,
  preferredLanguage: 'en',
  theme: 'system',
  readerMode: 'webtoon',
  autoSync: false,
  syncInterval: 12 * 60 * 60 * 1000 // 12 hours
};

// Library operations
export async function getLibrary(): Promise<LibrarySeries[]> {
  try {
    return await localforage.getItem(STORAGE_KEYS.LIBRARY) || [];
  } catch (error) {
    console.error('Failed to get library:', error);
    return [];
  }
}

export async function saveLibrary(library: LibrarySeries[]): Promise<void> {
  try {
    await localforage.setItem(STORAGE_KEYS.LIBRARY, library);
  } catch (error) {
    console.error('Failed to save library:', error);
    throw error;
  }
}

export async function addToLibrary(series: Omit<LibrarySeries, 'addedAt'>): Promise<void> {
  const library = await getLibrary();
  const exists = library.find(s => s.seriesId === series.seriesId && s.source === series.source);
  
  if (!exists) {
    const newSeries: LibrarySeries = {
      ...series,
      addedAt: new Date().toISOString()
    };
    library.push(newSeries);
    await saveLibrary(library);
  }
}

export async function removeFromLibrary(seriesId: string, source: string): Promise<void> {
  const library = await getLibrary();
  const filtered = library.filter(s => !(s.seriesId === seriesId && s.source === source));
  await saveLibrary(filtered);
}

export async function updateSeriesStatus(
  seriesId: string, 
  source: string, 
  status: LibrarySeries['status']
): Promise<void> {
  const library = await getLibrary();
  const series = library.find(s => s.seriesId === seriesId && s.source === source);
  
  if (series) {
    series.status = status;
    await saveLibrary(library);
  }
}

// Progress operations
export async function getProgress(): Promise<Record<string, ReadingProgress>> {
  try {
    return await localforage.getItem(STORAGE_KEYS.PROGRESS) || {};
  } catch (error) {
    console.error('Failed to get progress:', error);
    return {};
  }
}

export async function saveProgress(progress: Record<string, ReadingProgress>): Promise<void> {
  try {
    await localforage.setItem(STORAGE_KEYS.PROGRESS, progress);
  } catch (error) {
    console.error('Failed to save progress:', error);
    throw error;
  }
}

export async function updateProgress(
  seriesId: string,
  chapterId: string,
  page: number,
  totalPages: number
): Promise<void> {
  const progress = await getProgress();
  const percent = Math.round((page / totalPages) * 100);
  
  progress[seriesId] = {
    seriesId,
    chapterId,
    lastPage: page,
    totalPages,
    percent,
    updatedAt: new Date().toISOString()
  };
  
  await saveProgress(progress);
  
  // Update last read time in library
  const library = await getLibrary();
  const series = library.find(s => s.seriesId === seriesId);
  if (series) {
    series.lastReadAt = new Date().toISOString();
    if (percent >= 100 && series.status === 'reading') {
      series.status = 'completed';
    } else if (series.status === 'plan-to-read') {
      series.status = 'reading';
    }
    await saveLibrary(library);
  }
}

export async function getSeriesProgress(seriesId: string): Promise<ReadingProgress | null> {
  const progress = await getProgress();
  return progress[seriesId] || null;
}

export async function getReadingProgress(seriesId: string): Promise<Record<string, ReadingProgress>> {
  const allProgress = await getProgress();
  const seriesProgress: Record<string, ReadingProgress> = {};
  
  Object.values(allProgress).forEach(progress => {
    if (progress.seriesId === seriesId) {
      seriesProgress[progress.chapterId] = progress;
    }
  });
  
  return seriesProgress;
}

export async function updateReadingProgress(
  seriesId: string,
  chapterId: string,
  page: number,
  totalPages: number
): Promise<void> {
  return updateProgress(seriesId, chapterId, page, totalPages);
}

// Settings operations
export async function getSettings(): Promise<AppSettings> {
  try {
    const settings = await localforage.getItem<AppSettings>(STORAGE_KEYS.SETTINGS);
    return { ...DEFAULT_SETTINGS, ...settings };
  } catch (error) {
    console.error('Failed to get settings:', error);
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  try {
    await localforage.setItem(STORAGE_KEYS.SETTINGS, settings);
  } catch (error) {
    console.error('Failed to save settings:', error);
    throw error;
  }
}

export async function updateSetting<K extends keyof AppSettings>(
  key: K,
  value: AppSettings[K]
): Promise<void> {
  const settings = await getSettings();
  settings[key] = value;
  await saveSettings(settings);
}

// Sync operations
export async function getSyncData(): Promise<SyncData> {
  const [library, progress, settings] = await Promise.all([
    getLibrary(),
    getProgress(),
    getSettings()
  ]);
  
  return {
    library,
    progress,
    settings,
    lastSync: new Date().toISOString()
  };
}

export async function applySyncData(syncData: SyncData): Promise<void> {
  await Promise.all([
    saveLibrary(syncData.library),
    saveProgress(syncData.progress),
    saveSettings(syncData.settings),
    localforage.setItem(STORAGE_KEYS.LAST_SYNC, syncData.lastSync)
  ]);
}

// Utility functions
export async function clearAllData(): Promise<void> {
  await localforage.clear();
}

export async function getStorageSize(): Promise<number> {
  try {
    const keys = await localforage.keys();
    let totalSize = 0;
    
    for (const key of keys) {
      const item = await localforage.getItem(key);
      totalSize += JSON.stringify(item).length;
    }
    
    return totalSize;
  } catch (error) {
    console.error('Failed to get storage size:', error);
    return 0;
  }
}