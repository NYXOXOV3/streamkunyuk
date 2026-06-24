"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { adminFetch } from "@/lib/admin/client-helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, Save, Globe, Search, Image, FileImage } from "lucide-react";

// ---------------------------------------------------------------------------
// Default values
// ---------------------------------------------------------------------------

interface SeoSettings {
  site_title: string;
  tagline: string;
  description: string;
  keywords: string;
  og_image: string;
  twitter_handle: string;
  logo_url: string;
  icon_url: string;
}

const DEFAULTS: SeoSettings = {
  site_title: "",
  tagline: "",
  description: "",
  keywords: "",
  og_image: "",
  twitter_handle: "",
  logo_url: "",
  icon_url: "",
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SeoPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<SeoSettings>(DEFAULTS);
  const [hasChanges, setHasChanges] = useState(false);

  // ---- Fetch current settings ----
  const { data, isLoading } = useQuery({
    queryKey: ["admin-seo-settings"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/seo");
      const json = await res.json();
      return (json.data ?? DEFAULTS) as SeoSettings;
    },
    staleTime: 1000 * 60 * 5,
  });

  // Sync form when data loads — intentional, runs once per fetch
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    if (data) {
      setForm(data);
      setHasChanges(false);
    }
  }, [data]);

  // ---- Save mutation ----
  const saveMutation = useMutation({
    mutationFn: async (payload: SeoSettings) => {
      const res = await adminFetch("/api/admin/seo", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-seo-settings"] });
      setHasChanges(false);
      toast.success("SEO settings saved!");
    },
    onError: (e) => toast.error(`Failed: ${e.message}`),
  });

  // ---- Handlers ----
  function updateField<K extends keyof SeoSettings>(key: K, value: SeoSettings[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  }

  function handleSave() {
    saveMutation.mutate(form);
  }

  return (
    <>
      <AdminHeader title="SEO Settings" />

      <div className="flex-1 p-8 space-y-6 overflow-y-auto">
        <p className="text-[13px] text-muted-foreground/70 leading-relaxed max-w-2xl">
          Configure global SEO metadata and branding for your streaming platform.
          These values are used in the HTML <code>&lt;head&gt;</code> and site chrome.
        </p>

        <Separator className="bg-cinema-border" />

        {isLoading ? (
          <div className="space-y-6 max-w-2xl">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-24 bg-cinema-elevated rounded animate-pulse" />
                <div className="h-10 w-full bg-cinema-elevated rounded-xl animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <div className="max-w-2xl space-y-8">
            {/* Site Identity */}
            <Card className="bg-cinema-surface border-cinema-border rounded-2xl">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-cinema-red" />
                  <CardTitle className="text-[15px] font-semibold text-foreground">
                    Site Identity
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-muted-foreground/70">Site Title</Label>
                  <Input
                    value={form.site_title}
                    onChange={(e) => updateField("site_title", e.target.value)}
                    placeholder="StreamVault — Premium Streaming"
                    className="h-10 rounded-xl text-sm bg-cinema-elevated border-cinema-border"
                  />
                  <p className="text-[10px] text-muted-foreground/60">
                    Used as the default browser tab title &amp; OG title.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-muted-foreground/70">Tagline</Label>
                  <Input
                    value={form.tagline}
                    onChange={(e) => updateField("tagline", e.target.value)}
                    placeholder="Movies, Series, Anime &amp; More"
                    className="h-10 rounded-xl text-sm bg-cinema-elevated border-cinema-border"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Branding — Logo & Icon */}
            <Card className="bg-cinema-surface border-cinema-border rounded-2xl">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <FileImage className="w-4 h-4 text-cinema-red" />
                  <CardTitle className="text-[15px] font-semibold text-foreground">
                    Logo &amp; Icon
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-muted-foreground/70">Logo URL</Label>
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <Input
                        value={form.logo_url}
                        onChange={(e) => updateField("logo_url", e.target.value)}
                        placeholder="https://example.com/logo.svg"
                        className="h-10 rounded-xl text-sm bg-cinema-elevated border-cinema-border"
                      />
                      <p className="text-[10px] text-muted-foreground/60 mt-1">
                        Site logo shown in navbar. SVG or PNG recommended.
                      </p>
                    </div>
                    {form.logo_url && (
                      <div className="w-14 h-14 rounded-xl bg-cinema-elevated border border-cinema-border overflow-hidden flex items-center justify-center shrink-0">
                        <img
                          src={form.logo_url}
                          alt="Logo preview"
                          className="max-w-full max-h-full object-contain"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-muted-foreground/70">Favicon / Icon URL</Label>
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <Input
                        value={form.icon_url}
                        onChange={(e) => updateField("icon_url", e.target.value)}
                        placeholder="https://example.com/favicon.ico"
                        className="h-10 rounded-xl text-sm bg-cinema-elevated border-cinema-border"
                      />
                      <p className="text-[10px] text-muted-foreground/60 mt-1">
                        Browser tab icon. ICO, PNG (32x32), or SVG recommended.
                      </p>
                    </div>
                    {form.icon_url && (
                      <div className="w-10 h-10 rounded-lg bg-cinema-elevated border border-cinema-border overflow-hidden flex items-center justify-center shrink-0">
                        <img
                          src={form.icon_url}
                          alt="Icon preview"
                          className="w-6 h-6 object-contain"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Search & Meta */}
            <Card className="bg-cinema-surface border-cinema-border rounded-2xl">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-cinema-red" />
                  <CardTitle className="text-[15px] font-semibold text-foreground">
                    Search &amp; Description
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-muted-foreground/70">
                    Meta Description
                  </Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    placeholder="Describe your streaming platform..."
                    className="h-24 rounded-xl text-sm bg-cinema-elevated border-cinema-border resize-none"
                  />
                  <p className="text-[10px] text-muted-foreground/60">
                    Shown in search results. Max ~160 characters.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-muted-foreground/70">
                    Keywords
                  </Label>
                  <Input
                    value={form.keywords}
                    onChange={(e) => updateField("keywords", e.target.value)}
                    placeholder="streaming, movies, series, anime..."
                    className="h-10 rounded-xl text-sm bg-cinema-elevated border-cinema-border"
                  />
                  <p className="text-[10px] text-muted-foreground/60">
                    Comma-separated keywords for search engines.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Social / Open Graph */}
            <Card className="bg-cinema-surface border-cinema-border rounded-2xl">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Image className="w-4 h-4 text-cinema-red" />
                  <CardTitle className="text-[15px] font-semibold text-foreground">
                    Social Sharing (Open Graph)
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-muted-foreground/70">
                    OG Image URL
                  </Label>
                  <Input
                    value={form.og_image}
                    onChange={(e) => updateField("og_image", e.target.value)}
                    placeholder="https://example.com/og-image.jpg"
                    className="h-10 rounded-xl text-sm bg-cinema-elevated border-cinema-border"
                  />
                  <p className="text-[10px] text-muted-foreground/60">
                    Image shown when sharing links on social media. 1200x630px recommended.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-muted-foreground/70">
                    Twitter Handle
                  </Label>
                  <Input
                    value={form.twitter_handle}
                    onChange={(e) => updateField("twitter_handle", e.target.value)}
                    placeholder="@streamvault"
                    className="h-10 rounded-xl text-sm bg-cinema-elevated border-cinema-border"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Save */}
            <div className="flex items-center gap-3">
              <Button
                onClick={handleSave}
                disabled={saveMutation.isPending || !hasChanges}
                className="h-10 rounded-xl bg-cinema-red hover:bg-cinema-red-hover text-white shadow-lg shadow-cinema-red/20 text-xs"
              >
                {saveMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                )}
                Save Changes
              </Button>
              {!hasChanges && data && (
                <span className="text-[11px] text-muted-foreground/60">
                  No changes to save
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
