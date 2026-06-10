// Path: src/hooks/useAdminMutation.ts
// Purpose: Generic hook wrapping useMutation for admin CRUD operations
// Dependencies: @tanstack/react-query, useToast

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseMutationOptions } from '@tanstack/react-query';
import { useToast } from '../store/uiStore';

interface AdminMutationOptions<TData, TVariables> extends Omit<UseMutationOptions<TData, Error, TVariables>, 'mutationFn' | 'onSuccess' | 'onError'> {
  successMessage: string;
  invalidateKeys?: string[][];
  onSuccessCallback?: (data: TData) => void;
}

export function useAdminMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: AdminMutationOptions<TData, TVariables>
) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { successMessage, invalidateKeys = [], onSuccessCallback, ...restOptions } = options;

  return useMutation<TData, Error, TVariables>({
    mutationFn,
    ...restOptions,
    onSuccess: (data) => {
      invalidateKeys.forEach(key => {
        queryClient.invalidateQueries({ queryKey: key });
      });
      showToast(successMessage, 'success');
      if (onSuccessCallback) {
        onSuccessCallback(data);
      }
    },
    onError: (error: Error) => {
      const axiosError = error as Error & { response?: { data?: { message?: string } } };
      const message = axiosError?.response?.data?.message || error.message || 'Mutation failed';
      showToast(message, 'error');
    }
  });
}
