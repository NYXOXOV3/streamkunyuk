"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, ListVideo } from "lucide-react";
import Link from "next/link";
import type { Content } from "@/lib/supabase/types";

async function apiUpdateContent(id: string, formData: Record<string, unknown>) {
  const res = await fetch(`/api/admin/content/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData),
  });
  return res.json();
}

export default function EditContentPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { toast } = useToast();
  const [isSubmitting, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);

  const [form, setForm] = useState({
    title: "",
    original_title: "",
    synopsis: "",
    type: "anime" as string,
    release_year: "",
    runtime_minutes: "",
    poster_url: "",
    backdrop_url: "",
    trailer_url: "",
    language: "id",
    country_of_origin: "",
    status: "draft" as string,
    is_premium_only: false,
    free_trial_episodes: "2",
  });

  useEffect(() => {
    async function fetchContent() {
      try {
        const res = await fetch(`/api/admin/content/${params.id}`);
        const json = await res.json();
        if (json.error) {
          toast({ title: "Failed to load", description: json.error, variant: "destructive" });
          router.push("/admin/content");
          return;
        }
        const data: Content = json.data;
        setForm({
          title: data.title ?? "",
          original_title: data.original_title ?? "",
          synopsis: data.synopsis ?? "",
          type: data.type ?? "anime",
          release_year: data.release_year ? String(data.release_year) : "",
          runtime_minutes: data.runtime_minutes ? String(data.runtime_minutes) : "",
          poster_url: data.poster_url ?? "",
          backdrop_url: data.backdrop_url ?? "",
          trailer_url: data.trailer_url ?? "",
          language: data.language ?? "id",
          country_of_origin: data.country_of_origin ?? "",
          status: data.status ?? "draft",
          is_premium_only: data.is_premium_only ?? false,
          free_trial_episodes: String(data.free_trial_episodes ?? 0),
        });
      } catch {
        toast({ title: "Error", description: "Failed to load content.", variant: "destructive" });
        router.push("/admin/content");
      } finally {
        setIsLoading(false);
      }
    }
    fetchContent();
  }, [params.id, router, toast]);

  function updateField(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await apiUpdateContent(params.id, {
        title: form.title,
        original_title: form.original_title || null,
        synopsis: form.synopsis || null,
        type: form.type,
        release_year: form.release_year ? parseInt(form.release_year) : null,
        runtime_minutes: form.runtime_minutes ? parseInt(form.runtime_minutes) : null,
        poster_url: form.poster_url || null,
        backdrop_url: form.backdrop_url || null,
        trailer_url: form.trailer_url || null,
        language: form.language,
        country_of_origin: form.country_of_origin || null,
        status: form.status,
        is_premium_only: form.is_premium_only,
        free_trial_episodes: parseInt(form.free_trial_episodes) || 0,
      });

      if (result.success) {
        toast({
          title: "Content updated!",
          description: `"${form.title}" has been saved.`,
        });
      } else {
        toast({
          title: "Failed to update",
          description: result.error ?? "Unknown error",
          variant: "destructive",
        });
      }
    });
  }

  if (isLoading) {
    return (
      <>
        <AdminHeader title="Edit Content" />
        <div className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-2xl space-y-6">
            <Skeleton className="h-8 w-32 mb-4 rounded-lg" />
            <Card className="bg-cinema-surface border-cinema-border rounded-2xl">
              <CardHeader><Skeleton className="h-5 w-40 rounded-lg" /></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Skeleton className="h-20 w-full rounded-lg" />
                  <Skeleton className="h-20 w-full rounded-lg" />
                </div>
                <Skeleton className="h-24 w-full rounded-lg" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Skeleton className="h-20 w-full rounded-lg" />
                  <Skeleton className="h-20 w-full rounded-lg" />
                  <Skeleton className="h-20 w-full rounded-lg" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AdminHeader title="Edit Content" />

      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-2xl">
          <Button asChild variant="ghost" size="sm" className="text-muted-foreground mb-4 rounded-xl">
            <Link href="/admin/content">
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Back to Content
            </Link>
          </Button>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <Card className="bg-cinema-surface border-cinema-border rounded-2xl">
              <CardHeader>
                <CardTitle className="text-[15px] font-semibold text-foreground">
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-muted-foreground/70 uppercase tracking-[0.05em]">Title *</Label>
                    <Input
                      required
                      value={form.title}
                      onChange={(e) => updateField("title", e.target.value)}
                      placeholder="e.g. Jujutsu Kaisen"
                      className="h-10 rounded-xl text-sm bg-cinema-elevated border-cinema-border"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-muted-foreground/70 uppercase tracking-[0.05em]">Original Title</Label>
                    <Input
                      value={form.original_title}
                      onChange={(e) => updateField("original_title", e.target.value)}
                      placeholder="e.g. 呪術廻戦"
                      className="h-10 rounded-xl text-sm bg-cinema-elevated border-cinema-border"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] text-muted-foreground/70 uppercase tracking-[0.05em]">Synopsis</Label>
                  <Textarea
                    value={form.synopsis}
                    onChange={(e) => updateField("synopsis", e.target.value)}
                    placeholder="Brief description of the content..."
                    rows={4}
                    className="rounded-xl text-sm bg-cinema-elevated border-cinema-border resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-muted-foreground/70 uppercase tracking-[0.05em]">Type *</Label>
                    <Select value={form.type} onValueChange={(v) => updateField("type", v)}>
                      <SelectTrigger className="h-10 rounded-xl bg-cinema-elevated border-cinema-border text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-cinema-surface border-cinema-border">
                        <SelectItem value="anime">Anime</SelectItem>
                        <SelectItem value="donghua">Donghua</SelectItem>
                        <SelectItem value="movie">Movie</SelectItem>
                        <SelectItem value="series">Series</SelectItem>
                        <SelectItem value="microdrama">Micro-Drama</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-muted-foreground/70 uppercase tracking-[0.05em]">Release Year</Label>
                    <Input
                      type="number"
                      value={form.release_year}
                      onChange={(e) => updateField("release_year", e.target.value)}
                      placeholder="2024"
                      className="h-10 rounded-xl text-sm bg-cinema-elevated border-cinema-border"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-muted-foreground/70 uppercase tracking-[0.05em]">Runtime (min)</Label>
                    <Input
                      type="number"
                      value={form.runtime_minutes}
                      onChange={(e) => updateField("runtime_minutes", e.target.value)}
                      placeholder="24"
                      className="h-10 rounded-xl text-sm bg-cinema-elevated border-cinema-border"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-muted-foreground/70 uppercase tracking-[0.05em]">Language</Label>
                    <Select value={form.language} onValueChange={(v) => updateField("language", v)}>
                      <SelectTrigger className="h-10 rounded-xl bg-cinema-elevated border-cinema-border text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-cinema-surface border-cinema-border">
                        <SelectItem value="id">Indonesian</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="ja">Japanese</SelectItem>
                        <SelectItem value="zh">Chinese</SelectItem>
                        <SelectItem value="ko">Korean</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-muted-foreground/70 uppercase tracking-[0.05em]">Country</Label>
                    <Select value={form.country_of_origin} onValueChange={(v) => updateField("country_of_origin", v)}>
                      <SelectTrigger className="h-10 rounded-xl bg-cinema-elevated border-cinema-border text-sm">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent className="bg-cinema-surface border-cinema-border">
                        <SelectItem value="ID">Indonesia</SelectItem>
                        <SelectItem value="JP">Japan</SelectItem>
                        <SelectItem value="CN">China</SelectItem>
                        <SelectItem value="KR">South Korea</SelectItem>
                        <SelectItem value="US">United States</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Media URLs */}
            <Card className="bg-cinema-surface border-cinema-border rounded-2xl">
              <CardHeader>
                <CardTitle className="text-[15px] font-semibold text-foreground">
                  Media URLs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-muted-foreground/70 uppercase tracking-[0.05em]">Poster URL</Label>
                  <Input
                    value={form.poster_url}
                    onChange={(e) => updateField("poster_url", e.target.value)}
                    placeholder="https://example.com/poster.jpg"
                    className="h-10 rounded-xl text-sm bg-cinema-elevated border-cinema-border"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-muted-foreground/70 uppercase tracking-[0.05em]">Backdrop URL</Label>
                  <Input
                    value={form.backdrop_url}
                    onChange={(e) => updateField("backdrop_url", e.target.value)}
                    placeholder="https://example.com/backdrop.jpg"
                    className="h-10 rounded-xl text-sm bg-cinema-elevated border-cinema-border"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-muted-foreground/70 uppercase tracking-[0.05em]">Trailer URL</Label>
                  <Input
                    value={form.trailer_url}
                    onChange={(e) => updateField("trailer_url", e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="h-10 rounded-xl text-sm bg-cinema-elevated border-cinema-border"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Access Control */}
            <Card className="bg-cinema-surface border-cinema-border rounded-2xl">
              <CardHeader>
                <CardTitle className="text-[15px] font-semibold text-foreground">
                  Access Control
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-foreground">Premium Only</p>
                    <p className="text-xs text-muted-foreground">
                      Lock entire content behind subscription
                    </p>
                  </div>
                  <Switch
                    checked={form.is_premium_only}
                    onCheckedChange={(v) => updateField("is_premium_only", v)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-muted-foreground/70 uppercase tracking-[0.05em]">Free Trial Episodes</Label>
                    <Input
                      type="number"
                      value={form.free_trial_episodes}
                      onChange={(e) => updateField("free_trial_episodes", e.target.value)}
                      className="h-10 rounded-xl text-sm bg-cinema-elevated border-cinema-border"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-muted-foreground/70 uppercase tracking-[0.05em]">Status</Label>
                    <Select value={form.status} onValueChange={(v) => updateField("status", v)}>
                      <SelectTrigger className="h-10 rounded-xl bg-cinema-elevated border-cinema-border text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-cinema-surface border-cinema-border">
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex items-center gap-3 pb-8">
              <Button
                type="submit"
                disabled={isSubmitting || !form.title.trim()}
                className="bg-cinema-red hover:bg-cinema-red-hover text-white rounded-xl shadow-lg shadow-cinema-red/20"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
              <Button asChild size="sm" variant="outline" className="border-cinema-border text-xs rounded-xl">
                <Link href={`/admin/content/${params.id}/episodes`}>
                  <ListVideo className="w-3.5 h-3.5 mr-1.5" />
                  Manage Episodes
                </Link>
              </Button>
              <Button type="button" variant="outline" asChild className="border-cinema-border rounded-xl">
                <Link href="/admin/content">Cancel</Link>
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}