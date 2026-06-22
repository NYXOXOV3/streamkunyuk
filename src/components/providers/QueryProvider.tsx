"use client";

/**
 * React Query (TanStack Query) Provider
 *
 * Wraps the application with QueryClientProvider.
 * Configured with sensible defaults for a streaming platform:
 *   - 5 min stale time (content metadata doesn't change often)
 *   - 30 min cache time
 *   - No retry on 401/403 (auth errors should be handled by guards)
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 5 * 1000,       // 5 minutes
        gcTime: 60 * 30 * 1000,          // 30 minutes (formerly cacheTime)
        retry: (failureCount, error) => {
          // Don't retry auth errors
          const msg =
            error instanceof Error ? error.message : String(error);
          if (msg.includes("401") || msg.includes("403")) return false;
          return failureCount < 2;
        },
        refetchOnWindowFocus: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: always make a new query client
    return makeQueryClient();
  }
  // Browser: make once and cache
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => getQueryClient());

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}