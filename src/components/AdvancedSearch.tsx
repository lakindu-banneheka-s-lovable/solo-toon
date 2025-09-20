import { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface AdvancedSearchFilters {
  query: string;
  status: string;
  genres: string[];
  type: string;
  year: string;
  score: string;
  sortBy: string;
  orderBy: 'asc' | 'desc';
}

interface AdvancedSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (filters: AdvancedSearchFilters) => void;
  initialFilters?: Partial<AdvancedSearchFilters>;
}

const GENRES = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Ecchi', 'Fantasy', 'Horror',
  'Mahou Shoujo', 'Mecha', 'Music', 'Mystery', 'Psychological', 'Romance',
  'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural', 'Thriller'
];

const STATUS_OPTIONS = [
  { value: 'any', label: 'Any Status' },
  { value: 'publishing', label: 'Publishing' },
  { value: 'complete', label: 'Complete' },
  { value: 'hiatus', label: 'On Hiatus' },
  { value: 'discontinued', label: 'Discontinued' }
];

const TYPE_OPTIONS = [
  { value: 'any', label: 'Any Type' },
  { value: 'manga', label: 'Manga' },
  { value: 'novel', label: 'Light Novel' },
  { value: 'oneshot', label: 'One-shot' },
  { value: 'doujin', label: 'Doujinshi' },
  { value: 'manhwa', label: 'Manhwa' },
  { value: 'manhua', label: 'Manhua' }
];

const SORT_OPTIONS = [
  { value: 'popularity', label: 'Popularity' },
  { value: 'score', label: 'Score' },
  { value: 'title', label: 'Title' },
  { value: 'start_date', label: 'Start Date' },
  { value: 'end_date', label: 'End Date' },
  { value: 'chapters', label: 'Chapters' }
];

const SCORE_OPTIONS = [
  { value: 'any', label: 'Any Score' },
  { value: '9', label: '9+ Stars' },
  { value: '8', label: '8+ Stars' },
  { value: '7', label: '7+ Stars' },
  { value: '6', label: '6+ Stars' },
  { value: '5', label: '5+ Stars' }
];

export default function AdvancedSearch({ isOpen, onClose, onSearch, initialFilters = {} }: AdvancedSearchProps) {
  const [filters, setFilters] = useState<AdvancedSearchFilters>({
    query: '',
    status: 'any',
    genres: [],
    type: 'any',
    year: '',
    score: 'any',
    sortBy: 'popularity',
    orderBy: 'desc',
    ...initialFilters
  });

  const handleGenreToggle = (genre: string) => {
    setFilters(prev => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter(g => g !== genre)
        : [...prev.genres, genre]
    }));
  };

  const handleSearch = () => {
    onSearch(filters);
    onClose();
  };

  const handleReset = () => {
    setFilters({
      query: '',
      status: 'any',
      genres: [],
      type: 'any',
      year: '',
      score: 'any',
      sortBy: 'popularity',
      orderBy: 'desc'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Advanced Search
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Search Query */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Search Query</label>
            <Input
              placeholder="Enter manga title or keywords..."
              value={filters.query}
              onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
            />
          </div>

          <Separator />

          {/* Status and Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Year and Score */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Year</label>
              <Input
                type="number"
                placeholder="e.g. 2020"
                min="1900"
                max="2030"
                value={filters.year}
                onChange={(e) => setFilters(prev => ({ ...prev, year: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Minimum Score</label>
              <Select value={filters.score} onValueChange={(value) => setFilters(prev => ({ ...prev, score: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCORE_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Genres */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Genres</label>
            <div className="flex flex-wrap gap-2">
              {GENRES.map(genre => (
                <Badge
                  key={genre}
                  variant={filters.genres.includes(genre) ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground smooth-transition"
                  onClick={() => handleGenreToggle(genre)}
                >
                  {genre}
                </Badge>
              ))}
            </div>
            {filters.genres.length > 0 && (
              <div className="text-sm text-muted-foreground">
                Selected: {filters.genres.join(', ')}
              </div>
            )}
          </div>

          <Separator />

          {/* Sort Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Sort By</label>
              <Select value={filters.sortBy} onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Order</label>
              <Select value={filters.orderBy} onValueChange={(value: 'asc' | 'desc') => setFilters(prev => ({ ...prev, orderBy: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Descending</SelectItem>
                  <SelectItem value="asc">Ascending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={handleReset}>
              Reset Filters
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSearch}>
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}