"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { updateContent } from "@/lib/admin/content-actions";
import type { ContentType, ContentStatus } from "@/lib/supabase/types";
import {
  Plus,
  Search,
  Download,
  Eye,
  Lock,
  Unlock,
  ListVideo,
  Loader2,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Mock data fallback (when Supabase is not connected)
// ---------------------------------------------------------------------------

const MOCK_CONTENT = [
  { id: "1", title: "Attack on Titan", type: "anime" as ContentType, status: "published" as ContentStatus, is_premium_only: false, rating: 9.0, created_at: "2024-01-15" },
  { id: "2", title: "The Last Kingdom", type: "series" as ContentType, status: "published" as ContentStatus, is_premium_only: true, rating: 8.2, created_at: "2024-02-20" },
  { id: "3", title: "Sword Art Online", type: "anime" as ContentType, status: "draft" as ContentStatus, is_premium_only: false, rating: 7.5, created_at: "2024-03-10" },
  { id: "4", title: "The Grandmaster", type: "movie" as ContentType, status: "published" as ContentStatus, is_premium_only: false, rating: 7.8, created_at: "2024-04-05" },
  { id: "5", title: "CEO's Secret Wife", type: "microdrama" as ContentType, status: "published" as ContentStatus, is_premium_only: true, rating: 6.5, created_at: "2024-05-12" },
];

const TYPE_COLORS: Record<ContentType, string> = {
  movie: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  series: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  anime: "bg-pink-500/20 text-pink-300 border-pink-500/30",
  donghua: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  microdrama: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
};

export default function ContentListPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isTogglingLock, startToggleTransition] = useTransition();
  const [data, setData] = useState(MOCK_CONTENT);
  const [isLoading] = useState(false);

  // Filter client-side (in production, this would be a React Query fetch)
  const filtered = data.filter((item) => {
    if (search && !item.title.toLowerCase().includes(search.toLowerCase()))
      return false;
    if (typeFilter !== "all" && item.type !== typeFilter) return false;
    if (statusFilter !== "all" && item.status !== statusFilter) return false;
    return true;
  });

  async function togglePremiumLock(
    contentId: string,
    current: boolean,
  ) {
    startToggleTransition(async () => {
      // In production: await updateContent(contentId, { is_premium_only: !current });
      setData((prev) =>
        prev.map((c) =>
          c.id === contentId ? { ...c, is_premium_only: !current } : c,
        ),
      );
      toast({
        title: current ? "Unlocked" : "Locked",
        description: current
          ? "Content is now free for all users"
          : "Content is now subscriber-only",
      });
    });
  }

  return (
    <>
      <AdminHeader title="Content Management" />

      <div className="flex-1 p-6 space-y-4 overflow-y-auto">
        {/* Actions bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search content..."
                className="h-9 pl-9 w-56 bg-cinema-elevated border-cinema-border text-sm"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-9 w-36 bg-cinema-elevated border-cinema-border text-sm">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent className="bg-cinema-surface border-cinema-border">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="movie">Movie</SelectItem>
                <SelectItem value="series">Series</SelectItem>
                <SelectItem value="anime">Anime</SelectItem>
                <SelectItem value="donghua">Donghua</SelectItem>
                <SelectItem value="microdrama">Micro-Drama</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-32 bg-cinema-elevated border-cinema-border text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-cinema-surface border-cinema-border">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="outline" className="border-cinema-border text-xs">
              <Link href="/admin/content/tmdb-import">
                <Download className="w-3.5 h-3.5 mr-1.5" />
                TMDB Import
              </Link>
            </Button>
            <Button asChild size="sm" className="bg-cinema-red hover:bg-cinema-red-hover text-white text-xs">
              <Link href="/admin/content/new">
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Add Content
              </Link>
            </Button>
          </div>
        </div>

        {/* Table */}
        <Card className="bg-cinema-surface border-cinema-border">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-cinema-border hover:bg-transparent">
                  <TableHead className="text-xs text-muted-foreground">Title</TableHead>
                  <TableHead className="text-xs text-muted-foreground w-24">Type</TableHead>
                  <TableHead className="text-xs text-muted-foreground w-24">Status</TableHead>
                  <TableHead className="text-xs text-muted-foreground w-20 text-center">Rating</TableHead>
                  <TableHead className="text-xs text-muted-foreground w-28 text-center">Access</TableHead>
                  <TableHead className="text-xs text-muted-foreground w-28 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i} className="border-cinema-border">
                      <TableCell>
                        <Skeleton className="h-4 w-48" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-8 mx-auto" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-20 mx-auto" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-20 ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filtered.length === 0 ? (
                  <TableRow className="border-cinema-border">
                    <TableCell colSpan={6} className="text-center py-12">
                      <p className="text-sm text-muted-foreground">
                        No content found
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((item) => (
                    <TableRow
                      key={item.id}
                      className="border-cinema-border hover:bg-accent/50"
                    >
                      <TableCell>
                        <p className="text-sm font-medium text-foreground">
                          {item.title}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[10px] capitalize ${TYPE_COLORS[item.type]}`}
                        >
                          {item.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            item.status === "published"
                              ? "border-emerald-600/50 text-emerald-400"
                              : "border-cinema-border text-muted-foreground"
                          }`}
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center text-sm text-foreground">
                        {item.rating}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            togglePremiumLock(item.id, item.is_premium_only)
                          }
                          disabled={isTogglingLock}
                          className={`h-7 text-xs ${
                            item.is_premium_only
                              ? "text-cinema-gold hover:text-cinema-gold/80"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {isTogglingLock ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : item.is_premium_only ? (
                            <Lock className="w-3.5 h-3.5" />
                          ) : (
                            <Unlock className="w-3.5 h-3.5" />
                          )}
                          <span className="ml-1">
                            {item.is_premium_only ? "Locked" : "Open"}
                          </span>
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                          className="border-cinema-border text-xs h-7"
                        >
                          <Link href={`/admin/content/${item.id}/episodes`}>
                            <ListVideo className="w-3.5 h-3.5 mr-1" />
                            Episodes
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}