import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Menu, Settings, BookOpen, Home, Maximize, Minimize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { getChapterPages, getMangaDetails, getChapters } from '@/lib/manga/api';
import { PageImage, Chapter, Manga } from '@/lib/manga/schema';
import { getProgress, saveProgress } from '@/lib/storage';
import { useSettings } from '@/hooks/useSettings';

interface ReaderProps {
  chapterId: string;
}

type ReaderMode = 'webtoon' | 'pages';

export default function Reader({ chapterId }: ReaderProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { settings, updateSetting } = useSettings();
  
  // State
  const [pages, setPages] = useState<PageImage[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [manga, setManga] = useState<Manga | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [readerMode, setReaderMode] = useState<ReaderMode>(settings.readerMode);
  const [dataSaver, setDataSaver] = useState(settings.dataSaver);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  // Parse chapter ID and get series ID
  const seriesId = chapterId.split(':').slice(0, 2).join(':');

  // Load data
  useEffect(() => {
    loadReaderData();
  }, [chapterId]);

  // Auto-hide controls
  useEffect(() => {
    const resetTimeout = () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      setShowControls(true);
      controlsTimeoutRef.current = setTimeout(() => {
        if (isFullscreen) {
          setShowControls(false);
        }
      }, 3000);
    };

    const handleMouseMove = () => resetTimeout();
    const handleKeyPress = () => resetTimeout();

    if (isFullscreen) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('keydown', handleKeyPress);
      resetTimeout();
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('keydown', handleKeyPress);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isFullscreen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'ArrowLeft':
        case 'KeyA':
          event.preventDefault();
          goToPreviousPage();
          break;
        case 'ArrowRight':
        case 'KeyD':
        case 'Space':
          event.preventDefault();
          goToNextPage();
          break;
        case 'Home':
          event.preventDefault();
          setCurrentPage(1);
          break;
        case 'End':
          event.preventDefault();
          setCurrentPage(pages.length);
          break;
        case 'Escape':
          if (isFullscreen) {
            toggleFullscreen();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, pages.length, isFullscreen]);

  // Load initial page from URL
  useEffect(() => {
    const pageParam = searchParams.get('page');
    if (pageParam) {
      const page = parseInt(pageParam);
      if (page >= 1 && page <= pages.length) {
        setCurrentPage(page);
      }
    }
  }, [searchParams, pages.length]);

  // Save progress
  useEffect(() => {
    if (currentChapter && pages.length > 0) {
      const progress = {
        seriesId,
        chapterId,
        lastPage: currentPage,
        totalPages: pages.length,
        percent: Math.round((currentPage / pages.length) * 100),
        updatedAt: new Date().toISOString()
      };
      
      saveProgress({ [seriesId]: progress });
    }
  }, [currentPage, pages.length, chapterId, seriesId, currentChapter]);

  const loadReaderData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load pages for current chapter
      const [pagesData, mangaData, chaptersData] = await Promise.all([
        getChapterPages(chapterId, { dataSaver }),
        getMangaDetails(seriesId),
        getChapters(seriesId)
      ]);

      setPages(pagesData);
      setManga(mangaData);
      setChapters(chaptersData);

      // Find current chapter
      const chapter = chaptersData.find(c => c.id === chapterId);
      setCurrentChapter(chapter || null);

      if (pagesData.length === 0) {
        setError('No pages found for this chapter');
      }

      // Load saved progress
      const savedProgress = await getProgress();
      const progress = savedProgress[seriesId];
      if (progress && progress.chapterId === chapterId) {
        setCurrentPage(progress.lastPage);
      }

    } catch (error) {
      console.error('Failed to load reader data:', error);
      setError('Failed to load chapter');
      toast({
        title: 'Error',
        description: 'Failed to load chapter pages',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const goToNextPage = useCallback(() => {
    if (currentPage < pages.length) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      setSearchParams({ page: nextPage.toString() });
    } else {
      // Go to next chapter
      goToNextChapter();
    }
  }, [currentPage, pages.length, setSearchParams]);

  const goToPreviousPage = useCallback(() => {
    if (currentPage > 1) {
      const prevPage = currentPage - 1;
      setCurrentPage(prevPage);
      setSearchParams({ page: prevPage.toString() });
    } else {
      // Go to previous chapter
      goToPreviousChapter();
    }
  }, [currentPage, setSearchParams]);

  const goToNextChapter = () => {
    if (!currentChapter || chapters.length === 0) return;
    
    const currentIndex = chapters.findIndex(c => c.id === chapterId);
    if (currentIndex >= 0 && currentIndex < chapters.length - 1) {
      const nextChapter = chapters[currentIndex + 1];
      navigate(`/read/${nextChapter.id}`);
    }
  };

  const goToPreviousChapter = () => {
    if (!currentChapter || chapters.length === 0) return;
    
    const currentIndex = chapters.findIndex(c => c.id === chapterId);
    if (currentIndex > 0) {
      const prevChapter = chapters[currentIndex - 1];
      navigate(`/read/${prevChapter.id}`);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleReaderModeChange = (mode: ReaderMode) => {
    setReaderMode(mode);
    updateSetting('readerMode', mode);
  };

  const handleDataSaverChange = (enabled: boolean) => {
    setDataSaver(enabled);
    updateSetting('dataSaver', enabled);
    // Reload pages with new setting
    loadReaderData();
  };

  if (loading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p>Loading chapter...</p>
        </div>
      </div>
    );
  }

  if (error || pages.length === 0) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-xl font-semibold mb-4">Chapter Not Available</h2>
          <p className="text-muted-foreground mb-6">
            {error || 'This chapter cannot be read online. Please check the external source.'}
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => navigate(-1)}>
              Go Back
            </Button>
            <Button variant="outline" onClick={() => navigate('/')}>
              <Home className="mr-2 h-4 w-4" />
              Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const currentPageData = pages[currentPage - 1];

  return (
    <div 
      ref={containerRef}
      className="h-screen bg-black relative overflow-hidden"
    >
      {/* Header Controls */}
      <div className={`absolute top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm p-4 transition-transform duration-300 ${
        showControls || !isFullscreen ? 'translate-y-0' : '-translate-y-full'
      }`}>
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="text-white hover:bg-white/20"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div className="text-sm">
              <div className="font-medium">{manga?.title}</div>
              <div className="text-white/70">
                {currentChapter?.title || `Chapter ${currentChapter?.chapterNumber}`}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Page Counter */}
            <span className="text-sm bg-white/20 px-3 py-1 rounded">
              {currentPage} / {pages.length}
            </span>

            {/* Settings Sheet */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                  <Settings className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetHeader>
                  <SheetTitle>Reader Settings</SheetTitle>
                </SheetHeader>
                <div className="space-y-6 mt-6">
                  <div>
                    <label className="text-sm font-medium mb-3 block">Reading Mode</label>
                    <Select value={readerMode} onValueChange={handleReaderModeChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="webtoon">Long Strip (Webtoon)</SelectItem>
                        <SelectItem value="pages">Page by Page</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Data Saver</label>
                    <Switch
                      checked={dataSaver}
                      onCheckedChange={handleDataSaverChange}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Fullscreen</label>
                    <Switch
                      checked={isFullscreen}
                      onCheckedChange={toggleFullscreen}
                    />
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="text-white hover:bg-white/20"
            >
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Reader Content */}
      <div className="h-full flex items-center justify-center pt-16 pb-20">
        {readerMode === 'webtoon' ? (
          // Long strip mode
          <div className="w-full max-w-4xl mx-auto space-y-2 overflow-y-auto h-full px-4">
            {pages.map((page, index) => (
              <div key={index} className="flex justify-center">
                <img
                  src={`/api/image?src=${encodeURIComponent(page.originalUrl)}`}
                  alt={`Page ${index + 1}`}
                  className="max-w-full h-auto"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder.svg';
                  }}
                />
              </div>
            ))}
          </div>
        ) : (
          // Page by page mode
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={`/api/image?src=${encodeURIComponent(currentPageData.originalUrl)}`}
              alt={`Page ${currentPage}`}
              className="max-w-full max-h-full object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder.svg';
              }}
            />

            {/* Navigation Areas */}
            <button
              className="absolute left-0 top-0 w-1/3 h-full z-10 opacity-0 hover:opacity-0"
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
            />
            <button
              className="absolute right-0 top-0 w-1/3 h-full z-10 opacity-0 hover:opacity-0"
              onClick={goToNextPage}
              disabled={currentPage === pages.length}
            />
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className={`absolute bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm p-4 transition-transform duration-300 ${
        showControls || !isFullscreen ? 'translate-y-0' : 'translate-y-full'
      }`}>
        <div className="flex items-center gap-4 text-white">
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPreviousPage}
            disabled={currentPage === 1}
            className="text-white hover:bg-white/20"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex-1">
            <Slider
              value={[currentPage]}
              onValueChange={([value]) => {
                setCurrentPage(value);
                setSearchParams({ page: value.toString() });
              }}
              min={1}
              max={pages.length}
              step={1}
              className="w-full"
            />
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={goToNextPage}
            disabled={currentPage === pages.length}
            className="text-white hover:bg-white/20"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}