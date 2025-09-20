import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Plus, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { searchWithRetry } from '@/lib/api';
import { addToLibrary, getLibrary } from '@/lib/storage';
import { MangaSearchResult, LibrarySeries } from '@/types/manga';
import { useToast } from '@/hooks/use-toast';

const POPULAR_QUERIES = [
  'One Piece',
  'Attack on Titan', 
  'Demon Slayer',
  'My Hero Academia',
  'Death Note'
];

export default function PopularSection() {
  const [popularManga, setPopularManga] = useState<MangaSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [librarySeriesIds, setLibrarySeriesIds] = useState<Set<string>>(new Set());
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadPopularManga();
    loadLibraryIds();
  }, []);

  const loadPopularManga = async () => {
    try {
      setLoading(true);
      const results: MangaSearchResult[] = [];
      
      // Fetch popular manga from different queries
      for (const query of POPULAR_QUERIES.slice(0, 3)) {
        try {
          const response = await searchWithRetry(query);
          if (response.data && response.data.length > 0) {
            results.push(response.data[0]);
          }
        } catch (error) {
          console.error(`Failed to fetch ${query}:`, error);
        }
      }
      
      setPopularManga(results.slice(0, 6));
    } catch (error) {
      console.error('Failed to load popular manga:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLibraryIds = async () => {
    try {
      const library = await getLibrary();
      const ids = new Set(library.map(s => `${s.source}-${s.seriesId}`));
      setLibrarySeriesIds(ids);
    } catch (error) {
      console.error('Failed to load library:', error);
    }
  };

  const handleAddToLibrary = async (manga: MangaSearchResult) => {
    try {
      const series: Omit<LibrarySeries, 'addedAt'> = {
        source: 'jikan',
        seriesId: manga.mal_id.toString(),
        title: manga.title,
        coverUrl: manga.images.jpg.large_image_url || manga.images.jpg.image_url,
        lang: 'en',
        status: 'plan-to-read'
      };

      await addToLibrary(series);
      setLibrarySeriesIds(prev => new Set([...prev, `jikan-${manga.mal_id}`]));
      
      toast({
        title: 'Added to library',
        description: `${manga.title} has been added to your library`
      });
    } catch (error) {
      toast({
        title: 'Failed to add',
        description: 'Could not add manga to library',
        variant: 'destructive'
      });
    }
  };

  const isInLibrary = (manga: MangaSearchResult) => {
    return librarySeriesIds.has(`jikan-${manga.mal_id}`);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Popular</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="aspect-[3/4] bg-muted animate-pulse" />
              <CardContent className="p-3">
                <div className="h-4 bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Popular</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/search?q=popular')}
        >
          View All
        </Button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {popularManga.map((manga) => (
          <Card 
            key={manga.mal_id}
            className="group overflow-hidden hover:shadow-lg smooth-transition glass-card"
          >
            <div className="aspect-[3/4] relative overflow-hidden">
              <img
                src={manga.images.jpg.large_image_url || manga.images.jpg.image_url}
                alt={manga.title}
                className="w-full h-full object-cover group-hover:scale-105 smooth-transition cursor-pointer"
                onClick={() => navigate(`/series/jikan/${manga.mal_id}`)}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder.svg';
                }}
              />
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 smooth-transition" />
              
              {/* Action Button */}
              <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 smooth-transition">
                {isInLibrary(manga) ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="w-full"
                    onClick={() => navigate(`/series/jikan/${manga.mal_id}`)}
                  >
                    <Check className="mr-1 h-3 w-3" />
                    In Library
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="w-full floating-action"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToLibrary(manga);
                    }}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Add
                  </Button>
                )}
              </div>

              {/* Score Badge */}
              {manga.score && (
                <Badge 
                  variant="secondary" 
                  className="absolute top-2 right-2 text-xs"
                >
                  <Star className="mr-1 h-3 w-3" />
                  {manga.score}
                </Badge>
              )}
            </div>

            <CardContent className="p-3">
              <h3 
                className="font-medium text-sm line-clamp-2 cursor-pointer hover:text-primary smooth-transition"
                onClick={() => navigate(`/series/jikan/${manga.mal_id}`)}
              >
                {manga.title}
              </h3>
              
              {manga.chapters && (
                <p className="text-xs text-muted-foreground mt-1">
                  {manga.chapters} chapters
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}