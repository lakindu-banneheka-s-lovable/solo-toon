import { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MANGA_PROVIDERS } from '@/lib/api';

interface AdvancedSearchFilters {
  query: string;
  provider: string;
  language: string;
  status: string;
  genres: string[];
  type: string;
  year: string;
  score: string;
  sortBy: string;
  orderBy: 'asc' | 'desc';
}

interface AdvancedSearchProps {
  onClose: () => void;
  onSearch: (query: string, provider?: string, language?: string) => void;
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
  { value: 'start_date', label: 'Start Date' },
  { value: 'end_date', label: 'End Date' },
  { value: 'chapters', label: 'Chapters' },
  { value: 'title', label: 'Title' }
];

const LANGUAGE_OPTIONS = [
  { value: 'all', label: 'All Languages' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'zh', label: 'Chinese' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'pt-br', label: 'Portuguese (Brazil)' },
  { value: 'ru', label: 'Russian' }
];

export default function AdvancedSearch({ onClose, onSearch }: AdvancedSearchProps) {
  const [filters, setFilters] = useState<AdvancedSearchFilters>({
    query: '',
    provider: 'all',
    language: 'all',
    status: 'any',
    genres: [],
    type: 'any',
    year: '',
    score: '',
    sortBy: 'popularity',
    orderBy: 'desc'
  });

  const handleSearch = () => {
    onSearch(
      filters.query,
      filters.provider === 'all' ? undefined : filters.provider,
      filters.language === 'all' ? undefined : filters.language
    );
  };

  const handleReset = () => {
    setFilters({
      query: '',
      provider: 'all',
      language: 'all',
      status: 'any',
      genres: [],
      type: 'any',
      year: '',
      score: '',
      sortBy: 'popularity',
      orderBy: 'desc'
    });
  };

  const handleGenreToggle = (genre: string) => {
    setFilters(prev => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter(g => g !== genre)
        : [...prev.genres, genre]
    }));
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
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
          <label className="text-sm font-medium">Search Term</label>
          <Input
            placeholder="Enter manga title..."
            value={filters.query}
            onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
            className="w-full"
          />
        </div>

        <Separator />

        {/* Provider and Language */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Provider</label>
            <Select value={filters.provider} onValueChange={(value) => setFilters(prev => ({ ...prev, provider: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Providers</SelectItem>
                {MANGA_PROVIDERS.map(provider => (
                  <SelectItem key={provider.id} value={provider.id}>
                    {provider.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Language</label>
            <Select value={filters.language} onValueChange={(value) => setFilters(prev => ({ ...prev, language: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGE_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        {/* Basic Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

          <div className="space-y-2">
            <label className="text-sm font-medium">Year</label>
            <Input
              placeholder="e.g. 2020"
              value={filters.year}
              onChange={(e) => setFilters(prev => ({ ...prev, year: e.target.value }))}
              type="number"
              min="1900"
              max={new Date().getFullYear()}
            />
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
  );
}