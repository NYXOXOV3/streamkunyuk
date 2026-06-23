"use client";

/**
 * Admin Banner Management Page
 *
 * Allows admins to:
 *   - Create "content" banners (picks from published content)
 *   - Create "custom" banners (upload any image URL + link)
 *   - Reorder, toggle active, edit, delete banners
 *   - Set CTA text and link for each banner
 */

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Image as ImageIcon,
  Film,
  Plus,
  GripVertical,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Loader2,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BannerItem {
  id: string;
  title: string | null;
  subtitle: string | null;
  banner_type: "content" | "custom";
  content_id: string | null;
  custom_image_url: string | null;
  custom_link_url: string | null;
  cta_text: string | null;
  cta_link: string | null;
  sort_order: number;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

interface ContentOption {
  id: string;
  title: string;
  backdrop_url: string | null;
  poster_url: string | null;
  type: string;
}

interface BannerFormData {
  banner_type: "content" | "custom";
  content_id: string;
  custom_image_url: string;
  custom_link_url: string;
  title: string;
  subtitle: string;
  cta_text: string;
  cta_link: string;
  is_active: boolean;
  start_date: string;
  end_date: string;
}

const EMPTY_FORM: BannerFormData = {
  banner_type: "content",
  content_id: "",
  custom_image_url: "",
  custom_link_url: "",
  title: "",
  subtitle: "",
  cta_text: "Learn More",
  cta_link: "",
  is_active: true,
  start_date: "",
  end_date: "",
};

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function BannersPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerItem | null>(null);
  const [form, setForm] = useState<BannerFormData>(EMPTY_FORM);

  // ---- Fetch banners ----
  const {
    data: banners = [],
    isLoading,
    error,
  } = useQuery<BannerItem[]>({
    queryKey: ["admin-banners"],
    queryFn: async () => {
      const res = await fetch("/api/admin/banners");
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      if (json.tableMissing) throw new Error("TABLE_MISSING");
      return (json.data ?? []) as BannerItem[];
    },
    retry: false,
    staleTime: 1000 * 30,
  });

  const isTableMissing =
    !isLoading && error && (error as Error).message === "TABLE_MISSING";

  // ---- Fetch content options for the content selector ----
  const { data: contentOptions = [] } = useQuery<ContentOption[]>({
    queryKey: ["admin-banner-content-options"],
    queryFn: async () => {
      const res = await fetch("/api/admin/content?status=published&limit=100");
      const json = await res.json();
      return (json.data ?? []).map((c: Record<string, unknown>) => ({
        id: c.id,
        title: c.title,
        backdrop_url: c.backdrop_url,
        poster_url: c.poster_url,
        type: c.type,
      })) as ContentOption[];
    },
    staleTime: 1000 * 60 * 5,
  });

  // ---- Save mutation (create or update) ----
  const saveMutation = useMutation({
    mutationFn: async (data: BannerFormData & { id?: string }) => {
      const url = data.id ? "/api/admin/banners" : "/api/admin/banners";
      const method = data.id ? "PATCH" : "POST";
      const body = data.id
        ? { id: data.id, ...data }
        : {
            banner_type: data.banner_type,
            content_id: data.content_id || null,
            custom_image_url: data.custom_image_url || null,
            custom_link_url: data.custom_link_url || null,
            title: data.title || null,
            subtitle: data.subtitle || null,
            cta_text: data.cta_text || "Learn More",
            cta_link: data.cta_link || null,
            is_active: data.is_active,
            start_date: data.start_date || null,
            end_date: data.end_date || null,
          };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
      setDialogOpen(false);
      setEditingBanner(null);
      setForm(EMPTY_FORM);
    },
  });

  // ---- Delete mutation ----
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/banners?id=${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
    },
  });

  // ---- Toggle active ----
  const toggleActive = useCallback(
    (banner: BannerItem) => {
      saveMutation.mutate({
        id: banner.id,
        ...form,
        is_active: !banner.is_active,
      });
    },
    [saveMutation, form],
  );

  // ---- Reorder ----
  const reorder = useCallback(
    (banner: BannerItem, direction: "up" | "down") => {
      const idx = banners.findIndex((b) => b.id === banner.id);
      if (idx < 0) return;
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= banners.length) return;

      const swapBanner = banners[swapIdx];
      // Swap sort_orders
      saveMutation.mutate({
        id: banner.id,
        ...form,
        sort_order: swapBanner.sort_order,
      });
      setTimeout(() => {
        saveMutation.mutate({
          id: swapBanner.id,
          ...form,
          sort_order: banner.sort_order,
        });
      }, 200);
    },
    [banners, saveMutation, form],
  );

  // ---- Dialog handlers ----
  const openCreate = () => {
    setEditingBanner(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (banner: BannerItem) => {
    setEditingBanner(banner);
    setForm({
      banner_type: banner.banner_type,
      content_id: banner.content_id || "",
      custom_image_url: banner.custom_image_url || "",
      custom_link_url: banner.custom_link_url || "",
      title: banner.title || "",
      subtitle: banner.subtitle || "",
      cta_text: banner.cta_text || "Learn More",
      cta_link: banner.cta_link || "",
      is_active: banner.is_active,
      start_date: banner.start_date ? banner.start_date.slice(0, 16) : "",
      end_date: banner.end_date ? banner.end_date.slice(0, 16) : "",
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (form.banner_type === "content" && !form.content_id) return;
    if (form.banner_type === "custom" && !form.custom_image_url) return;
    saveMutation.mutate(
      editingBanner ? { ...form, id: editingBanner.id } : form,
    );
  };

  // ---- Get display info for a banner ----
  const getBannerImage = (b: BannerItem): string | null => {
    if (b.banner_type === "content" && b.content_id) {
      const content = contentOptions.find((c) => c.id === b.content_id);
      return content?.backdrop_url || content?.poster_url || null;
    }
    return b.custom_image_url;
  };

  const getContentTitle = (b: BannerItem): string => {
    if (b.banner_type === "content" && b.content_id) {
      const content = contentOptions.find((c) => c.id === b.content_id);
      return content?.title || "Unknown Content";
    }
    return b.custom_link_url || "Custom Banner";
  };

  // ---- Render ----
  return (
    <>
      <AdminHeader title="Banner Management" />

      <div className="flex-1 p-6 space-y-4 overflow-y-auto">
        {/* Top actions */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Manage homepage hero banners. {banners.length} banner
            {banners.length !== 1 ? "s" : ""} total.
          </p>
          <Button
            onClick={openCreate}
            disabled={isTableMissing}
            className="bg-cinema-red hover:bg-cinema-red-hover text-white gap-1.5 disabled:opacity-40"
          >
            <Plus className="w-4 h-4" />
            Add Banner
          </Button>
        </div>

        {/* Table missing — show setup instructions */}
        {isTableMissing && (
          <Card className="bg-cinema-surface border-amber-500/30">
            <CardContent className="py-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto">
                <ImageIcon className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground mb-1">
                  Banners table not created yet
                </p>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Run the SQL below in your <strong>Supabase SQL Editor</strong> to
                  enable banner management. The file is at{" "}
                  <code className="bg-cinema-bg px-1 rounded text-[11px]">
                    supabase/migrations/00003_create_banners_table.sql
                  </code>
                </p>
              </div>
              <pre className="bg-cinema-bg rounded-md p-3 text-left text-[11px] text-foreground/80 max-w-lg mx-auto overflow-x-auto border border-cinema-border leading-relaxed">
{`CREATE TABLE IF NOT EXISTS public.banners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT, subtitle TEXT,
  banner_type TEXT NOT NULL DEFAULT 'content'
    CHECK (banner_type IN ('content', 'custom')),
  content_id UUID REFERENCES public.contents(id)
    ON DELETE SET NULL,
  custom_image_url TEXT, custom_link_url TEXT,
  cta_text TEXT DEFAULT 'Learn More', cta_link TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  start_date TIMESTAMPTZ, end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active banners"
  ON public.banners FOR SELECT USING (is_active = true);
CREATE POLICY "Admins full access banners"
  ON public.banners FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true));
CREATE INDEX IF NOT EXISTS idx_banners_sort_order
  ON public.banners(sort_order ASC);
CREATE INDEX IF NOT EXISTS idx_banners_active
  ON public.banners(is_active) WHERE is_active = true;`}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Other errors */}
        {error && !isTableMissing && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3 text-sm text-destructive">
            Failed to load banners: {(error as Error).message}
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-24 bg-cinema-elevated rounded-lg animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Banner list */}
        {!isLoading && !error && (
          <div className="space-y-3">
            {banners.length === 0 ? (
              <Card className="bg-cinema-surface border-cinema-border">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <ImageIcon className="w-10 h-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground mb-1">
                    No banners yet
                  </p>
                  <p className="text-xs text-muted-foreground/70">
                    Create a banner to display on the homepage hero section.
                  </p>
                </CardContent>
              </Card>
            ) : (
              banners.map((banner, idx) => {
                const imgUrl = getBannerImage(banner);
                return (
                  <Card
                    key={banner.id}
                    className="bg-cinema-surface border-cinema-border overflow-hidden"
                  >
                    <CardContent className="p-0">
                      <div className="flex items-stretch">
                        {/* Thumbnail */}
                        <div className="w-48 shrink-0 bg-cinema-elevated relative overflow-hidden">
                          {imgUrl ? (
                            <img
                              src={imgUrl}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="w-8 h-8 text-muted-foreground/20" />
                            </div>
                          )}
                          {/* Type badge */}
                          <Badge
                            className="absolute top-2 left-2 text-[10px] border-none gap-0.5"
                            variant={
                              banner.banner_type === "content"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {banner.banner_type === "content" ? (
                              <Film className="w-2.5 h-2.5" />
                            ) : (
                              <ImageIcon className="w-2.5 h-2.5" />
                            )}
                            {banner.banner_type}
                          </Badge>
                          {/* Inactive overlay */}
                          {!banner.is_active && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <span className="text-xs font-medium text-white/70">
                                Inactive
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-sm font-semibold text-foreground truncate">
                                {banner.title || getContentTitle(banner)}
                              </h3>
                              {banner.is_active ? (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] border-emerald-600/50 text-emerald-400 shrink-0"
                                >
                                  Active
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] border-cinema-border text-muted-foreground shrink-0"
                                >
                                  Inactive
                                </Badge>
                              )}
                            </div>
                            {banner.subtitle && (
                              <p className="text-xs text-muted-foreground truncate mb-1">
                                {banner.subtitle}
                              </p>
                            )}
                            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                              <span>
                                Order: {banner.sort_order}
                              </span>
                              {banner.cta_text && (
                                <span>CTA: {banner.cta_text}</span>
                              )}
                              {banner.start_date && (
                                <span>
                                  From:{" "}
                                  {new Date(
                                    banner.start_date,
                                  ).toLocaleDateString()}
                                </span>
                              )}
                              {banner.end_date && (
                                <span>
                                  Until:{" "}
                                  {new Date(
                                    banner.end_date,
                                  ).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1.5 mt-3">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-cinema-border text-xs h-7"
                              onClick={() => toggleActive(banner)}
                            >
                              {banner.is_active ? (
                                <EyeOff className="w-3.5 h-3.5 mr-1" />
                              ) : (
                                <Eye className="w-3.5 h-3.5 mr-1" />
                              )}
                              {banner.is_active ? "Hide" : "Show"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-cinema-border text-xs h-7"
                              onClick={() => openEdit(banner)}
                            >
                              <Pencil className="w-3.5 h-3.5 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-cinema-border text-xs h-7 text-destructive hover:text-destructive"
                              onClick={() => deleteMutation.mutate(banner.id)}
                              disabled={deleteMutation.isPending}
                            >
                              {deleteMutation.isPending ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5 mr-1" />
                              )}
                              Delete
                            </Button>

                            {/* Reorder buttons */}
                            <div className="ml-auto flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0"
                                disabled={idx === 0}
                                onClick={() => reorder(banner, "up")}
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0"
                                disabled={idx === banners.length - 1}
                                onClick={() => reorder(banner, "down")}
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* ---- Create/Edit Dialog ---- */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg bg-cinema-surface border-cinema-border">
          <DialogHeader>
            <DialogTitle>
              {editingBanner ? "Edit Banner" : "Add New Banner"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Banner Type */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Banner Type
              </label>
              <Select
                value={form.banner_type}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    banner_type: v as "content" | "custom",
                  }))
                }
              >
                <SelectTrigger className="bg-cinema-elevated border-cinema-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-cinema-border">
                  <SelectItem value="content">
                    <span className="flex items-center gap-2">
                      <Film className="w-3.5 h-3.5" />
                      From Content
                    </span>
                  </SelectItem>
                  <SelectItem value="custom">
                    <span className="flex items-center gap-2">
                      <ImageIcon className="w-3.5 h-3.5" />
                      Custom Image (Promo)
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Content selector (only for content type) */}
            {form.banner_type === "content" && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Select Content
                </label>
                <Select
                  value={form.content_id}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, content_id: v }))
                  }
                >
                  <SelectTrigger className="bg-cinema-elevated border-cinema-border">
                    <SelectValue placeholder="Choose a published content..." />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-cinema-border max-h-60">
                    {contentOptions.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        <span className="truncate">
                          {c.title}{" "}
                          <span className="text-muted-foreground text-xs capitalize">
                            ({c.type})
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Custom image URL (only for custom type) */}
            {form.banner_type === "custom" && (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Image URL
                  </label>
                  <Input
                    value={form.custom_image_url}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        custom_image_url: e.target.value,
                      }))
                    }
                    placeholder="https://example.com/promo-banner.jpg"
                    className="bg-cinema-elevated border-cinema-border"
                  />
                  {form.custom_image_url && (
                    <div className="mt-2 rounded-md overflow-hidden h-32 bg-cinema-elevated">
                      <img
                        src={form.custom_image_url}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Link URL (optional)
                  </label>
                  <Input
                    value={form.custom_link_url}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        custom_link_url: e.target.value,
                      }))
                    }
                    placeholder="https://example.com/promo"
                    className="bg-cinema-elevated border-cinema-border"
                  />
                </div>
              </>
            )}

            {/* Title & Subtitle */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Title{" "}
                  <span className="text-muted-foreground text-xs">
                    (optional, overrides content title)
                  </span>
                </label>
                <Input
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  placeholder="Banner title"
                  className="bg-cinema-elevated border-cinema-border"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Subtitle
                </label>
                <Input
                  value={form.subtitle}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, subtitle: e.target.value }))
                  }
                  placeholder="Short description"
                  className="bg-cinema-elevated border-cinema-border"
                />
              </div>
            </div>

            {/* CTA Text & Link */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  CTA Button Text
                </label>
                <Input
                  value={form.cta_text}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, cta_text: e.target.value }))
                  }
                  placeholder="Learn More"
                  className="bg-cinema-elevated border-cinema-border"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  CTA Link (optional)
                </label>
                <Input
                  value={form.cta_link}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, cta_link: e.target.value }))
                  }
                  placeholder="/browse?sort=newest"
                  className="bg-cinema-elevated border-cinema-border"
                />
              </div>
            </div>

            {/* Schedule */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Start Date (optional)
                </label>
                <Input
                  type="datetime-local"
                  value={form.start_date}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, start_date: e.target.value }))
                  }
                  className="bg-cinema-elevated border-cinema-border"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  End Date (optional)
                </label>
                <Input
                  type="datetime-local"
                  value={form.end_date}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, end_date: e.target.value }))
                  }
                  className="bg-cinema-elevated border-cinema-border"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="border-cinema-border"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="bg-cinema-red hover:bg-cinema-red-hover text-white"
            >
              {saveMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {editingBanner ? "Update Banner" : "Create Banner"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}