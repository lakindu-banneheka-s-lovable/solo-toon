import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Library, Filter, MoreVertical, BookOpen, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { LibrarySeries, ReadingProgress } from '@/lib/storage';
import { getLibrary, getProgress, removeFromLibrary, updateSeriesStatus } from '@/lib/storage';

type FilterStatus = 'all' | 'reading' | 'completed' | 'plan-to-read' | 'dropped';
type SortBy = 'title' | 'added' | 'updated' | 'progress';

export default function LibraryPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [library, setLibrary] = useState<LibrarySeries[]>([]);
  const [progress, setProgress] = useState<Record<string, ReadingProgress>>({});
  const [filteredLibrary, setFilteredLibrary] = useState<LibrarySeries[]>([]);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortBy, setSortBy] = useState<SortBy>('added');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [library, progress, filterStatus, sortBy]);

  const loadData = async () => {
    try {
      const [libraryData, progressData] = await Promise.all([
        getLibrary(),
        getProgress()
      ]);
      setLibrary(libraryData);
      setProgress(progressData);
    } catch (error) {
      console.error('Failed to load library data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load library data',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...library];

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(series => series.status === filterStatus);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'added':
          return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
        case 'updated':
          const aUpdated = a.lastReadAt || a.addedAt;
          const bUpdated = b.lastReadAt || b.addedAt;
          return new Date(bUpdated).getTime() - new Date(aUpdated).getTime();
        case 'progress':
          const aProgress = progress[a.seriesId]?.percent || 0;
          const bProgress = progress[b.seriesId]?.percent || 0;
          return bProgress - aProgress;
        default:
          return 0;
      }
    });

    setFilteredLibrary(filtered);
  };

  const handleRemoveSeries = async (series: LibrarySeries) => {
    try {
      await removeFromLibrary(series.source, series.seriesId);
      setLibrary(prev => prev.filter(s => 
        !(s.seriesId === series.seriesId && s.source === series.source)
      ));
      toast({
        title: 'Removed',
        description: `${series.title} has been removed from your library`
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove series from library',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateStatus = async (series: LibrarySeries, newStatus: LibrarySeries['status']) => {
    try {
      await updateSeriesStatus(series.seriesId, series.source, newStatus);
      setLibrary(prev => prev.map(s => 
        s.seriesId === series.seriesId && s.source === series.source
          ? { ...s, status: newStatus }
          : s
      ));
      toast({
        title: 'Updated',
        description: `${series.title} status updated to ${newStatus}`
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update series status',
        variant: 'destructive'
      });
    }
  };

  const getStatusBadgeVariant = (status: LibrarySeries['status']) => {
    switch (status) {
      case 'reading': return 'default';
      case 'completed': return 'secondary';
      case 'plan-to-read': return 'outline';
      case 'dropped': return 'destructive';
      default: return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className="container py-6 space-y-6">
        <div className="h-8 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="aspect-[3/4] bg-muted animate-pulse" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-muted rounded animate-pulse" />
                <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Library className="h-8 w-8 text-primary" />
            Your Library
          </h1>
          <p className="text-muted-foreground mt-1">
            {library.length} series in your collection
          </p>
        </div>

        {/* Filters and Sort */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={filterStatus} onValueChange={(value: FilterStatus) => setFilterStatus(value)}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Series</SelectItem>
              <SelectItem value="reading">Reading</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="plan-to-read">Plan to Read</SelectItem>
              <SelectItem value="dropped">Dropped</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value: SortBy) => setSortBy(value)}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="added">Recently Added</SelectItem>
              <SelectItem value="updated">Last Updated</SelectItem>
              <SelectItem value="title">Title (A-Z)</SelectItem>
              <SelectItem value="progress">Progress</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Library Grid */}
      {filteredLibrary.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredLibrary.map((series) => {
            const seriesProgress = progress[series.seriesId];
            
            return (
              <Card 
                key={`${series.source}-${series.seriesId}`}
                className="group overflow-hidden hover:shadow-lg smooth-transition glass-card"
              >
                <div className="aspect-[3/4] relative overflow-hidden">
                  <img
                    src={series.coverUrl}
                    alt={series.title}
                    className="w-full h-full object-cover group-hover:scale-105 smooth-transition cursor-pointer"
                    onClick={() => navigate(`/series/${series.source}/${series.seriesId}`)}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder.svg';
                    }}
                  />
                  
                  {/* Progress Overlay */}
                  {seriesProgress && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                      <div className="space-y-1">
                        <div className="flex justify-between text-white text-xs">
                          <span>Progress</span>
                          <span>{seriesProgress.percent}%</span>
                        </div>
                        <Progress 
                          value={seriesProgress.percent} 
                          className="h-1 bg-white/20" 
                        />
                      </div>
                    </div>
                  )}

                  {/* More Options */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 smooth-transition bg-black/50 hover:bg-black/70 text-white"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/series/${series.source}/${series.seriesId}`)}>
                        <BookOpen className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleUpdateStatus(series, 'reading')}>
                        Mark as Reading
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleUpdateStatus(series, 'completed')}>
                        Mark as Completed
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleUpdateStatus(series, 'plan-to-read')}>
                        Plan to Read
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleUpdateStatus(series, 'dropped')}>
                        Mark as Dropped
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => handleRemoveSeries(series)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove from Library
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <CardContent className="p-3">
                  <h3 
                    className="font-medium text-sm line-clamp-2 cursor-pointer hover:text-primary smooth-transition"
                    onClick={() => navigate(`/series/${series.source}/${series.seriesId}`)}
                  >
                    {series.title}
                  </h3>
                  
                  <div className="flex items-center justify-between mt-2">
                    <Badge variant={getStatusBadgeVariant(series.status)} className="text-xs">
                      {series.status.replace('-', ' ')}
                    </Badge>
                    
                    {seriesProgress && (
                      <span className="text-xs text-muted-foreground">
                        Ch. {seriesProgress.chapterId.split('-').pop()}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground mt-1">
                    Added {new Date(series.addedAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
            <Library className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            {filterStatus === 'all' ? 'Your library is empty' : `No ${filterStatus.replace('-', ' ')} series`}
          </h3>
          <p className="text-muted-foreground mb-4">
            {filterStatus === 'all' 
              ? 'Start building your manga collection by adding some series'
              : `You don't have any ${filterStatus.replace('-', ' ')} series yet`
            }
          </p>
          <Button onClick={() => navigate('/search')}>
            Add New Manga
          </Button>
        </div>
      )}
    </div>
  );
}