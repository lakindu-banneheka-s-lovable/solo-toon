import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Clock, Star, Users, Calendar, Plus, Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { getMangaDetails, getMangaChapters } from '@/lib/api';
import { addToLibrary, getLibrary, updateReadingProgress, getReadingProgress, removeFromLibrary } from '@/lib/storage';
import { MangaDetails, Chapter, LibrarySeries, ReadingProgress } from '@/types/manga';

export default function SeriesDetail() {
  const { provider, id } = useParams<{ provider: string; id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [details, setDetails] = useState<MangaDetails | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInLibrary, setIsInLibrary] = useState(false);
  const [progress, setProgress] = useState<Record<string, ReadingProgress>>({});
  const [languageFilter, setLanguageFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    loadSeriesData();
    checkLibraryStatus();
    loadProgress();
  }, [provider, id]);

  const loadSeriesData = async () => {
    if (!id || !provider) return;
    
    try {
      setLoading(true);
      const [response, chaptersData] = await Promise.all([
        getMangaDetails(id, provider),
        getMangaChapters(id, provider)
      ]);
      setDetails(response.data);
      setChapters(chaptersData);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load series details',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const checkLibraryStatus = async () => {
    if (!id) return;
    
    try {
      const library = await getLibrary();
      const inLibrary = library.some(s => s.seriesId === id);
      setIsInLibrary(inLibrary);
    } catch (error) {
      console.error('Failed to check library status:', error);
    }
  };

  const loadProgress = async () => {
    if (!id) return;
    
    try {
      const seriesProgress = await getReadingProgress(id);
      setProgress(seriesProgress);
    } catch (error) {
      console.error('Failed to load progress:', error);
    }
  };

  const handleAddToLibrary = async () => {
    if (!details || !id) return;

    try {
      const series: Omit<LibrarySeries, 'addedAt'> = {
        source: 'consumet',
        seriesId: id,
        title: details.title,
        coverUrl: details.images.jpg.large_image_url || details.images.jpg.image_url,
        lang: 'en',
        status: 'plan-to-read',
        provider,
        providerId: details.providerId
      };

      await addToLibrary(series);
      setIsInLibrary(true);
      
      toast({
        title: 'Added to library',
        description: `${details.title} has been added to your library`
      });
    } catch (error) {
      toast({
        title: 'Failed to add',
        description: 'Could not add manga to library',
        variant: 'destructive'
      });
    }
  };

  const handleRemoveFromLibrary = async () => {
    if (!details || !id) return;

    try {
      await removeFromLibrary('consumet', id);
      setIsInLibrary(false);
      
      toast({
        title: 'Removed from library',
        description: `${details.title} has been removed from your library`
      });
    } catch (error) {
      toast({
        title: 'Failed to remove',
        description: 'Could not remove manga from library',
        variant: 'destructive'
      });
    }
  };

  const handleChapterClick = (chapter: Chapter) => {
    // For now, just show a toast since we don't have a reader implementation yet
    toast({
      title: 'Reader coming soon',
      description: `Chapter ${chapter.chapter} will open in the reader`
    });
  };

  const filteredChapters = chapters
    .filter(chapter => languageFilter === 'all' || chapter.id.includes(languageFilter))
    .sort((a, b) => {
      const aNum = parseFloat(a.chapter);
      const bNum = parseFloat(b.chapter);
      return sortOrder === 'asc' ? aNum - bNum : bNum - aNum;
    });

  if (loading) {
    return (
      <div className="container py-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-8 h-8 bg-muted rounded animate-pulse" />
          <div className="h-8 bg-muted rounded w-48 animate-pulse" />
        </div>
        <div className="grid md:grid-cols-[300px_1fr] gap-6">
          <div className="aspect-[3/4] bg-muted rounded-lg animate-pulse" />
          <div className="space-y-4">
            <div className="h-8 bg-muted rounded w-3/4 animate-pulse" />
            <div className="h-4 bg-muted rounded w-full animate-pulse" />
            <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="container py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Series not found</h1>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold truncate">{details.title}</h1>
      </div>

      {/* Series Info */}
      <div className="grid md:grid-cols-[300px_1fr] gap-6">
        <div className="space-y-4">
          <div className="aspect-[3/4] relative overflow-hidden rounded-lg">
            <img
              src={details.images.jpg.large_image_url || details.images.jpg.image_url}
              alt={details.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder.svg';
              }}
            />
          </div>
          
          <div className="space-y-2">
            {isInLibrary ? (
              <>
                <Button className="w-full" disabled>
                  <Check className="mr-2 h-4 w-4" />
                  In Library
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  onClick={handleRemoveFromLibrary}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove from Library
                </Button>
              </>
            ) : (
              <Button className="w-full" onClick={handleAddToLibrary}>
                <Plus className="mr-2 h-4 w-4" />
                Add to Library
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">{details.title}</h2>
            {details.title_english && details.title_english !== details.title && (
              <p className="text-muted-foreground mb-2">{details.title_english}</p>
            )}
            
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
              {details.status && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{details.status}</span>
                </div>
              )}
              {details.chapters && (
                <div className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  <span>{details.chapters} chapters</span>
                </div>
              )}
              {details.score && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4" />
                  <span>{details.score}</span>
                </div>
              )}
              {details.members && (
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{details.members.toLocaleString()}</span>
                </div>
              )}
              {details.published?.from && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(details.published.from).getFullYear()}</span>
                </div>
              )}
            </div>

            {details.genres && details.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {details.genres.map((genre) => (
                  <Badge key={genre.mal_id} variant="secondary">
                    {genre.name}
                  </Badge>
                ))}
              </div>
            )}

            {details.synopsis && (
              <div>
                <h3 className="font-medium mb-2">Synopsis</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {details.synopsis}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chapter List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Chapters ({filteredChapters.length})</h3>
          
          <div className="flex gap-2">
            <Select value={languageFilter} onValueChange={setLanguageFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Languages</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ja">Japanese</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortOrder} onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Ascending</SelectItem>
                <SelectItem value="desc">Descending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-2">
          {filteredChapters.map((chapter) => {
            const chapterProgress = progress[chapter.id];
            const isRead = chapterProgress?.percent === 100;
            const isPartiallyRead = chapterProgress && chapterProgress.percent > 0 && chapterProgress.percent < 100;
            
            return (
              <Card
                key={chapter.id}
                className={`hover:shadow-md smooth-transition cursor-pointer ${
                  isRead ? 'bg-muted/50 border-muted' : ''
                }`}
                onClick={() => handleChapterClick(chapter)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className={`font-medium ${isRead ? 'text-muted-foreground' : ''}`}>
                        Chapter {chapter.chapter}
                        {chapter.title && chapter.title !== `Chapter ${chapter.chapter}` && (
                          <span className="font-normal text-muted-foreground ml-2">
                            - {chapter.title}
                          </span>
                        )}
                      </h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span>{chapter.pages} pages</span>
                        <span>{new Date(chapter.publishAt).toLocaleDateString()}</span>
                      </div>
                      
                      {isPartiallyRead && (
                        <div className="mt-2">
                          <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary smooth-transition"
                              style={{ width: `${chapterProgress.percent}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground mt-1">
                            {Math.round(chapterProgress.percent)}% complete
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="shrink-0 ml-4">
                      {isRead ? (
                        <Badge variant="secondary">Read</Badge>
                      ) : isPartiallyRead ? (
                        <Badge variant="outline">Reading</Badge>
                      ) : (
                        <Badge variant="outline">Unread</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}