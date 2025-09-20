import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LibrarySeries, ReadingProgress } from '@/lib/storage';
import { 
  getLibrary, 
  getProgress, 
  addToLibrary as addToStorageLibrary,
  removeFromLibrary as removeFromStorageLibrary,
  updateSeriesStatus as updateStorageSeriesStatus
} from '@/lib/storage';

export function useLibrary() {
  const queryClient = useQueryClient();

  const libraryQuery = useQuery({
    queryKey: ['library'],
    queryFn: getLibrary,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const progressQuery = useQuery({
    queryKey: ['progress'],
    queryFn: getProgress,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const addToLibraryMutation = useMutation({
    mutationFn: addToStorageLibrary,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library'] });
    }
  });

  const removeFromLibraryMutation = useMutation({
    mutationFn: ({ seriesId, source }: { seriesId: string; source: string }) => 
      removeFromStorageLibrary(seriesId, source),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library'] });
    }
  });

  const updateSeriesStatusMutation = useMutation({
    mutationFn: ({ 
      seriesId, 
      source, 
      status 
    }: { 
      seriesId: string; 
      source: string; 
      status: LibrarySeries['status'];
    }) => updateStorageSeriesStatus(seriesId, source, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library'] });
    }
  });

  return {
    library: libraryQuery.data || [],
    progress: progressQuery.data || {},
    isLoading: libraryQuery.isLoading || progressQuery.isLoading,
    error: libraryQuery.error || progressQuery.error,
    addToLibrary: addToLibraryMutation.mutate,
    removeFromLibrary: removeFromLibraryMutation.mutate,
    updateSeriesStatus: updateSeriesStatusMutation.mutate,
    isAddingToLibrary: addToLibraryMutation.isPending,
    isRemovingFromLibrary: removeFromLibraryMutation.isPending,
    isUpdatingStatus: updateSeriesStatusMutation.isPending,
    refetch: () => {
      libraryQuery.refetch();
      progressQuery.refetch();
    }
  };
}