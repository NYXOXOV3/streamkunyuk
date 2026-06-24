"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { adminFetch } from "@/lib/admin/client-helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Loader2,
  Download,
  Search,
  Play,
  Film,
  ExternalLink,
  Star,
  Clock,
} from "lucide-react";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MeloloBook {
  drama_name: string;
  drama_id: string;
  description: string;
  episode_count: string | number;
  language: string;
  thumb_url: string;
  tags: string[];
  watch_value: string;
  is_new_book: string;
}

interface ImportResult {
  success: boolean;
  contentId?: string;
  title?: string;
  error?: string;
  episodes?: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatNumber(n: string): string {
  const num = parseFloat(n.replace(/[^0-9.]/g, ""));
  if (isNaN(num)) return n;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return n;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function MeloloImportPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [mode, setMode] = useState<"home" | "new" | "popular" | "search">("popular");
  const [results, setResults] = useState<MeloloBook[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [importing, setImporting] = useState<string | null>(null);
  const [imported, setImported] = useState<Set<string>>(new Set());
  const [autoSource, setAutoSource] = useState("melolo-popular");
  const [autoPageFrom, setAutoPageFrom] = useState(1);
  const [autoPageTo, setAutoPageTo] = useState(1);

  // ---- Fetch dramas from Melolo ----
  async function fetchDramas(m: string, q = "") {
    setIsLoading(true);
    try {
      const baseUrl = "https://api.sonzaix.indevs.in/melolo";
      let url = "";
      switch (m) {
        case "home":
          url = `${baseUrl}/home?page=1&lang=id`;
          break;
        case "new":
          url = `${baseUrl}/new?page=1&lang=id`;
          break;
        case "popular":
          url = `${baseUrl}/populer?page=1&lang=id`;
          break;
        case "search":
          url = `${baseUrl}/search?q=${encodeURIComponent(q)}&page=1&lang=id`;
          break;
      }
      const res = await fetch(url);
      const json = await res.json();

      // Extract books from the nested response
      let books: MeloloBook[] = [];
      if (json.data) {
        if (Array.isArray(json.data)) {
          // home: data = [{ books: [...] }]
          // populer: data = [{ books: [...] }, { books: [...] }]
          for (const item of json.data) {
            if (item.books) books = books.concat(item.books);
          }
        }
      }
      setResults(books);
    } catch (e) {
      toast.error(`Failed to fetch: ${(e as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  }

  // ---- Import drama to local DB ----
  const importMutation = useMutation({
    mutationFn: async (drama: MeloloBook): Promise<ImportResult> => {
      const res = await adminFetch("/api/admin/content/melolo-import", {
        method: "POST",
        body: JSON.stringify({
          drama_id: drama.drama_id,
          drama_name: drama.drama_name,
          description: drama.description,
          thumb_url: drama.thumb_url,
          tags: drama.tags,
          episode_count: Number(drama.episode_count),
          language: drama.language,
        }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json;
    },
    onSuccess: (data) => {
      if (data.contentId) {
        setImported((prev) => new Set(prev).add(data.contentId!));
      }
      queryClient.invalidateQueries({ queryKey: ["admin-content-list"] });
      toast.success(`"${data.title}" imported (${data.episodes} episodes)`);
    },
    onError: (e, drama) => {
      toast.error(`Failed to import "${drama.drama_name}": ${e.message}`);
    },
    onSettled: () => {
      setImporting(null);
    },
  });

  function handleImport(drama: MeloloBook) {
    setImporting(drama.drama_id);
    importMutation.mutate(drama);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      setMode("search");
      fetchDramas("search", searchQuery.trim());
    }
  }

  return (
    <>
      <AdminHeader title="Melolo Import" />

      <div className="flex-1 p-8 space-y-6 overflow-y-auto">
        {/* Description */}
        <p className="text-[13px] text-muted-foreground/70 leading-relaxed max-w-2xl">
          Browse and import short dramas from the Melolo API. Each import pulls
          the drama metadata and all available episodes into your local database.
        </p>

        {/* Page Range Auto Import */}
        <Card className="bg-cinema-surface border-cinema-border rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-[15px] font-semibold text-foreground flex items-center gap-2">
              <Download className="w-4 h-4 text-cinema-red" />
              Auto Import by Page Range
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-[12px] text-muted-foreground/70">
              Import all dramas from a specific page range. Setiap drama akan otomatis di-import
              dengan semua episode + stream URL.
            </p>
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className="text-[11px] text-muted-foreground/70 block mb-1">Source</label>
                <select
                  value={autoSource}
                  onChange={(e) => setAutoSource(e.target.value)}
                  className="h-9 rounded-xl text-xs bg-cinema-elevated border-cinema-border text-foreground px-3"
                >
                  <option value="melolo-popular">Trending</option>
                  <option value="melolo-new">Latest</option>
                  <option value="melolo-home">Home</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground/70 block mb-1">From Page</label>
                <Input
                  type="number" min={1}
                  value={autoPageFrom}
                  onChange={(e) => setAutoPageFrom(Number(e.target.value))}
                  className="h-9 w-20 rounded-xl text-xs bg-cinema-elevated border-cinema-border"
                />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground/70 block mb-1">To Page</label>
                <Input
                  type="number" min={1}
                  value={autoPageTo}
                  onChange={(e) => setAutoPageTo(Number(e.target.value))}
                  className="h-9 w-20 rounded-xl text-xs bg-cinema-elevated border-cinema-border"
                />
              </div>
              <Button
                size="sm"
                onClick={async () => {
                  if (autoPageFrom > autoPageTo) { toast.error("From page must be ≤ To page"); return; }
                  setIsLoading(true);
                  try {
                    const res = await adminFetch("/api/admin/content/auto-import", {
                      method: "POST",
                      body: JSON.stringify({ source: autoSource, pageFrom: autoPageFrom, pageTo: autoPageTo }),
                    });
                    const json = await res.json();
                    if (json.error) { toast.error(json.error); return; }
                    toast.success(`✅ Imported ${json.imported} of ${json.total} dramas`);
                    queryClient.invalidateQueries({ queryKey: ["admin-content-list"] });
                    if (json.results) {
                      const failed = json.results.filter((r: any) => !r.success).length;
                      if (failed > 0) toast.error(`${failed} dramas skipped (already exist)`);
                    }
                  } catch (e) {
                    toast.error(`Failed: ${(e as Error).message}`);
                  } finally { setIsLoading(false); }
                }}
                disabled={isLoading}
                className="bg-cinema-red hover:bg-cinema-red-hover text-white text-xs rounded-xl shadow-lg shadow-cinema-red/20"
              >
                {isLoading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Download className="w-3.5 h-3.5 mr-1.5" />}
                {isLoading ? "Importing..." : "Start Import"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Separator className="bg-cinema-border" />

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant={mode === "popular" ? "default" : "outline"}
              onClick={() => { setMode("popular"); fetchDramas("popular"); }}
              className="rounded-xl text-xs"
            >
              Trending
            </Button>
            <Button
              size="sm"
              variant={mode === "new" ? "default" : "outline"}
              onClick={() => { setMode("new"); fetchDramas("new"); }}
              className="rounded-xl text-xs"
            >
              Latest
            </Button>
            <Button
              size="sm"
              variant={mode === "home" ? "default" : "outline"}
              onClick={() => { setMode("home"); fetchDramas("home"); }}
              className="rounded-xl text-xs"
            >
              Home
            </Button>
          </div>

          <form onSubmit={handleSearch} className="flex gap-2 sm:ml-auto">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dramas..."
              className="h-9 rounded-xl text-sm bg-cinema-elevated border-cinema-border w-56"
            />
            <Button
              type="submit"
              size="sm"
              className="rounded-xl text-xs"
              disabled={!searchQuery.trim() || isLoading}
            >
              <Search className="w-3.5 h-3.5 mr-1" />
              Search
            </Button>
          </form>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="bg-cinema-surface border-cinema-border rounded-2xl animate-pulse">
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <div className="w-20 h-28 bg-cinema-elevated rounded-xl shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 bg-cinema-elevated rounded" />
                      <div className="h-3 w-1/2 bg-cinema-elevated rounded" />
                      <div className="h-3 w-full bg-cinema-elevated rounded" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : results.length === 0 && mode ? (
          <div className="text-center py-16">
            <Film className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Click a tab above to browse Melolo short dramas
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((drama) => (
              <Card
                key={drama.drama_id}
                className="bg-cinema-surface border-cinema-border rounded-2xl hover:shadow-lg hover:shadow-black/20 transition-all overflow-hidden"
              >
                <CardContent className="p-0">
                  <div className="flex">
                    {/* Thumbnail */}
                    <div className="w-[100px] shrink-0 bg-cinema-elevated">
                      {drama.thumb_url ? (
                        <img
                          src={drama.thumb_url}
                          alt={drama.drama_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full min-h-[140px] flex items-center justify-center">
                          <Film className="w-6 h-6 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 p-3 space-y-1.5">
                      <h3 className="text-[13px] font-semibold text-foreground line-clamp-2 leading-tight">
                        {drama.drama_name}
                      </h3>

                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 rounded border-cinema-border">
                          {drama.episode_count} ep
                        </Badge>
                        {drama.watch_value && (
                          <span className="flex items-center gap-0.5">
                            <Play className="w-2.5 h-2.5" />
                            {formatNumber(drama.watch_value)}
                          </span>
                        )}
                        {drama.is_new_book === "1" && (
                          <Badge className="text-[9px] px-1.5 py-0 bg-cinema-red text-white border-none">
                            NEW
                          </Badge>
                        )}
                      </div>

                      <p className="text-[10px] text-muted-foreground/70 line-clamp-2 leading-relaxed">
                        {drama.description}
                      </p>

                      {drama.tags && drama.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {drama.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="text-[9px] text-muted-foreground/50 bg-cinema-elevated px-1.5 py-0.5 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <Button
                        size="sm"
                        onClick={() => handleImport(drama)}
                        disabled={importing === drama.drama_id}
                        className="w-full h-8 rounded-xl bg-cinema-red hover:bg-cinema-red-hover text-white text-[10px] mt-1"
                      >
                        {importing === drama.drama_id ? (
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        ) : (
                          <Download className="w-3 h-3 mr-1" />
                        )}
                        Import
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
