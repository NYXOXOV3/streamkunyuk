"use client";

import { useState, useTransition } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
// Fetch-based, no server actions
async function apiSearchTmdb(params: { query: string; type: "movie" | "tv"; page?: number }) {
  const sp = new URLSearchParams({ q: params.query, type: params.type, page: String(params.page || 1) });
  const res = await fetch(`/api/admin/content/search?${sp}`);
  return res.json();
}

async function apiImportTmdb(params: { tmdbId: number; type: "movie" | "tv" }) {
  const res = await fetch("/api/admin/content/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  return res.json();
}
import {
  Search,
  Download,
  Loader2,
  Film,
  Tv,
  Star,
  Calendar,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

// ---------------------------------------------------------------------------
// TMDB Search Result Card
// ---------------------------------------------------------------------------

function TmdbResultCard({
  result,
  type,
  onImport,
  isImporting,
}: {
  result: {
    tmdb_id: number;
    title: string;
    original_title: string | null;
    synopsis: string | null;
    type: "movie" | "series";
    release_year: number | null;
    poster_url: string | null;
    backdrop_url: string | null;
    rating: number;
    rating_count: number;
  };
  type: "movie" | "tv";
  onImport: () => void;
  isImporting: boolean;
}) {
  return (
    <Card className="bg-cinema-surface border-cinema-border overflow-hidden rounded-2xl">
      <div className="flex flex-col sm:flex-row">
        {/* Poster */}
        <div className="w-full sm:w-28 h-40 sm:h-auto bg-cinema-elevated shrink-0 relative">
          {result.poster_url ? (
            <img
              src={result.poster_url}
              alt={result.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <Film className="w-8 h-8" />
            </div>
          )}
          <Badge className="absolute top-2 left-2 text-[10px] bg-cinema-elevated/90 text-foreground border-cinema-border rounded-lg">
            {type === "movie" ? "Movie" : "Series"}
          </Badge>
        </div>

        {/* Info */}
        <CardContent className="flex-1 p-4 flex flex-col justify-between gap-3">
          <div>
            <h3 className="font-semibold text-foreground text-sm leading-tight">
              {result.title}
            </h3>
            {result.original_title &&
              result.original_title !== result.title && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {result.original_title}
                </p>
              )}
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              {result.release_year && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {result.release_year}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3 text-cinema-gold" />
                {result.rating}
                <span className="text-muted-foreground/60">
                  ({result.rating_count.toLocaleString()})
                </span>
              </span>
            </div>
            {result.synopsis && (
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                {result.synopsis}
              </p>
            )}
          </div>

          <Button
            size="sm"
            onClick={onImport}
            disabled={isImporting}
            className="w-fit bg-cinema-red hover:bg-cinema-red-hover text-white text-xs rounded-xl shadow-lg shadow-cinema-red/20"
          >
            {isImporting ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5 mr-1.5" />
            )}
            Import
          </Button>
        </CardContent>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function TmdbImportPage() {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [type, setType] = useState<"movie" | "tv">("movie");
  const [searchResults, setSearchResults] = useState<{
    tmdb_id: number;
    title: string;
    original_title: string | null;
    synopsis: string | null;
    type: "movie" | "series";
    release_year: number | null;
    poster_url: string | null;
    backdrop_url: string | null;
    rating: number;
    rating_count: number;
  }[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSearching, startSearchTransition] = useTransition();
  const [importingId, setImportingId] = useState<number | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(page: number = 1) {
    if (!query.trim()) return;
    setError(null);
    setHasSearched(true);
    startSearchTransition(async () => {
      const result = await apiSearchTmdb({ query, type, page });
      if (result.error) {
        setError(result.error);
        setSearchResults([]);
      } else {
        setSearchResults(result.results);
        setTotalResults(result.totalResults);
        setTotalPages(result.totalPages);
        setCurrentPage(page);
      }
    });
  }

  async function handleImport(tmdbId: number) {
    setImportingId(tmdbId);
    const result = await apiImportTmdb({ tmdbId, type });
    if (result.success) {
      toast({
        title: "Imported!",
        description: `"${result.data?.title}" saved as draft.`,
      });
    } else {
      toast({
        title: "Import failed",
        description: result.error ?? "Unknown error",
        variant: "destructive",
      });
    }
    setImportingId(null);
  }

  return (
    <>
      <AdminHeader title="TMDB Import" />

      <div className="flex-1 p-8 space-y-6 overflow-y-auto">
        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3 max-w-2xl">
          <div className="flex-1">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search movies or TV shows..."
              className="h-10 rounded-xl bg-cinema-elevated border-cinema-border"
            />
          </div>
          <Select
            value={type}
            onValueChange={(v) => setType(v as "movie" | "tv")}
          >
            <SelectTrigger className="w-full sm:w-36 h-10 rounded-xl bg-cinema-elevated border-cinema-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-cinema-surface border-cinema-border">
              <SelectItem value="movie">
                <span className="flex items-center gap-2">
                  <Film className="w-3.5 h-3.5" /> Movie
                </span>
              </SelectItem>
              <SelectItem value="tv">
                <span className="flex items-center gap-2">
                  <Tv className="w-3.5 h-3.5" /> TV Series
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={() => handleSearch(1)}
            disabled={isSearching || !query.trim()}
            className="h-10 bg-cinema-red hover:bg-cinema-red-hover text-white rounded-xl"
          >
            {isSearching ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Search className="w-4 h-4 mr-2" />
            )}
            Search
          </Button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3 text-sm text-destructive flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Search failed</p>
              <p className="text-xs mt-0.5 opacity-80">{error}</p>
            </div>
          </div>
        )}

        {/* Results count */}
        {hasSearched && !error && searchResults.length > 0 && (
          <p className="text-sm text-muted-foreground">
            Found <span className="text-foreground font-medium">{totalResults.toLocaleString()}</span> results
            {totalPages > 1 && (
              <span>
                {" "}— Page {currentPage} of {totalPages}
              </span>
            )}
          </p>
        )}

        {/* Loading skeleton */}
        {isSearching && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card
                key={i}
                className="bg-cinema-surface border-cinema-border overflow-hidden rounded-2xl"
              >
                <div className="flex">
                  <Skeleton className="w-28 h-40 shrink-0 rounded-lg" />
                  <div className="flex-1 p-4 space-y-2">
                    <Skeleton className="h-4 w-2/3 rounded-lg" />
                    <Skeleton className="h-3 w-1/3 rounded-lg" />
                    <Skeleton className="h-3 w-full rounded-lg" />
                    <Skeleton className="h-3 w-5/6 rounded-lg" />
                    <Skeleton className="h-8 w-20 mt-4 rounded-lg" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* No results */}
        {hasSearched && !isSearching && searchResults.length === 0 && !error && (
          <div className="text-center py-16">
            <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No results found</p>
          </div>
        )}

        {/* Results list */}
        <div className="space-y-4">
          {searchResults.map((result) => (
            <TmdbResultCard
              key={`${type}-${result.tmdb_id}`}
              result={result}
              type={type}
              onImport={() => handleImport(result.tmdb_id)}
              isImporting={importingId === result.tmdb_id}
            />
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pb-4">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1 || isSearching}
              onClick={() => handleSearch(currentPage - 1)}
              className="border-cinema-border text-xs rounded-xl"
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground px-3">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages || isSearching}
              onClick={() => handleSearch(currentPage + 1)}
              className="border-cinema-border text-xs rounded-xl"
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </>
  );
}