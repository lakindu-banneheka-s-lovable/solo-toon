import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getLibrary, getProgress } from '@/lib/storage';
import { LibrarySeries, ReadingProgress } from '@/types/manga';

export default function RecentlyReadSection() {
  const [recentlyRead, setRecentlyRead] = useState<LibrarySeries[]>([]);
  const [progress, setProgress] = useState<Record<string, ReadingProgress>>({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadRecentlyRead();
  }, []);

  const loadRecentlyRead = async () => {
    try {
      setLoading(true);
      const [library, allProgress] = await Promise.all([
        getLibrary(),
        getProgress()
      ]);

      // Filter series that have been read and sort by last read time
      const readSeries = library
        .filter(series => series.lastReadAt)
        .sort((a, b) => {
          const dateA = new Date(a.lastReadAt!).getTime();
          const dateB = new Date(b.lastReadAt!).getTime();
          return dateB - dateA;
        })
        .slice(0, 6);

      setRecentlyRead(readSeries);
      setProgress(allProgress);
    } catch (error) {
      console.error('Failed to load recently read:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeriesProgress = (seriesId: string) => {
    const seriesProgress = Object.values(progress).find(p => p.seriesId === seriesId);
    return seriesProgress;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Recently Read</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="aspect-[3/4] bg-muted animate-pulse" />
              <CardContent className="p-3">
                <div className="h-4 bg-muted rounded animate-pulse mb-2" />
                <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (recentlyRead.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Recently Read</h2>
        <Card className="p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
            <BookOpen className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-medium mb-2">No reading history yet</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Start reading some manga to see your recent activity here
          </p>
          <Button onClick={() => navigate('/search')}>
            Browse Manga
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Recently Read</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/library?filter=reading')}
        >
          View All
        </Button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {recentlyRead.map((series) => {
          const seriesProgress = getSeriesProgress(series.seriesId);
          
          return (
            <Card 
              key={`${series.source}-${series.seriesId}`}
              className="group overflow-hidden hover:shadow-lg smooth-transition glass-card cursor-pointer"
              onClick={() => navigate(`/series/${series.source}/${series.seriesId}`)}
            >
              <div className="aspect-[3/4] relative overflow-hidden">
                <img
                  src={series.coverUrl}
                  alt={series.title}
                  className="w-full h-full object-cover group-hover:scale-105 smooth-transition"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder.svg';
                  }}
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                
                {/* Progress Bar */}
                {seriesProgress && seriesProgress.percent > 0 && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
                    <div
                      className="h-full bg-primary smooth-transition"
                      style={{ width: `${seriesProgress.percent}%` }}
                    />
                  </div>
                )}

                {/* Status Badge */}
                <Badge 
                  variant="secondary" 
                  className="absolute top-2 right-2 text-xs"
                >
                  {series.status === 'reading' ? 'Reading' : 
                   series.status === 'completed' ? 'Completed' : 
                   series.status === 'plan-to-read' ? 'Plan to Read' : 'Dropped'}
                </Badge>
              </div>

              <CardContent className="p-3">
                <h3 className="font-medium text-sm line-clamp-2 mb-2">
                  {series.title}
                </h3>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>
                      {new Date(series.lastReadAt!).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {seriesProgress && (
                    <span>{Math.round(seriesProgress.percent)}%</span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}