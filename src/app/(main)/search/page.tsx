"use client";

/**
 * Search Page
 *
 * A dedicated search page with:
 *   - Large auto-focused search input
 *   - Debounced search (300ms)
 *   - Type filter pills
 *   - Grid of ContentCard results
 *   - Empty / no-results states
 *   - Infinite-scroll-style "Load More"
 */

import { Suspense } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Loader2, Film, X, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ContentCard } from "@/components/home/ContentCard";
import type { Content, ContentType } from "@/lib/supabase/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEBOUNCE_MS = 300;
const PAGE_SIZE = 20;

const TYPE_FILTERS: { value: "" | ContentType; label: string }[] = [
  { value: "", label: "All" },
  { value: "movie", label: "Movies" },
  { value: "series", label: "Series" },
  { value: "anime", label: "Anime" },
  { value: "donghua", label: "Donghua" },
  { value: "microdrama", label: "Micro-Drama" },
];

// ---------------------------------------------------------------------------
// Search response type
// ---------------------------------------------------------------------------

interface SearchResponse {
  data: Content[];
  count: number;
  error: string | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchPageFallback />}>
      <SearchContent />
    </Suspense>
  );
}

// ---------------------------------------------------------------------------
// Search Content (uses useSearchParams, needs Suspense)
// ---------------------------------------------------------------------------

function SearchContent() {
  const searchParams = useSearchParams();

  // State
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [activeType, setActiveType] = useState<"" | ContentType>("");
  const [results, setResults] = useState<Content[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);

  // Auto-focus the input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Debounce the query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  // Reset and re-fetch when query or type changes
  useEffect(() => {
    // Only search if there's a debounced query
    if (!debouncedQuery) {
      setResults([]);
      setTotalCount(0);
      setPage(1);
      setHasMore(false);
      setError(null);
      return;
    }

    let cancelled = false;

    async function fetchSearch() {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          q: debouncedQuery,
          page: "1",
        });
        if (activeType) params.set("type", activeType);

        const res = await fetch(`/api/search?${params}`);
        const json: SearchResponse = await res.json();

        if (cancelled) return;

        if (json.error) {
          setError(json.error);
          setResults([]);
          setTotalCount(0);
        } else {
          setResults(json.data);
          setTotalCount(json.count);
          setHasMore(json.count > json.data.length);
        }
        setPage(1);
      } catch {
        if (!cancelled) {
          setError("Failed to search. Please try again.");
          setResults([]);
          setTotalCount(0);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchSearch();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, activeType]);

  // Load more (infinite scroll)
  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore || !debouncedQuery) return;

    const nextPage = page + 1;
    setIsLoading(true);

    try {
      const params = new URLSearchParams({
        q: debouncedQuery,
        page: String(nextPage),
      });
      if (activeType) params.set("type", activeType);

      const res = await fetch(`/api/search?${params}`);
      const json: SearchResponse = await res.json();

      if (json.error) {
        setError(json.error);
      } else {
        setResults((prev) => [...prev, ...json.data]);
        setTotalCount(json.count);
        setHasMore(json.count > results.length + json.data.length);
      }
      setPage(nextPage);
    } catch {
      setError("Failed to load more results.");
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, debouncedQuery, activeType, page, results.length]);

  // Intersection observer for infinite scroll
  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, isLoading, loadMore]);

  // Handle filter change
  const handleTypeChange = (type: "" | ContentType) => {
    setActiveType(type);
  };

  // Handle clear input
  const handleClear = () => {
    setQuery("");
    inputRef.current?.focus();
  };

  // Handle key down - Escape to clear
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleClear();
    }
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="min-h-[80vh] px-6 md:px-10 lg:px-0 max-w-[1400px] mx-auto pt-8 pb-24">
      {/* ---- Search Header ---- */}
      <div className="max-w-2xl mx-auto mb-8">
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search for movies, series, anime, and more..."
            className="h-[56px] pl-13 pr-13 text-base md:text-lg bg-cinema-elevated border-cinema-border rounded-2xl focus-visible:ring-cinema-red/50 placeholder:text-muted-foreground/60"
          />
          {query && (
            <button
              onClick={handleClear}
              className="absolute right-5 top-1/2 -translate-y-1/2 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-cinema-border/50 transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Type filter pills */}
        <div className="flex items-center gap-2 mt-4 flex-wrap">
          {TYPE_FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => handleTypeChange(filter.value)}
              className={`px-3.5 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                activeType === filter.value
                  ? "bg-cinema-red text-white shadow-lg shadow-cinema-red/20"
                  : "bg-cinema-elevated text-muted-foreground hover:text-foreground hover:bg-cinema-border/60 border border-cinema-border/80 rounded-lg"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* ---- Results Area ---- */}
      <div className="max-w-[1400px] mx-auto">
        {/* Results header */}
        {debouncedQuery && !isLoading && results.length > 0 && (
          <div className="flex items-center justify-between mb-8">
            <p className="text-sm text-muted-foreground">
              <span className="text-foreground font-semibold">{totalCount}</span>{" "}
              {totalCount === 1 ? "result" : "results"} for &ldquo;
              <span className="text-foreground">{debouncedQuery}</span>&rdquo;
            </p>
            {activeType && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleTypeChange("")}
                className="text-xs text-muted-foreground hover:text-foreground h-7"
              >
                <X className="w-3 h-3 mr-1" />
                Clear filter
              </Button>
            )}
          </div>
        )}

        {/* Loading skeleton (initial load) */}
        {isLoading && results.length === 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 sm:gap-4 md:gap-5">
            {Array.from({ length: 14 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-[2/3] rounded-xl bg-cinema-elevated" />
                <Skeleton className="h-4 w-3/4 bg-cinema-elevated" />
                <Skeleton className="h-3 w-1/2 bg-cinema-elevated" />
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-cinema-red/10 flex items-center justify-center mb-4">
              <Search className="w-7 h-7 text-cinema-red" />
            </div>
            <p className="text-foreground font-medium mb-1">Something went wrong</p>
            <p className="text-sm text-muted-foreground max-w-sm">{error}</p>
          </div>
        )}

        {/* Results grid */}
        {!isLoading && results.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 sm:gap-4 md:gap-5">
            {results.map((content, index) => (
              <ContentCard key={content.id} content={content} index={index} />
            ))}
          </div>
        )}

        {/* No results state */}
        {debouncedQuery &&
          !isLoading &&
          !error &&
          results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 rounded-full bg-cinema-elevated flex items-center justify-center mb-4">
                <Film className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="text-foreground font-medium mb-1">
                No results found for &ldquo;{debouncedQuery}&rdquo;
              </p>
              <p className="text-sm text-muted-foreground max-w-sm">
                Try different keywords, check your spelling, or browse by category
                instead.
              </p>
            </div>
          )}

        {/* Empty state (no query) */}
        {!debouncedQuery && !isLoading && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-24 h-24 rounded-full bg-cinema-elevated flex items-center justify-center mb-6 animate-pulse">
              <Search className="w-10 h-10 text-muted-foreground/50" />
            </div>
            <p className="text-lg font-medium text-foreground mb-2">
              Search for movies, series, anime, and more
            </p>
            <p className="text-sm text-muted-foreground max-w-md">
              Start typing to find your next favorite content. You can filter by
              type using the categories above.
            </p>
          </div>
        )}

        {/* Load more trigger */}
        {(hasMore || isLoading) && results.length > 0 && (
          <div ref={loaderRef} className="flex items-center justify-center py-12">
            {isLoading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Loading more...</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page-level fallback
// ---------------------------------------------------------------------------

function SearchPageFallback() {
  return (
    <div className="min-h-[80vh] px-5 md:px-8 lg:px-0 max-w-[1400px] mx-auto pt-10 pb-24">
      <div className="max-w-2xl mx-auto mb-8">
        <Skeleton className="h-[56px] w-full rounded-2xl bg-cinema-elevated" />
        <div className="flex gap-2 mt-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-20 rounded-lg bg-cinema-elevated" />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 sm:gap-4 md:gap-5">
        {Array.from({ length: 14 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="aspect-[2/3] rounded-xl bg-cinema-elevated" />
            <Skeleton className="h-4 w-3/4 rounded-lg bg-cinema-elevated" />
            <Skeleton className="h-3 w-1/2 rounded-lg bg-cinema-elevated" />
          </div>
        ))}
      </div>
    </div>
  );
}