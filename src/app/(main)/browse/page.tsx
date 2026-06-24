"use client";

/**
 * Browse Page
 *
 * Full catalog browsing with type filters, sort options, search,
 * responsive grid of ContentCards, and prev/next pagination.
 * Data is fetched via TanStack Query from /api/browse.
 *
 * Supports URL query params for deep-linking from home page:
 *   /browse?type=movie&sort=newest&search=...
 *
 * The actual content is wrapped in Suspense because useSearchParams()
 * requires a Suspense boundary in Next.js App Router.
 */

import { Suspense, useCallback, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Film,
  Tv,
  Sparkles,
  ScrollText,
  Clapperboard,
  Search,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ContentCard } from "@/components/home/ContentCard";
import type { Content } from "@/lib/supabase/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TYPE_FILTERS: { label: string; value: string; icon: React.ReactNode }[] = [
  { label: "All", value: "all", icon: <LayoutGrid className="w-4 h-4" /> },
  { label: "Movie", value: "movie", icon: <Film className="w-4 h-4" /> },
  { label: "Series", value: "series", icon: <Tv className="w-4 h-4" /> },
  { label: "Anime", value: "anime", icon: <Sparkles className="w-4 h-4" /> },
  { label: "Donghua", value: "donghua", icon: <ScrollText className="w-4 h-4" /> },
  { label: "Micro-Drama", value: "microdrama", icon: <Clapperboard className="w-4 h-4" /> },
];

const PAGE_SIZE = 24;

// ---------------------------------------------------------------------------
// API response type
// ---------------------------------------------------------------------------

interface BrowseResponse {
  data: Content[];
  count: number;
  error: string | null;
}

// ---------------------------------------------------------------------------
// Skeleton grid (loading state)
// ---------------------------------------------------------------------------

function BrowseSkeleton() {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 sm:gap-4 md:gap-5">
      {Array.from({ length: 14 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="aspect-[2/3] w-full rounded-xl bg-cinema-elevated" />
          <Skeleton className="h-4 w-3/4 rounded" />
          <Skeleton className="h-3 w-1/2 rounded" />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState({ search }: { search?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 rounded-full bg-cinema-red/5 flex items-center justify-center mb-4">
        <Search className="w-7 h-7 text-cinema-muted" />
      </div>
      <p className="text-foreground text-lg font-medium mb-1">
        No content found
      </p>
      <p className="text-muted-foreground text-sm max-w-sm">
        {search
          ? `No results for "${search}". Try a different search term or filter.`
          : "Try adjusting your filters or check back later for new content."}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Browse Content (inner component — uses useSearchParams, needs Suspense)
// ---------------------------------------------------------------------------

function BrowseContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Read initial values from URL query params (deep-link support)
  const initialType = searchParams.get("type") ?? "all";
  const initialSort = searchParams.get("sort") ?? "rating";
  const initialSearch = searchParams.get("search") ?? "";
  const initialPage = Number(searchParams.get("page")) || 1;

  const [activeType, setActiveType] = useState(initialType);
  const [sort, setSort] = useState(initialSort);
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [search, setSearch] = useState(initialSearch);
  const [page, setPage] = useState(initialPage);

  // Sync URL params when filters change
  const updateUrl = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      // Remove page when filters change (reset to page 1)
      if (!("page" in updates)) {
        params.delete("page");
      }
      router.replace(`/browse?${params.toString()}`, { scroll: false });
    },
    [searchParams, router],
  );

  // Build query string for API
  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (activeType && activeType !== "all") params.set("type", activeType);
    if (search) params.set("search", search);
    if (sort) params.set("sort", sort);
    params.set("page", String(page));
    params.set("pageSize", String(PAGE_SIZE));
    return params.toString();
  }, [activeType, search, sort, page]);

  // Fetch data with TanStack Query
  const { data, isLoading, isError, error } = useQuery<BrowseResponse>({
    queryKey: ["browse", activeType, sort, search, page],
    queryFn: async () => {
      const res = await fetch(`/api/browse?${queryParams}`);
      if (!res.ok) throw new Error("Failed to fetch content");
      return res.json();
    },
    staleTime: 60 * 2 * 1000, // 2 min — browse results can change
  });

  const contents = data?.data ?? [];
  const totalCount = data?.count ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // --- Handlers ---

  const handleTypeChange = (value: string) => {
    setActiveType(value);
    setPage(1);
    updateUrl({ type: value !== "all" ? value : "" });
  };

  const handleSortChange = (value: string) => {
    setSort(value);
    setPage(1);
    updateUrl({ sort: value });
  };

  const handleSearch = () => {
    const trimmed = searchInput.trim();
    setSearch(trimmed);
    setPage(1);
    updateUrl({ search: trimmed });
  };

  const handleSearchClear = () => {
    setSearchInput("");
    setSearch("");
    setPage(1);
    updateUrl({ search: "" });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage((p) => p - 1);
      updateUrl({ page: String(page - 1) });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage((p) => p + 1);
      updateUrl({ page: String(page + 1) });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Active type label
  const activeTypeLabel =
    TYPE_FILTERS.find((f) => f.value === activeType)?.label ?? "All";

  return (
    <div className="min-h-screen bg-cinema-bg">
      {/* ---------------------------------------------------------------- */}
      {/* Header Section                                                    */}
      {/* ---------------------------------------------------------------- */}
      <section className="pt-10 pb-8 px-5 md:px-8 lg:px-0 max-w-[1400px] mx-auto">
        {/* Page title */}
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-1">
          Browse
        </h1>
        {activeType !== "all" && (
          <p className="text-muted-foreground text-sm mb-4">
            Showing {activeTypeLabel} content
          </p>
        )}

        {/* Search bar */}
        <div className="relative max-w-sm mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cinema-muted pointer-events-none" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search titles..."
            className="pl-9 pr-9 h-10 rounded-xl bg-cinema-surface border-cinema-border text-foreground placeholder:text-cinema-muted focus-visible:ring-cinema-red/30 focus-visible:border-cinema-red/50"
          />
          {searchInput && (
            <button
              onClick={handleSearchClear}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-cinema-muted hover:text-foreground transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filters row: Type pills + Sort dropdown */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Type filter pills */}
          <div className="flex flex-wrap gap-2">
            {TYPE_FILTERS.map((filter) => (
              <Button
                key={filter.value}
                variant={activeType === filter.value ? "default" : "outline"}
                size="sm"
                onClick={() => handleTypeChange(filter.value)}
                className={
                  activeType === filter.value
                    ? "bg-cinema-red hover:bg-cinema-red-hover text-white border-cinema-red shadow-lg shadow-cinema-red/20 rounded-lg gap-1.5"
                    : "bg-cinema-surface border-cinema-border/80 text-muted-foreground hover:text-foreground hover:border-muted-foreground/30 rounded-lg gap-1.5"
                }
              >
                {filter.icon}
                <span className="hidden sm:inline">{filter.label}</span>
              </Button>
            ))}
          </div>

          {/* Sort dropdown */}
          <div className="ml-auto">
            <Select value={sort} onValueChange={handleSortChange}>
              <SelectTrigger
                size="sm"
                className="w-[140px] h-10 rounded-lg bg-cinema-surface border-cinema-border text-muted-foreground focus:ring-cinema-red/30 focus:border-cinema-red/50"
              >
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-cinema-border">
                <SelectItem value="rating">Top Rated</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="az">A — Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Content Grid                                                      */}
      {/* ---------------------------------------------------------------- */}
      <section className="px-5 md:px-8 lg:px-0 max-w-[1400px] mx-auto pb-6">
        {/* Error state */}
        {isError && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-destructive text-sm mb-2">
              Something went wrong
            </p>
            <p className="text-muted-foreground text-xs">
              {error instanceof Error ? error.message : "Please try again."}
            </p>
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading && <BrowseSkeleton />}

        {/* Empty state */}
        {!isLoading && !isError && contents.length === 0 && (
          <EmptyState search={search || undefined} />
        )}

        {/* Content grid */}
        {!isLoading && !isError && contents.length > 0 && (
          <>
            {/* Result count */}
            <p className="text-xs text-muted-foreground/60 mb-4">
              {totalCount.toLocaleString()}{" "}
              {totalCount === 1 ? "title" : "titles"} found
            </p>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 sm:gap-4 md:gap-5">
              {contents.map((content, index) => (
                <ContentCard
                  key={content.id}
                  content={content}
                  index={index}
                />
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        {!isLoading && !isError && totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-12 pb-8">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={page <= 1}
              className="h-10 rounded-lg bg-cinema-surface border-cinema-border text-muted-foreground hover:text-foreground hover:border-cinema-muted/50 disabled:opacity-40 disabled:pointer-events-none gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>

            <span className="text-sm text-cinema-muted tabular-nums">
              Page{" "}
              <span className="text-foreground font-medium">{page}</span>
              <span className="mx-1">of</span>
              <span className="text-foreground font-medium">{totalPages}</span>
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={page >= totalPages}
              className="h-10 rounded-lg bg-cinema-surface border-cinema-border text-muted-foreground hover:text-foreground hover:border-cinema-muted/50 disabled:opacity-40 disabled:pointer-events-none gap-1.5"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page Export — wraps BrowseContent in Suspense for useSearchParams()
// ---------------------------------------------------------------------------

export default function BrowsePage() {
  return (
    <Suspense fallback={<BrowsePageFallback />}>
      <BrowseContent />
    </Suspense>
  );
}

// ---------------------------------------------------------------------------
// Page-level fallback (matches the header structure)
// ---------------------------------------------------------------------------

function BrowsePageFallback() {
  return (
    <div className="min-h-screen bg-cinema-bg">
      <section className="pt-10 pb-8 px-5 md:px-8 lg:px-0 max-w-[1400px] mx-auto">
        {/* Title skeleton */}
        <Skeleton className="h-9 w-32 rounded mb-1 bg-cinema-elevated" />
        {/* Search bar skeleton */}
        <Skeleton className="h-10 max-w-sm w-full rounded-xl mb-5 bg-cinema-elevated" />
        {/* Filter pills skeleton */}
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-8 w-20 rounded-full bg-cinema-elevated"
            />
          ))}
        </div>
      </section>
      <section className="px-5 md:px-8 lg:px-0 max-w-[1400px] mx-auto pb-6">
        <BrowseSkeleton />
      </section>
    </div>
  );
}