"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { useToast } from "@/hooks/use-toast";
import { createContent } from "@/lib/admin/content-actions";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewContentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, startTransition] = useTransition();

  const [form, setForm] = useState({
    title: "",
    original_title: "",
    synopsis: "",
    type: "anime" as "anime" | "donghua",
    release_year: "",
    runtime_minutes: "",
    poster_url: "",
    backdrop_url: "",
    trailer_url: "",
    language: "id",
    country_of_origin: "",
    status: "draft" as "draft" | "published",
    is_premium_only: false,
    free_trial_episodes: "2",
  });

  function updateField(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await createContent({
        ...form,
        release_year: form.release_year ? parseInt(form.release_year) : undefined,
        runtime_minutes: form.runtime_minutes ? parseInt(form.runtime_minutes) : undefined,
        free_trial_episodes: parseInt(form.free_trial_episodes) || 0,
        poster_url: form.poster_url || undefined,
        backdrop_url: form.backdrop_url || undefined,
        trailer_url: form.trailer_url || undefined,
        country_of_origin: form.country_of_origin || undefined,
      });

      if (result.success) {
        toast({
          title: "Content created!",
          description: `"${form.title}" saved as ${form.status}.`,
        });
        router.push("/admin/content");
        router.refresh();
      } else {
        toast({
          title: "Failed to create",
          description: result.error ?? "Unknown error",
          variant: "destructive",
        });
      }
    });
  }

  return (
    <>
      <AdminHeader title="Add Content (Manual)" />

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-2xl">
          <Button asChild variant="ghost" size="sm" className="text-muted-foreground mb-4">
            <Link href="/admin/content">
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Back to Content
            </Link>
          </Button>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <Card className="bg-cinema-surface border-cinema-border">
              <CardHeader>
                <CardTitle className="text-base text-foreground">
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Title *</Label>
                    <Input
                      required
                      value={form.title}
                      onChange={(e) => updateField("title", e.target.value)}
                      placeholder="e.g. Jujutsu Kaisen"
                      className="h-9 text-sm bg-cinema-elevated border-cinema-border"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Original Title</Label>
                    <Input
                      value={form.original_title}
                      onChange={(e) => updateField("original_title", e.target.value)}
                      placeholder="e.g. 呪術廻戦"
                      className="h-9 text-sm bg-cinema-elevated border-cinema-border"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Synopsis</Label>
                  <Textarea
                    value={form.synopsis}
                    onChange={(e) => updateField("synopsis", e.target.value)}
                    placeholder="Brief description of the content..."
                    rows={4}
                    className="text-sm bg-cinema-elevated border-cinema-border resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Type *</Label>
                    <Select value={form.type} onValueChange={(v) => updateField("type", v)}>
                      <SelectTrigger className="h-9 bg-cinema-elevated border-cinema-border text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-cinema-surface border-cinema-border">
                        <SelectItem value="anime">Anime</SelectItem>
                        <SelectItem value="donghua">Donghua</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Release Year</Label>
                    <Input
                      type="number"
                      value={form.release_year}
                      onChange={(e) => updateField("release_year", e.target.value)}
                      placeholder="2024"
                      className="h-9 text-sm bg-cinema-elevated border-cinema-border"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Runtime (min)</Label>
                    <Input
                      type="number"
                      value={form.runtime_minutes}
                      onChange={(e) => updateField("runtime_minutes", e.target.value)}
                      placeholder="24"
                      className="h-9 text-sm bg-cinema-elevated border-cinema-border"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Language</Label>
                    <Select value={form.language} onValueChange={(v) => updateField("language", v)}>
                      <SelectTrigger className="h-9 bg-cinema-elevated border-cinema-border text-sm">
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
                    <Label className="text-xs">Country</Label>
                    <Select value={form.country_of_origin} onValueChange={(v) => updateField("country_of_origin", v)}>
                      <SelectTrigger className="h-9 bg-cinema-elevated border-cinema-border text-sm">
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
            <Card className="bg-cinema-surface border-cinema-border">
              <CardHeader>
                <CardTitle className="text-base text-foreground">
                  Media URLs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Poster URL</Label>
                  <Input
                    value={form.poster_url}
                    onChange={(e) => updateField("poster_url", e.target.value)}
                    placeholder="https://example.com/poster.jpg"
                    className="h-9 text-sm bg-cinema-elevated border-cinema-border"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Backdrop URL</Label>
                  <Input
                    value={form.backdrop_url}
                    onChange={(e) => updateField("backdrop_url", e.target.value)}
                    placeholder="https://example.com/backdrop.jpg"
                    className="h-9 text-sm bg-cinema-elevated border-cinema-border"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Trailer URL</Label>
                  <Input
                    value={form.trailer_url}
                    onChange={(e) => updateField("trailer_url", e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="h-9 text-sm bg-cinema-elevated border-cinema-border"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Access Control */}
            <Card className="bg-cinema-surface border-cinema-border">
              <CardHeader>
                <CardTitle className="text-base text-foreground">
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
                    <Label className="text-xs">Free Trial Episodes</Label>
                    <Input
                      type="number"
                      value={form.free_trial_episodes}
                      onChange={(e) => updateField("free_trial_episodes", e.target.value)}
                      className="h-9 text-sm bg-cinema-elevated border-cinema-border"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Status</Label>
                    <Select value={form.status} onValueChange={(v) => updateField("status", v)}>
                      <SelectTrigger className="h-9 bg-cinema-elevated border-cinema-border text-sm">
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
                className="bg-cinema-red hover:bg-cinema-red-hover text-white"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Content
              </Button>
              <Button type="button" variant="outline" asChild className="border-cinema-border">
                <Link href="/admin/content">Cancel</Link>
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}