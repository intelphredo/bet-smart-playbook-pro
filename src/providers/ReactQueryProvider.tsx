import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Optimized query client with intelligent caching
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: Data is fresh for 2 minutes
      staleTime: 2 * 60 * 1000,
      // GC time: Keep unused data for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Don't refetch on window focus - reduces unnecessary API calls
      refetchOnWindowFocus: false,
      // Don't refetch on reconnect - user can manually refresh
      refetchOnReconnect: false,
      // Retry failed requests with exponential backoff
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Keep previous data while fetching new data (prevents flicker)
      placeholderData: (previousData: unknown) => previousData,
      // Network mode: always fetch even when offline (use cache)
      networkMode: 'offlineFirst',
      // Structural sharing to prevent unnecessary re-renders
      structuralSharing: true,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
      // Network mode for mutations
      networkMode: 'offlineFirst',
    },
  },
});

// Enable devtools in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Log query cache stats periodically
  setInterval(() => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    const stats = {
      total: queries.length,
      stale: queries.filter(q => q.isStale()).length,
      fetching: queries.filter(q => q.state.fetchStatus === 'fetching').length,
    };
    console.debug('[QueryCache Stats]', stats);
  }, 60000); // Every minute
}

const ReactQueryProvider = ({ children }: { children: React.ReactNode }) => {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

export default ReactQueryProvider;
