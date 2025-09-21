import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Plus, Loader2, AlertCircle, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { searchWithRetry, getPopularManga, searchMultipleProviders, MANGA_PROVIDERS } from '@/lib/api';
import { addToLibrary, getLibrary } from '@/lib/storage';
import { MangaSearchResult, LibrarySeries } from '@/types/manga';
import SearchSuggestions from '@/components/SearchSuggestions';
import AdvancedSearch from '@/components/AdvancedSearch';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { cn } from '@/lib/utils';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState<MangaSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [librarySeriesIds, setLibrarySeriesIds] = useState<Set<string>>(new Set());
  const [hasSearched, setHasSearched] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [pagination, setPagination] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProvider, setSelectedProvider] = useState('all');
  const [selectedLanguage, setSelectedLanguage] = useState('all');

  useEffect(() => {
    loadLibraryIds();
    loadDefaultData();
  }, []);

  useEffect(() => {
    const searchQuery = searchParams.get('q');
    if (searchQuery && searchQuery !== query) {
      setQuery(searchQuery);
      performSearch(searchQuery);
    }
  }, [searchParams]);

  const loadDefaultData = async () => {
    if (!query) {
      setIsLoading(true);
      try {
        const response = await getPopularManga(1);
        setResults(response.data || []);
        setPagination(response.pagination);
        setCurrentPage(1);
      } catch (error) {
        console.error('Failed to load default data:', error);
      } finally {
        setIsLoading(false);
      }
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query.trim() });
      performSearch(query.trim());
    }
  };

  const performSearch = async (searchQuery: string, page = 1) => {
    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const response = searchQuery.trim() 
        ? await searchWithRetry(searchQuery, page)
        : await getPopularManga(page);
      
      setResults(response.data || []);
      setPagination(response.pagination);
      setCurrentPage(page);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search manga';
      setError(errorMessage);
      toast({
        title: 'Search failed',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    if (query.trim()) {
      performSearch(query, page);
    } else {
      loadDefaultDataForPage(page);
    }
  };

  const loadDefaultDataForPage = async (page: number) => {
    setIsLoading(true);
    try {
      const response = await getPopularManga(page);
      setResults(response.data || []);
      setPagination(response.pagination);
      setCurrentPage(page);
    } catch (error) {
      console.error('Failed to load data for page:', error);
    } finally {
      setIsLoading(false);
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

  return (
    <div className="container py-6 space-y-6">
      {/* Search Header */}
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Search Manga</h1>
        
        {/* Search Form */}
        <form onSubmit={handleSearch} className="max-w-2xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              type="search"
              placeholder="Search for manga titles..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="pl-10 pr-20 h-12 text-lg"
              disabled={isLoading}
            />
            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setShowAdvancedSearch(true)}
                disabled={isLoading}
              >
                <Filter className="h-4 w-4" />
              </Button>
              <Button 
                type="submit" 
                size="sm" 
                disabled={isLoading || !query.trim()}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Search Suggestions */}
            <SearchSuggestions
              query={query}
              isVisible={showSuggestions && !isLoading}
              onSelect={(suggestion) => {
                setQuery(suggestion);
                setShowSuggestions(false);
                setSearchParams({ q: suggestion });
                performSearch(suggestion);
              }}
            />
          </div>
        </form>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="aspect-[3/4] bg-muted animate-pulse" />
              <CardContent className="p-3 space-y-2">
                <div className="h-4 bg-muted rounded animate-pulse" />
                <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Search Results */}
      {!isLoading && results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              {query ? `Search Results (${pagination?.items?.total || results.length})` : `Popular Manga (${pagination?.items?.total || results.length})`}
            </h2>
            {pagination && (
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {pagination.last_visible_page}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {results.map((manga) => (
              <Card 
                key={manga.mal_id}
                className="group overflow-hidden hover:shadow-lg smooth-transition glass-card"
              >
                <div className="aspect-[3/4] relative overflow-hidden">
                  <img
                    src={manga.images.jpg.large_image_url || manga.images.jpg.image_url}
                    alt={manga.title}
                    className="w-full h-full object-cover group-hover:scale-105 smooth-transition"
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
                        View Details
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="w-full floating-action"
                        onClick={() => handleAddToLibrary(manga)}
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        Add to Library
                      </Button>
                    )}
                  </div>

                  {/* Status Badge */}
                  {manga.status && (
                    <Badge 
                      variant="secondary" 
                      className="absolute top-2 right-2 text-xs"
                    >
                      {manga.status}
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
                  
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    {manga.chapters && (
                      <span>{manga.chapters} chapters</span>
                    )}
                    {manga.score && (
                      <span>⭐ {manga.score}</span>
                    )}
                  </div>

                  {manga.genres && manga.genres.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {manga.genres.slice(0, 2).map((genre) => (
                        <Badge key={genre.mal_id} variant="outline" className="text-xs">
                          {genre.name}
                        </Badge>
                      ))}
                      {manga.genres.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{manga.genres.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.last_visible_page > 1 && (
            <div className="flex justify-center mt-8">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) {
                          handlePageChange(currentPage - 1);
                        }
                      }}
                      className={currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                  
                  {/* First page */}
                  {currentPage > 3 && (
                    <>
                      <PaginationItem>
                        <PaginationLink 
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(1);
                          }}
                        >
                          1
                        </PaginationLink>
                      </PaginationItem>
                      {currentPage > 4 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}
                    </>
                  )}
                  
                  {/* Current page range */}
                  {Array.from({ length: Math.min(5, pagination.last_visible_page) }, (_, i) => {
                    const page = Math.max(1, Math.min(currentPage - 2 + i, pagination.last_visible_page - 4 + i + 1));
                    if (page > pagination.last_visible_page) return null;
                    if (currentPage <= 3) {
                      const displayPage = i + 1;
                      if (displayPage > pagination.last_visible_page) return null;
                      return (
                        <PaginationItem key={displayPage}>
                          <PaginationLink 
                            href="#"
                            isActive={currentPage === displayPage}
                            onClick={(e) => {
                              e.preventDefault();
                              handlePageChange(displayPage);
                            }}
                          >
                            {displayPage}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }
                    if (currentPage > pagination.last_visible_page - 3) {
                      const displayPage = pagination.last_visible_page - 4 + i + 1;
                      if (displayPage < 1) return null;
                      return (
                        <PaginationItem key={displayPage}>
                          <PaginationLink 
                            href="#"
                            isActive={currentPage === displayPage}
                            onClick={(e) => {
                              e.preventDefault();
                              handlePageChange(displayPage);
                            }}
                          >
                            {displayPage}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink 
                          href="#"
                          isActive={currentPage === page}
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(page);
                          }}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  
                  {/* Last page */}
                  {currentPage < pagination.last_visible_page - 2 && (
                    <>
                      {currentPage < pagination.last_visible_page - 3 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}
                      <PaginationItem>
                        <PaginationLink 
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(pagination.last_visible_page);
                          }}
                        >
                          {pagination.last_visible_page}
                        </PaginationLink>
                      </PaginationItem>
                    </>
                  )}
                  
                  <PaginationItem>
                    <PaginationNext 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (pagination.has_next_page) {
                          handlePageChange(currentPage + 1);
                        }
                      }}
                      className={!pagination.has_next_page ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      )}

      {/* No Results */}
      {!isLoading && hasSearched && results.length === 0 && !error && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No results found</h3>
          <p className="text-muted-foreground">
            Try searching with different keywords or check your spelling
          </p>
        </div>
      )}


      {/* Advanced Search Modal */}
      {showAdvancedSearch && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <AdvancedSearch
            onClose={() => setShowAdvancedSearch(false)}
            onSearch={(searchQuery, provider, language) => {
              setSelectedProvider(provider || 'all');
              setSelectedLanguage(language || 'all');
              setQuery(searchQuery);
              setSearchParams({ q: searchQuery });
              performSearch(searchQuery);
              setShowAdvancedSearch(false);
            }}
          />
        </div>
      )}
    </div>
  );
}