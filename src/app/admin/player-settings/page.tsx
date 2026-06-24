"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { adminFetch } from "@/lib/admin/client-helpers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, Play, Radio } from "lucide-react";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProviderInfo {
  id: string;
  provider_name: string;
  base_url: string | null;
  is_active: boolean;
  display_name: string;
  description: string | null;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function PlayerSettingsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["player-providers"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/player-provider");
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json as {
        providers: ProviderInfo[];
        activeProvider: string;
      };
    },
    staleTime: 1000 * 30,
  });

  const activateMutation = useMutation({
    mutationFn: async (providerName: string) => {
      const res = await adminFetch("/api/admin/player-provider", {
        method: "POST",
        body: JSON.stringify({ provider: providerName }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to activate");
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["player-providers"] });
      toast.success("Player provider updated");
    },
    onError: (e) => toast.error(`Failed: ${e.message}`),
  });

  return (
    <>
      <AdminHeader title="Player Settings" />

      <div className="flex-1 p-8 space-y-6 overflow-y-auto">
        <p className="text-[13px] text-muted-foreground/70 leading-relaxed max-w-2xl">
          Choose the video player provider for streaming content. The active
          provider is used for all content playback on the site. Changing the
          provider takes effect immediately — no re-import needed.
        </p>

        {/* Provider Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl">
          {isLoading
            ? [...Array(2)].map((_, i) => (
                <Card
                  key={i}
                  className="bg-cinema-surface border-cinema-border rounded-2xl"
                >
                  <CardContent className="p-6 space-y-3">
                    <div className="h-5 w-32 bg-cinema-elevated rounded-lg animate-pulse" />
                    <div className="h-3 w-full bg-cinema-elevated rounded-lg animate-pulse" />
                    <div className="h-3 w-3/4 bg-cinema-elevated rounded-lg animate-pulse" />
                    <div className="h-9 w-24 bg-cinema-elevated rounded-xl animate-pulse mt-2" />
                  </CardContent>
                </Card>
              ))
            : (data?.providers ?? []).map((provider) => (
                <Card
                  key={provider.provider_name}
                  className={`bg-cinema-surface rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-black/20 ${
                    provider.is_active
                      ? "border-cinema-red/50 ring-1 ring-cinema-red/20"
                      : "border-cinema-border"
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            provider.is_active
                              ? "bg-cinema-red shadow-md shadow-cinema-red/20"
                              : "bg-cinema-elevated"
                          }`}
                        >
                          <Play
                            className={`w-4 h-4 ${provider.is_active ? "text-white" : "text-muted-foreground"}`}
                          />
                        </div>
                        <CardTitle className="text-[15px] font-semibold text-foreground">
                          {provider.display_name}
                        </CardTitle>
                      </div>
                      {provider.is_active && (
                        <Badge className="rounded-lg bg-cinema-red/15 text-cinema-red border-cinema-red/30 text-[10px] gap-1">
                          <Check className="w-3 h-3" />
                          Active
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <p className="text-[13px] text-muted-foreground leading-relaxed">
                      {provider.description}
                    </p>

                    {provider.base_url && (
                      <div className="text-[11px] text-muted-foreground/60 font-mono bg-cinema-elevated rounded-lg px-3 py-1.5">
                        {provider.base_url}
                      </div>
                    )}

                    <Button
                      size="sm"
                      disabled={provider.is_active || activateMutation.isPending}
                      onClick={() =>
                        activateMutation.mutate(provider.provider_name)
                      }
                      className={`rounded-xl text-xs ${
                        provider.is_active
                          ? "bg-cinema-elevated text-muted-foreground cursor-default"
                          : "bg-cinema-red hover:bg-cinema-red-hover text-white shadow-lg shadow-cinema-red/20"
                      }`}
                    >
                      {activateMutation.isPending &&
                      activateMutation.variables === provider.provider_name ? (
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      ) : provider.is_active ? (
                        <Check className="w-3.5 h-3.5 mr-1.5" />
                      ) : (
                        <Radio className="w-3.5 h-3.5 mr-1.5" />
                      )}
                      {provider.is_active ? "Currently Active" : "Activate"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
        </div>
      </div>
    </>
  );
}