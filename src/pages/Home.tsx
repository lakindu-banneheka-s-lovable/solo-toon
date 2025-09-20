import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Plus, TrendingUp, Clock } from 'lucide-react';
import heroBackground from '@/assets/hero-bg.jpg';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LibrarySeries, ReadingProgress } from '@/lib/storage';
import { getLibrary, getProgress } from '@/lib/storage';
import { cn } from '@/lib/utils';

interface ContinueReadingData {
  series: LibrarySeries;
  progress: ReadingProgress;
}

export default function Home() {
  const navigate = useNavigate();
  const [library, setLibrary] = useState<LibrarySeries[]>([]);
  const [continueReading, setContinueReading] = useState<ContinueReadingData | null>(null);
  const [recentlyAdded, setRecentlyAdded] = useState<LibrarySeries[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [libraryData, progressData] = await Promise.all([
        getLibrary(),
        getProgress()
      ]);

      setLibrary(libraryData);

      // Find most recent reading progress
      const progressEntries = Object.values(progressData);
      if (progressEntries.length > 0) {
        const latestProgress = progressEntries.reduce((latest, current) => 
          new Date(current.updatedAt) > new Date(latest.updatedAt) ? current : latest
        );

        const series = libraryData.find(s => s.seriesId === latestProgress.seriesId);
        if (series && latestProgress.percent < 100) {
          setContinueReading({ series, progress: latestProgress });
        }
      }

      // Get recently added series (last 10)
      const recent = [...libraryData]
        .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
        .slice(0, 8);
      setRecentlyAdded(recent);

    } catch (error) {
      console.error('Failed to load home data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container py-8 space-y-8">
        <div className="space-y-4">
          <div className="h-8 bg-muted rounded animate-pulse" />
          <div className="h-48 bg-muted rounded-lg animate-pulse" />
        </div>
        <div className="space-y-4">
          <div className="h-6 bg-muted rounded animate-pulse w-48" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-64 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl mb-8">
        <div 
          className="h-80 bg-cover bg-center bg-no-repeat relative"
          style={{ backgroundImage: `url(${heroBackground})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
          <div className="relative h-full flex items-center justify-center text-center px-6">
            <div className="space-y-6 text-white max-w-3xl">
              <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                Welcome to <span className="hero-gradient bg-clip-text text-transparent">Solo-Toon</span>
              </h1>
              <p className="text-xl md:text-2xl text-white/90 leading-relaxed">
                Your personal manga and webtoon reading companion. Track your progress, discover new series, and enjoy seamless reading.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                <Button size="lg" variant="hero" onClick={() => navigate('/search')}>
                  <Plus className="mr-2 h-5 w-5" />
                  Start Reading
                </Button>
                <Button size="lg" variant="glass" onClick={() => navigate('/library')}>
                  <BookOpen className="mr-2 h-5 w-5" />
                  Your Library
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Continue Reading Section */}
      {continueReading ? (
        <Card className="relative overflow-hidden card-gradient border-primary/20">
          <div className="absolute inset-0 hero-gradient opacity-10" />
          <CardHeader className="relative">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <CardTitle>Continue Reading</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-shrink-0">
                <img
                  src={continueReading.series.coverUrl}
                  alt={continueReading.series.title}
                  className="w-24 h-32 md:w-32 md:h-40 object-cover rounded-lg shadow-lg"
                />
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-xl font-semibold">{continueReading.series.title}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      Chapter {continueReading.progress.chapterId.split('-').pop()}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {continueReading.series.status}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{continueReading.progress.percent}%</span>
                  </div>
                  <Progress 
                    value={continueReading.progress.percent} 
                    className="h-2" 
                  />
                  <p className="text-sm text-muted-foreground">
                    Page {continueReading.progress.lastPage} of {continueReading.progress.totalPages}
                  </p>
                </div>
                <Button 
                  size="lg"
                  className="w-full md:w-auto floating-action"
                  onClick={() => navigate(`/read/${continueReading.progress.chapterId}?page=${continueReading.progress.lastPage}`)}
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  Continue Reading
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="text-center p-8 card-gradient">
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">Start Your Reading Journey</h3>
              <p className="text-muted-foreground mt-2">
                Add some manga to your library to begin tracking your progress
              </p>
            </div>
            <Button onClick={() => navigate('/search')} className="floating-action">
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Manga
            </Button>
          </div>
        </Card>
      )}

      {/* Recently Added Section */}
      {recentlyAdded.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-semibold">Recently Added</h2>
            </div>
            <Button variant="ghost" onClick={() => navigate('/library')}>
              View All
            </Button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {recentlyAdded.map((series) => (
              <Card 
                key={`${series.source}-${series.seriesId}`}
                className="group cursor-pointer overflow-hidden hover:shadow-lg smooth-transition glass-card"
                onClick={() => navigate(`/series/${series.source}/${series.seriesId}`)}
              >
                <div className="aspect-[3/4] relative overflow-hidden">
                  <img
                    src={series.coverUrl}
                    alt={series.title}
                    className="w-full h-full object-cover group-hover:scale-105 smooth-transition"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 smooth-transition" />
                  <Badge 
                    variant="secondary" 
                    className="absolute top-2 right-2 text-xs"
                  >
                    {series.status}
                  </Badge>
                </div>
                <CardContent className="p-3">
                  <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary smooth-transition">
                    {series.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Added {new Date(series.addedAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="group cursor-pointer hover:shadow-lg smooth-transition glass-card" onClick={() => navigate('/search')}>
          <CardContent className="p-6 text-center">
            <Plus className="h-8 w-8 mx-auto text-primary group-hover:scale-110 smooth-transition" />
            <h3 className="font-semibold mt-2">Add New Manga</h3>
            <p className="text-sm text-muted-foreground">Discover and add new series</p>
          </CardContent>
        </Card>
        
        <Card className="group cursor-pointer hover:shadow-lg smooth-transition glass-card" onClick={() => navigate('/library')}>
          <CardContent className="p-6 text-center">
            <BookOpen className="h-8 w-8 mx-auto text-primary group-hover:scale-110 smooth-transition" />
            <h3 className="font-semibold mt-2">Your Library</h3>
            <p className="text-sm text-muted-foreground">{library.length} series in library</p>
          </CardContent>
        </Card>
        
        <Card className="group cursor-pointer hover:shadow-lg smooth-transition glass-card" onClick={() => navigate('/settings')}>
          <CardContent className="p-6 text-center">
            <TrendingUp className="h-8 w-8 mx-auto text-primary group-hover:scale-110 smooth-transition" />
            <h3 className="font-semibold mt-2">Reading Stats</h3>
            <p className="text-sm text-muted-foreground">Track your progress</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}