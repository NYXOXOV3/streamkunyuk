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
import { toast } from "sonner";
import { adminFetch } from "@/lib/admin/client-helpers";
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
  Layers,
  PlayCircle,
  Square,
  CheckSquare,
} from "lucide-react";

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

interface SearchResult {
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
}

interface ImportResultItem {
  tmdbId: number;
  title: string;
  success: boolean;
  error?: string;
  episodesImported?: number;
  seasonsImported?: number;
}

async function apiSearchTmdb(params: { query: string; type: "movie" | "tv"; page?: number }) {
  const sp = new URLSearchParams({ q: params.query, type: params.type, page: String(params.page || 1) });
  const res = await adminFetch(`/api/admin/content/search?${sp}`);
  return res.json();
}

async function apiImportTmdb(params: { tmdbId: number; type: "movie" | "tv" }) {
  const res = await adminFetch("/api/admin/content/import", {
    method: "POST",
    body: JSON.stringify(params),
  });
  return res.json();
}

async function apiBulkImport(items: { tmdbId: number; type: "movie" | "tv" }[]) {
  const res = await adminFetch("/api/admin/content/import", {
    method: "POST",
    body: JSON.stringify({ items }),
  });
  return res.json();
}

// ---------------------------------------------------------------------------
// Result Card (with checkbox for bulk)
// ---------------------------------------------------------------------------

function TmdbResultCard({
  result,
  type,
  selected,
  onToggleSelect,
  onImport,
  isImporting,
}: {
  result: SearchResult;
  type: "movie" | "tv";
  selected: boolean;
  onToggleSelect: () => void;
  onImport: () => void;
  isImporting: boolean;
}) {
  return (
    <Card className={`bg-cinema-surface border overflow-hidden rounded-2xl transition-all duration-200 ${selected ? "border-cinema-red/50 ring-1 ring-cinema-red/20" : "border-cinema-border"}`}>
      <div className="flex flex-col sm:flex-row">
        {/* Checkbox + Poster */}
        <div className="w-full sm:w-32 h-44 sm:h-auto bg-cinema-elevated shrink-0 relative">
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
          <div className="absolute top-2 left-2 z-10">
            <button
              onClick={(e) => { e.stopPropagation(); onToggleSelect(); }}
              className="w-7 h-7 rounded-md bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/80 transition-colors border border-white/10"
            >
              {selected ? (
                <CheckSquare className="w-4 h-4 text-cinema-red" />
              ) : (
                <Square className="w-4 h-4 text-white/70" />
              )}
            </button>
          </div>
          <Badge className="absolute top-2 right-2 text-[10px] bg-cinema-elevated/90 text-foreground border-cinema-border rounded-lg">
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
              <span className="text-[10px] text-muted-foreground/50">
                TMDB #{result.tmdb_id}
              </span>
            </div>
            {result.synopsis && (
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                {result.synopsis}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={onImport}
              disabled={isImporting}
              className="bg-cinema-red hover:bg-cinema-red-hover text-white text-xs rounded-xl shadow-lg shadow-cinema-red/20"
            >
              {isImporting ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5 mr-1.5" />
              )}
              Import
            </Button>
            {type === "tv" && (
              <Badge variant="outline" className="text-[10px] border-cinema-border text-muted-foreground rounded-lg">
                <Layers className="w-3 h-3 mr-1" />
                + Episodes
              </Badge>
            )}
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Import Progress Panel
// ---------------------------------------------------------------------------

function ImportProgressPanel({
  results,
  onClose,
}: {
  results: ImportResultItem[];
  onClose: () => void;
}) {
  const succeeded = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  return (
    <Card className="bg-cinema-surface border-cinema-border rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-cinema-border flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Import Results</h3>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-7 text-xs text-muted-foreground hover:text-foreground rounded-lg">
          Close
        </Button>
      </div>
      <CardContent className="p-4 space-y-2 max-h-80 overflow-y-auto">
        <div className="flex gap-3 text-xs mb-2">
          <span className="text-emerald-400">{succeeded} succeeded</span>
          {failed > 0 && <span className="text-red-400">{failed} failed</span>}
          <span className="text-muted-foreground">{results.length} total</span>
        </div>
        {results.map((r) => (
          <div
            key={r.tmdbId}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${r.success ? "bg-emerald-500/5 border border-emerald-500/10" : "bg-red-500/5 border border-red-500/10"}`}
          >
            {r.success ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
            )}
            <span className="text-foreground truncate flex-1">{r.title}</span>
            {r.success && r.episodesImported !== undefined && r.episodesImported > 0 && (
              <span className="text-muted-foreground shrink-0">
                {r.episodesImported} ep{r.seasonsImported ? ` · ${r.seasonsImported} S` : ""}
              </span>
            )}
            {r.error && (
              <span className="text-red-400/80 truncate max-w-[200px]" title={r.error}>
                {r.error}
              </span>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function TmdbImportPage() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<"movie" | "tv">("movie");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSearching, startSearchTransition] = useTransition();
  const [importingIds, setImportingIds] = useState<Set<number>>(new Set());
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Bulk state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isBulkImporting, setIsBulkImporting] = useState(false);
  const [importResults, setImportResults] = useState<ImportResultItem[] | null>(null);

  async function handleSearch(page: number = 1) {
    if (!query.trim()) return;
    setError(null);
    setHasSearched(true);
    setSelectedIds(new Set());
    setImportResults(null);
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

  function toggleSelect(tmdbId: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(tmdbId)) next.delete(tmdbId);
      else next.add(tmdbId);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === searchResults.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(searchResults.map((r) => r.tmdb_id)));
    }
  }

  async function handleImport(tmdbId: number) {
    setImportingIds((prev) => new Set(prev).add(tmdbId));
    const result = await apiImportTmdb({ tmdbId, type });
    if (result.success) {
      const parts = [`"${result.data?.title}" saved as draft.`];
      if (result.episodesImported) parts.push(`${result.episodesImported} episodes imported.`);
      if (result.seasonsImported) parts.push(`${result.seasonsImported} seasons.`);
      toast.success(parts.join(" "));
    } else {
      toast.error(result.error ?? "Unknown error");
    }
    setImportingIds((prev) => {
      const next = new Set(prev);
      next.delete(tmdbId);
      return next;
    });
  }

  async function handleBulkImport() {
    if (selectedIds.size === 0) return;
    setIsBulkImporting(true);
    setImportResults(null);

    const items = searchResults
      .filter((r) => selectedIds.has(r.tmdb_id))
      .map((r) => ({ tmdbId: r.tmdb_id, type }));

    const result = await apiBulkImport(items);

    if (result.results) {
      setImportResults(result.results);
      const succeeded = result.results.filter((r: ImportResultItem) => r.success).length;
      const totalEps = result.results.reduce((sum: number, r: ImportResultItem) => sum + (r.episodesImported ?? 0), 0);
      toast.success(`Imported ${succeeded} items (${totalEps} episodes total)`);
    } else if (result.error) {
      toast.error(result.error);
    }

    setIsBulkImporting(false);
    setSelectedIds(new Set());
  }

  const allSelected = searchResults.length > 0 && selectedIds.size === searchResults.length;

  return (
    <>
      <AdminHeader title="TMDB Import" />

      <div className="flex-1 p-8 space-y-6 overflow-y-auto">
        {/* Info banner */}
        <div className="bg-cinema-elevated/50 border border-cinema-border rounded-xl px-4 py-3 text-xs text-muted-foreground flex items-start gap-2">
          <PlayCircle className="w-4 h-4 mt-0.5 text-cinema-red shrink-0" />
          <div>
            <p className="text-foreground font-medium mb-0.5">Auto-import with VidAPI Player</p>
            <p>
              Movies and TV shows are imported with vidapi.qzz.io player URLs.
              TV shows automatically import all seasons and episodes.
              Imported content is saved as <span className="text-foreground">Draft</span> — publish when ready.
            </p>
          </div>
        </div>

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

        {/* Bulk actions bar */}
        {hasSearched && searchResults.length > 0 && (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {allSelected ? (
                  <CheckSquare className="w-4 h-4 text-cinema-red" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
                {allSelected ? "Deselect all" : "Select all"}
              </button>
              <span className="text-xs text-muted-foreground/50">
                {selectedIds.size} selected
              </span>
            </div>
            <Button
              size="sm"
              onClick={handleBulkImport}
              disabled={selectedIds.size === 0 || isBulkImporting}
              className="bg-cinema-red hover:bg-cinema-red-hover text-white text-xs rounded-xl shadow-lg shadow-cinema-red/20"
            >
              {isBulkImporting ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5 mr-1.5" />
              )}
              Import {selectedIds.size > 0 ? `(${selectedIds.size})` : ""}
            </Button>
          </div>
        )}

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

        {/* Import results panel */}
        {importResults && (
          <ImportProgressPanel results={importResults} onClose={() => setImportResults(null)} />
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
                  <Skeleton className="w-32 h-44 shrink-0 rounded-lg" />
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
              selected={selectedIds.has(result.tmdb_id)}
              onToggleSelect={() => toggleSelect(result.tmdb_id)}
              onImport={() => handleImport(result.tmdb_id)}
              isImporting={importingIds.has(result.tmdb_id)}
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