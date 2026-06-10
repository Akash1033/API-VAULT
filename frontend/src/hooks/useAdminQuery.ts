// Path: src/hooks/useAdminQuery.ts
// Purpose: Generic hook wrapping useQuery for admin resources
// Dependencies: @tanstack/react-query, useToast

import { useQuery } from '@tanstack/react-query';
import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useToast } from '../store/uiStore';

export function useAdminQuery<T>(
  key: string[],
  queryFn: () => Promise<T>,
  options?: Omit<UseQueryOptions<T, Error, T, string[]>, 'queryKey' | 'queryFn'>
): UseQueryResult<T, Error> {
  const { showToast } = useToast();
  
  const query = useQuery<T, Error, T, string[]>({
    queryKey: key,
    queryFn,
    ...options,
  });

  useEffect(() => {
    if (query.isError && query.error) {
      showToast(query.error.message || 'An error occurred while fetching data.', 'error');
    }
  }, [query.isError, query.error, showToast]);

  return query;
}
