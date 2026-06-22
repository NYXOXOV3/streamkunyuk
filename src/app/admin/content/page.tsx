"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
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
import { createClient } from "@/lib/supabase/client";
import type { Content, ContentType } from "@/lib/supabase/types";
import {
  Plus,
  Search,
  Download,
  Lock,
  Unlock,
  ListVideo,
  Loader2,
} from "lucide-react";

const TYPE_COLORS: Record<ContentType, string> = {
  movie: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  series: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  anime: "bg-pink-500/20 text-pink-300 border-pink-500/30",
  donghua: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  microdrama: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
};

export default function ContentListPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: contents = [], isLoading, error } = useQuery({
    queryKey: ["admin-content-list", typeFilter, statusFilter, search],
    queryFn: async () => {
      const supabase = createClient();
      let query = supabase
        .from("contents")
        .select("*")
        .order("created_at", { ascending: false });

      if (typeFilter !== "all") query = query.eq("type", typeFilter);
      if (statusFilter !== "all") query = query.eq("status", statusFilter);
      if (search) query = query.ilike("title", `%${search}%`);

      const { data, error: err } = await query;
      if (err) throw err;
      return (data ?? []) as Content[];
    },
    staleTime: 1000 * 60 * 2,
  });

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

        {/* Error state */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3 text-sm text-destructive">
            Failed to load content: {(error as Error).message}
          </div>
        )}

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
                      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-20 mx-auto" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : contents.length === 0 ? (
                  <TableRow className="border-cinema-border">
                    <TableCell colSpan={6} className="text-center py-12">
                      <p className="text-sm text-muted-foreground">No content found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  contents.map((item) => (
                    <TableRow key={item.id} className="border-cinema-border hover:bg-accent/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {item.poster_url && (
                            <img
                              src={item.poster_url}
                              alt=""
                              className="w-8 h-12 object-cover rounded-sm bg-cinema-elevated"
                            />
                          )}
                          <p className="text-sm font-medium text-foreground truncate max-w-[200px]">
                            {item.title}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] capitalize ${TYPE_COLORS[item.type]}`}>
                          {item.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] ${
                          item.status === "published"
                            ? "border-emerald-600/50 text-emerald-400"
                            : "border-cinema-border text-muted-foreground"
                        }`}>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center text-sm text-foreground">
                        {item.rating}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`inline-flex items-center gap-1 text-xs ${
                          item.is_premium_only
                            ? "text-cinema-gold"
                            : "text-muted-foreground"
                        }`}>
                          {item.is_premium_only ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                          {item.is_premium_only ? "Premium" : "Free"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild size="sm" variant="outline" className="border-cinema-border text-xs h-7">
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

        {/* Count */}
        {!isLoading && (
          <p className="text-xs text-muted-foreground text-right">
            {contents.length} item{contents.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>
    </>
  );
}