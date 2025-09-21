import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, TrendingUp, Search } from 'lucide-react';
import { searchSuggestions } from '@/lib/api';
import { MangaSearchResult } from '@/types/manga';

interface SearchSuggestionsProps {
  query: string;
  onSelect: (suggestion: string) => void;
  isVisible: boolean;
}

const POPULAR_SEARCHES = [
  'One Piece',
  'Naruto',
  'Attack on Titan',
  'Demon Slayer',
  'My Hero Academia',
  'Death Note',
  'Jujutsu Kaisen',
  'Tokyo Ghoul',
  'Dragon Ball',
  'Bleach'
];

const GENRE_SUGGESTIONS = [
  'Action',
  'Adventure',
  'Comedy',
  'Drama',
  'Fantasy',
  'Horror',
  'Romance',
  'Sci-Fi',
  'Slice of Life',
  'Supernatural'
];

export default function SearchSuggestions({ query, onSelect, isVisible }: SearchSuggestionsProps) {
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [apiSuggestions, setApiSuggestions] = useState<MangaSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load recent searches from localStorage
    const recent = localStorage.getItem('recentSearches');
    if (recent) {
      try {
        setRecentSearches(JSON.parse(recent));
      } catch (error) {
        console.error('Failed to parse recent searches:', error);
      }
    }
  }, []);

  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setApiSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await searchSuggestions(searchQuery);
      setApiSuggestions(response.data || []);
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
      setApiSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchSuggestions(query);
    }, 300); // Debounce API calls

    return () => clearTimeout(timeoutId);
  }, [query, fetchSuggestions]);

  const saveRecentSearch = (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    const updated = [trimmed, ...recentSearches.filter(s => s !== trimmed)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const handleSelect = (suggestion: string) => {
    saveRecentSearch(suggestion);
    onSelect(suggestion);
  };

  if (!isVisible) return null;

  const filteredPopular = POPULAR_SEARCHES.filter(item =>
    item.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5);

  const filteredGenres = GENRE_SUGGESTIONS.filter(item =>
    item.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 3);

  const hasResults = filteredPopular.length > 0 || filteredGenres.length > 0 || recentSearches.length > 0;

  if (!hasResults && query.length === 0) {
    return (
      <Card className="absolute top-full left-0 right-0 z-50 mt-1 p-4 shadow-lg">
        <div className="space-y-4">
          {recentSearches.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Recent</span>
              </div>
              <div className="space-y-1">
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    className="block w-full text-left px-2 py-1 rounded hover:bg-muted smooth-transition text-sm"
                    onClick={() => handleSelect(search)}
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Popular</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {POPULAR_SEARCHES.slice(0, 6).map((suggestion) => (
                <Badge
                  key={suggestion}
                  variant="secondary"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground smooth-transition"
                  onClick={() => handleSelect(suggestion)}
                >
                  {suggestion}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Show API suggestions when user is typing
  if (query.length >= 2) {
    return (
      <Card className="absolute top-full left-0 right-0 z-50 mt-1 p-4 shadow-lg">
        <div className="space-y-4">
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Search className="h-4 w-4 animate-pulse" />
              Searching...
            </div>
          )}
          
          {!isLoading && apiSuggestions.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Suggestions</span>
              </div>
              <div className="space-y-1">
                {apiSuggestions.slice(0, 5).map((manga) => (
                  <button
                    key={manga.mal_id}
                    className="flex items-center gap-3 w-full text-left px-2 py-2 rounded hover:bg-muted smooth-transition"
                    onClick={() => handleSelect(manga.title)}
                  >
                    <img
                      src={manga.images.jpg.small_image_url}
                      alt={manga.title}
                      className="w-8 h-10 object-cover rounded"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder.svg';
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{manga.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {manga.status} • {manga.chapters ? `${manga.chapters} ch` : 'N/A'}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {!isLoading && apiSuggestions.length === 0 && query.length >= 2 && (
            <div className="text-sm text-muted-foreground text-center py-2">
              No suggestions found
            </div>
          )}

          {filteredPopular.length > 0 && (
            <div>
              <span className="text-sm font-medium text-muted-foreground mb-2 block">Popular</span>
              <div className="flex flex-wrap gap-2">
                {filteredPopular.slice(0, 3).map((suggestion) => (
                  <Badge
                    key={suggestion}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground smooth-transition"
                    onClick={() => handleSelect(suggestion)}
                  >
                    {suggestion}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    );
  }

  if (!hasResults) return null;

  return (
    <Card className="absolute top-full left-0 right-0 z-50 mt-1 p-4 shadow-lg">
      <div className="space-y-4">
        {filteredPopular.length > 0 && (
          <div>
            <span className="text-sm font-medium text-muted-foreground mb-2 block">Manga</span>
            <div className="space-y-1">
              {filteredPopular.map((suggestion) => (
                <button
                  key={suggestion}
                  className="block w-full text-left px-2 py-1 rounded hover:bg-muted smooth-transition text-sm"
                  onClick={() => handleSelect(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {filteredGenres.length > 0 && (
          <div>
            <span className="text-sm font-medium text-muted-foreground mb-2 block">Genres</span>
            <div className="flex flex-wrap gap-2">
              {filteredGenres.map((genre) => (
                <Badge
                  key={genre}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground smooth-transition"
                  onClick={() => handleSelect(genre)}
                >
                  {genre}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}