/**
 * Player Provider — DB-backed Settings
 *
 * Stores the active video player provider in the `site_settings` table
 * as a key-value pair: key = "active_player_provider", value = "2embed" | "vidapi"
 *
 * Also manages the list of available providers stored in `api_providers`
 * with provider_type = "video_source".
 */

import { createAdminClient } from "@/lib/supabase/admin";
import type { VideoPlayerProvider } from "@/lib/api/tmdb";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PlayerProviderInfo {
  id: string;
  provider_name: string;
  base_url: string | null;
  is_active: boolean;
  display_name: string;
  description: string | null;
}

// ---------------------------------------------------------------------------
// Get active player provider
// ---------------------------------------------------------------------------

/**
 * Returns the currently active player provider ID.
 * Falls back to "2embed" if nothing is configured.
 */
export async function getActivePlayerProvider(): Promise<{
  provider: VideoPlayerProvider;
  error: string | null;
}> {
  try {
    const supabase = await createAdminClient();

    // Check site_settings first
    const { data: setting } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "active_player_provider")
      .single();

    if (setting?.value) {
      const valid: VideoPlayerProvider[] = ["2embed", "vidapi"];
      if (valid.includes(setting.value as VideoPlayerProvider)) {
        return { provider: setting.value as VideoPlayerProvider, error: null };
      }
    }

    // Fallback: check api_providers for active video_source
    const { data: activeProvider } = await supabase
      .from("api_providers")
      .select("provider_name")
      .eq("provider_type", "video_source")
      .eq("is_active", true)
      .limit(1)
      .single();

    if (activeProvider?.provider_name) {
      const valid: VideoPlayerProvider[] = ["2embed", "vidapi"];
      if (valid.includes(activeProvider.provider_name as VideoPlayerProvider)) {
        return { provider: activeProvider.provider_name as VideoPlayerProvider, error: null };
      }
    }

    // Default to 2embed
    return { provider: "2embed", error: null };
  } catch {
    // If site_settings table doesn't exist or any error, default to 2embed
    return { provider: "2embed", error: null };
  }
}

// ---------------------------------------------------------------------------
// Set active player provider
// ---------------------------------------------------------------------------

export async function setActivePlayerProvider(
  provider: VideoPlayerProvider,
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createAdminClient();

    // Try upsert into site_settings
    // If the table doesn't exist, fall back to api_providers
    const { error } = await supabase
      .from("site_settings")
      .upsert(
        { key: "active_player_provider", value: provider },
        { onConflict: "key" },
      );

    if (error) {
      // site_settings might not exist — use api_providers as fallback
      // Deactivate all video_source providers, then activate the selected one
      await supabase
        .from("api_providers")
        .update({ is_active: false })
        .eq("provider_type", "video_source");

      // Ensure the provider exists in api_providers
      const providerInfo = PROVIDER_REGISTRY[provider];
      await supabase
        .from("api_providers")
        .upsert(
          {
            provider_name: provider,
            provider_type: "video_source",
            base_url: providerInfo.baseUrl,
            description: providerInfo.description,
            is_active: true,
          },
          { onConflict: "provider_name" },
        );
    }

    return { success: true, error: null };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

// ---------------------------------------------------------------------------
// Get all player providers (for admin UI)
// ---------------------------------------------------------------------------

export async function getPlayerProviders(): Promise<{
  providers: PlayerProviderInfo[];
  activeProvider: VideoPlayerProvider;
  error: string | null;
}> {
  try {
    const supabase = await createAdminClient();

    // Ensure all known providers exist in the DB
    for (const [id, info] of Object.entries(PROVIDER_REGISTRY)) {
      await supabase
        .from("api_providers")
        .upsert(
          {
            provider_name: id,
            provider_type: "video_source",
            base_url: info.baseUrl,
            description: info.description,
            is_active: false,
          },
          { onConflict: "provider_name" },
        );
    }

    // Fetch all video_source providers
    const { data, error } = await supabase
      .from("api_providers")
      .select("*")
      .eq("provider_type", "video_source")
      .order("provider_name");

    if (error) throw error;

    // Get active provider
    const { provider: activeProvider } = await getActivePlayerProvider();

    const providers: PlayerProviderInfo[] = (data ?? []).map((p) => {
      const registry = PROVIDER_REGISTRY[p.provider_name as VideoPlayerProvider];
      return {
        id: p.id,
        provider_name: p.provider_name,
        base_url: p.base_url,
        is_active: p.provider_name === activeProvider,
        display_name: registry?.displayName ?? p.provider_name,
        description: registry?.description ?? p.description,
      };
    });

    return { providers, activeProvider, error: null };
  } catch (e) {
    return {
      providers: Object.entries(PROVIDER_REGISTRY).map(([id, info]) => ({
        id: "",
        provider_name: id,
        base_url: info.baseUrl,
        is_active: id === "2embed",
        display_name: info.displayName,
        description: info.description,
      })),
      activeProvider: "2embed",
      error: (e as Error).message,
    };
  }
}

// ---------------------------------------------------------------------------
// Provider Registry
// ---------------------------------------------------------------------------

const PROVIDER_REGISTRY: Record<
  VideoPlayerProvider,
  { displayName: string; baseUrl: string; description: string }
> = {
  "2embed": {
    displayName: "2Embed.cc",
    baseUrl: "https://www.2embed.cc",
    description:
      "Fast HD streaming. Supports TMDB ID for movies and TV series with season/episode.",
  },
  vidapi: {
    displayName: "VidAPI",
    baseUrl: "https://vidapi.qzz.io",
    description:
      "Customizable player with color themes, autoplay, next episode button. Supports TMDB ID.",
  },
};