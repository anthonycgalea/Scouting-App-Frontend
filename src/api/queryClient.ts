import { QueryCache, QueryClient } from '@tanstack/react-query';
import { ApiError } from './httpClient';

const queryCache = new QueryCache({
  onError: (error: unknown) => {
    if (error instanceof ApiError) {
      // eslint-disable-next-line no-console
      console.error('API query failed', error.metadata);
    }
  },
});

export const queryClient = new QueryClient({
  queryCache,
  defaultOptions: {
    queries: {
      retry: (failureCount: number, error: unknown) => {
        if (error instanceof ApiError && error.metadata.status >= 400 && error.metadata.status < 500) {
          return false;
        }

        return failureCount < 2;
      },
      staleTime: 1000 * 60,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
