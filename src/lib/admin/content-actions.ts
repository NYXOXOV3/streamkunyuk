/**
 * Admin Content — Shared Logic
 *
 * CRUD operations for the `contents` table, TMDB imports,
 * and the episode locking system.
 *
 * Called by API route handlers (NOT server actions).
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { manualContentSchema, episodeSchema, updateEpisodeSchema } from "@/lib/validations/adminSchemas";
import { searchTmdb, getTmdbDetail, parseTmdbToContentType } from "@/lib/api/tmdb";
import type { Content, ContentType, ContentStatus } from "@/lib/supabase/types";

// ---------------------------------------------------------------------------
// Content List (paginated)
// ---------------------------------------------------------------------------

export async function getContentList(params: {
  page?: number;
  pageSize?: number;
  type?: ContentType | "all";
  status?: ContentStatus | "all";
  search?: string;
}): Promise<{ data: Content[]; count: number; error: string | null }> {
  try {
    const supabase = await createAdminClient();
    const { page = 1, pageSize = 20, type = "all", status = "all", search } = params;

    let query = supabase
      .from("contents")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (type !== "all") {
      query = query.eq("type", type);
    }
    if (status !== "all") {
      query = query.eq("status", status);
    }
    if (search) {
      query = query.ilike("title", `%${search}%`);
    }

    const { data, count, error } = await query;

    if (error) throw error;
    return { data: data ?? [], count: count ?? 0, error: null };
  } catch (e) {
    return { data: [], count: 0, error: (e as Error).message };
  }
}

// ---------------------------------------------------------------------------
// Create Content (Manual Upload for Anime/Donghua)
// ---------------------------------------------------------------------------

export async function createContent(formData: Record<string, unknown>): Promise<{
  success: boolean;
  data?: Content;
  error: string | null;
}> {
  try {
    const parsed = manualContentSchema.safeParse(formData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const supabase = await createAdminClient();
    const d = parsed.data;

    // Find the "Manual Upload" provider
    const { data: provider } = await supabase
      .from("content_providers")
      .select("id")
      .eq("name", "Manual Upload")
      .single();

    const { data, error } = await supabase
      .from("contents")
      .insert({
        title: d.title,
        original_title: d.original_title || null,
        synopsis: d.synopsis || null,
        type: d.type,
        release_year: d.release_year || null,
        runtime_minutes: d.runtime_minutes || null,
        poster_url: d.poster_url || null,
        backdrop_url: d.backdrop_url || null,
        trailer_url: d.trailer_url || null,
        language: d.language,
        country_of_origin: d.country_of_origin || null,
        status: d.status,
        is_premium_only: d.is_premium_only,
        free_trial_episodes: d.free_trial_episodes,
        provider_source_id: provider?.id || null,
        slug: d.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, ""),
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data, error: null };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

// ---------------------------------------------------------------------------
// TMDB Import — Save TMDB metadata to local contents table
// ---------------------------------------------------------------------------

export async function importFromTmdb(params: {
  tmdbId: number;
  type: "movie" | "tv";
}): Promise<{ success: boolean; data?: Content; error: string | null }> {
  try {
    const supabase = await createAdminClient();

    // Get TMDB API key from encrypted storage
    const { getCredential } = await import("@/lib/admin/api-config-actions");
    const { value: apiKey, error: keyError } = await getCredential("tmdb");

    if (keyError || !apiKey) {
      return {
        success: false,
        error: keyError || "TMDB API key not configured. Go to API Config to add it.",
      };
    }

    // Fetch full details from TMDB
    const detail = await getTmdbDetail(params.tmdbId, params.type, apiKey);
    const parsed = parseTmdbToContentType(detail, params.type);

    // Find the TMDB content provider
    const { data: provider } = await supabase
      .from("content_providers")
      .select("id")
      .eq("name", "TMDB Import")
      .single();

    // Delete existing TMDB entry with same tmdb_id, then insert fresh
    // (table lacks unique constraint on tmdb_id, so upsert fails)
    await supabase
      .from("contents")
      .delete()
      .eq("tmdb_id", parsed.tmdb_id);

    const { data, error } = await supabase
      .from("contents")
      .insert({
        tmdb_id: parsed.tmdb_id,
        title: parsed.title,
        original_title: parsed.original_title,
        synopsis: parsed.synopsis,
        type: parsed.type,
        release_year: parsed.release_year,
        poster_url: parsed.poster_url,
        backdrop_url: parsed.backdrop_url,
        rating: parsed.rating,
        rating_count: parsed.rating_count,
        status: "draft",
        provider_source_id: provider?.id || null,
        slug: parsed.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, ""),
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data, error: null };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

// ---------------------------------------------------------------------------
// TMDB Search (proxied through server to hide API key)
// ---------------------------------------------------------------------------

export async function searchTmdbContent(params: {
  query: string;
  type: "movie" | "tv";
  page?: number;
}): Promise<{
  results: ReturnType<typeof parseTmdbToContentType>[];
  totalPages: number;
  totalResults: number;
  error: string | null;
}> {
  try {
    const { getCredential } = await import("@/lib/admin/api-config-actions");
    const { value: apiKey, error: keyError } = await getCredential("tmdb");

    if (keyError || !apiKey) {
      return {
        results: [],
        totalPages: 0,
        totalResults: 0,
        error: keyError || "TMDB API key not configured. Go to API Config to add it.",
      };
    }

    const response = await searchTmdb(
      params.query,
      params.type,
      params.page,
      apiKey,
    );

    const results = response.results.map((r) =>
      parseTmdbToContentType(r, params.type),
    );

    return {
      results,
      totalPages: response.total_pages,
      totalResults: response.total_results,
      error: null,
    };
  } catch (e) {
    return {
      results: [],
      totalPages: 0,
      totalResults: 0,
      error: (e as Error).message,
    };
  }
}

// ---------------------------------------------------------------------------
// Update content status / premium lock
// ---------------------------------------------------------------------------

export async function updateContent(
  contentId: string,
  updates: {
    status?: ContentStatus;
    is_premium_only?: boolean;
    free_trial_episodes?: number;
    featured?: boolean;
    title?: string;
    original_title?: string;
    synopsis?: string;
    type?: ContentType;
    release_year?: number;
    runtime_minutes?: number;
    poster_url?: string;
    backdrop_url?: string;
    trailer_url?: string;
    language?: string;
    country_of_origin?: string;
  },
): Promise<{ success: boolean; error: string | null }>{
  try {
    const supabase = await createAdminClient();
    const { error } = await supabase
      .from("contents")
      .update(updates)
      .eq("id", contentId);

    if (error) throw error;
    return { success: true, error: null };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

// ---------------------------------------------------------------------------
// Episode CRUD
// ---------------------------------------------------------------------------

export async function getEpisodes(contentId: string): Promise<{
  data: import("@/lib/supabase/types").Episode[];
  error: string | null;
}> {
  try {
    const supabase = await createAdminClient();
    const { data, error } = await supabase
      .from("episodes")
      .select("*")
      .eq("content_id", contentId)
      .order("episode_number", { ascending: true });

    if (error) throw error;
    return { data: data ?? [], error: null };
  } catch (e) {
    return { data: [], error: (e as Error).message };
  }
}

export async function createEpisode(
  contentId: string,
  formData: Record<string, unknown>,
): Promise<{ success: boolean; error: string | null }> {
  try {
    const parsed = episodeSchema.safeParse(formData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const supabase = await createAdminClient();
    const d = parsed.data;

    // Convert simple subtitle_url string to the DB's subtitles_url JSONB format
    const subtitlesUrl =
      d.subtitle_url && d.subtitle_url.trim() !== ""
        ? [{ lang: "en", url: d.subtitle_url.trim() }]
        : null;

    const { error } = await supabase.from("episodes").insert({
      content_id: contentId,
      episode_number: d.episode_number,
      title: d.title || null,
      synopsis: d.synopsis || null,
      thumbnail_url: d.thumbnail_url || null,
      video_url: d.video_url,
      video_url_backup: d.video_url_backup || null,
      subtitles_url: subtitlesUrl,
      is_locked: d.is_locked,
      is_free_trial: d.is_free_trial,
    });

    if (error) throw error;
    return { success: true, error: null };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function updateEpisodeLock(
  episodeId: string,
  updates: { is_locked?: boolean; is_free_trial?: boolean },
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createAdminClient();
    const { error } = await supabase
      .from("episodes")
      .update(updates)
      .eq("id", episodeId);

    if (error) throw error;
    return { success: true, error: null };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function bulkUpdateEpisodeLocks(
  contentId: string,
  updates: { is_locked?: boolean; is_free_trial?: boolean },
  episodeIds?: string[],
): Promise<{ success: boolean; updated: number; error: string | null }> {
  try {
    const supabase = await createAdminClient();

    let query = supabase
      .from("episodes")
      .update(updates)
      .eq("content_id", contentId);

    if (episodeIds && episodeIds.length > 0) {
      query = query.in("id", episodeIds);
    }

    const { count, error } = await query;

    if (error) throw error;
    return { success: true, updated: count ?? 0, error: null };
  } catch (e) {
    return { success: false, updated: 0, error: (e as Error).message };
  }
}

export async function updateEpisode(
  episodeId: string,
  formData: Record<string, unknown>,
): Promise<{ success: boolean; error: string | null }> {
  try {
    const parsed = updateEpisodeSchema.safeParse(formData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const supabase = await createAdminClient();
    const d = parsed.data;

    // Convert simple subtitle_url string to the DB's subtitles_url JSONB format
    const subtitlesUrl =
      d.subtitle_url !== undefined
        ? d.subtitle_url && d.subtitle_url.trim() !== ""
          ? [{ lang: "en", url: d.subtitle_url.trim() }]
          : null
        : undefined; // undefined = don't update this field

    const updates: Record<string, unknown> = { ...d };
    if (subtitlesUrl !== undefined) {
      updates.subtitles_url = subtitlesUrl;
    }
    // Remove subtitle_url from the payload — it's not a real DB column
    delete updates.subtitle_url;

    const { error } = await supabase
      .from("episodes")
      .update(updates)
      .eq("id", episodeId);

    if (error) throw error;
    return { success: true, error: null };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function deleteEpisode(
  episodeId: string,
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createAdminClient();
    const { error } = await supabase
      .from("episodes")
      .delete()
      .eq("id", episodeId);

    if (error) throw error;
    return { success: true, error: null };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function getContentById(
  contentId: string,
): Promise<{ data: Content | null; error: string | null }> {
  try {
    const supabase = await createAdminClient();
    const { data, error } = await supabase
      .from("contents")
      .select("*")
      .eq("id", contentId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (e) {
    return { data: null, error: (e as Error).message };
  }
}

// ---------------------------------------------------------------------------
// Dashboard Stats (mock data for now, structured for real queries later)
// ---------------------------------------------------------------------------

export async function getDashboardStats(): Promise<{
  totalUsers: number;
  activeSubscribers: number;
  totalContent: number;
  totalWatchHours: number;
  contentByType: { type: string; count: number }[];
  recentImports: { id: string; title: string; type: string; status: string; created_at: string }[];
  contentByStatus: { status: string; count: number }[];
  subscriptionsByStatus: { status: string; count: number }[];
}> {
  try {
    const supabase = await createAdminClient();

    // Real queries
    const { count: userCount } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true });

    const { count: subscriberCount } = await supabase
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("status", "active");

    const { count: contentCount } = await supabase
      .from("contents")
      .select("id", { count: "exact", head: true });

    // Content by type (real query)
    const { data: typeBreakdown } = await supabase
      .from("contents")
      .select("type");

    const contentByType = (typeBreakdown ?? []).reduce(
      (acc, item) => {
        const t = item.type;
        acc[t] = (acc[t] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Content by status
    const { data: statusBreakdown } = await supabase
      .from("contents")
      .select("status");

    const contentByStatusMap = (statusBreakdown ?? []).reduce(
      (acc, item) => {
        const s = item.status;
        acc[s] = (acc[s] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Subscriptions by status
    const { data: subStatusBreakdown } = await supabase
      .from("subscriptions")
      .select("status");

    const subscriptionsByStatusMap = (subStatusBreakdown ?? []).reduce(
      (acc, item) => {
        const s = item.status;
        acc[s] = (acc[s] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Recent imports
    const { data: recentImports } = await supabase
      .from("contents")
      .select("id, title, type, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    return {
      totalUsers: userCount ?? 0,
      activeSubscribers: subscriberCount ?? 0,
      totalContent: contentCount ?? 0,
      totalWatchHours: 0, // Requires aggregation query — placeholder
      contentByType: Object.entries(contentByType).map(([type, count]) => ({
        type,
        count,
      })),
      recentImports: recentImports ?? [],
      contentByStatus: Object.entries(contentByStatusMap).map(([status, count]) => ({
        status,
        count,
      })),
      subscriptionsByStatus: Object.entries(subscriptionsByStatusMap).map(([status, count]) => ({
        status,
        count,
      })),
    };
  } catch {
    // Return mock data if Supabase is not connected
    return {
      totalUsers: 1247,
      activeSubscribers: 384,
      totalContent: 156,
      totalWatchHours: 2840,
      contentByType: [
        { type: "movie", count: 45 },
        { type: "series", count: 32 },
        { type: "anime", count: 28 },
        { type: "donghua", count: 18 },
        { type: "microdrama", count: 33 },
      ],
      recentImports: [],
      contentByStatus: [
        { status: "published", count: 98 },
        { status: "draft", count: 42 },
        { status: "archived", count: 16 },
      ],
      subscriptionsByStatus: [
        { status: "active", count: 384 },
        { status: "trialing", count: 52 },
        { status: "inactive", count: 128 },
        { status: "cancelled", count: 74 },
        { status: "past_due", count: 23 },
      ],
    };
  }
}