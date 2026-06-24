import { Suspense } from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Skeleton } from "@/components/ui/skeleton";
import { getActivePlayerProvider } from "@/lib/admin/player-provider-actions";
import { buildEmbedUrl, type VideoPlayerProvider } from "@/lib/api/tmdb";
import type { Content, Episode, Category } from "@/lib/supabase/types";
import type { Metadata } from "next";
import PlayerClient from "./PlayerClient";
import { Badge } from "@/components/ui/badge";
import { Star, Calendar, Clock, Film, Tv, Crown, Lock } from "lucide-react";
import { TYPE_LABELS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// SEO — Dynamic metadata from content data
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ contentId: string; episodeId: string }>;
}): Promise<Metadata> {
  const { contentId, episodeId } = await params;
  try {
    const supabase = await createClient();
    const { data: episode } = await supabase
      .from("episodes")
      .select("title, content:contents(title, synopsis, poster_url, type)")
      .eq("id", episodeId)
      .single();
    const ep = episode as { title: string | null; content: { title: string; synopsis: string | null; poster_url: string | null; type: string } } | null;
    const title = ep
      ? `${ep.title || "Episode"} — ${ep.content.title}`
      : "Watch";
    const description = ep?.content?.synopsis?.slice(0, 160) ?? "Stream premium content";
    return {
      title,
      description,
      openGraph: ep?.content?.poster_url
        ? { title, description, images: [ep.content.poster_url] }
        : undefined,
    };
  } catch {
    return { title: "Watch — StreamVault" };
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PlayerPageData {
  episode: Episode;
  content: Content;
  episodes: Episode[];
  categories: Category[];
  isSubscriber: boolean;
  isAuthenticated: boolean;
  embedUrl: string | null;
  isIframe: boolean;
  activeProvider: VideoPlayerProvider;
}

const TYPE_ICONS: Record<string, typeof Film> = {
  movie: Film,
  series: Tv,
  anime: Tv,
  donghua: Tv,
  microdrama: Film,
};

// ---------------------------------------------------------------------------
// Data Fetching (server-side)
// ---------------------------------------------------------------------------

async function PlayerPageContent({
  contentId,
  episodeId,
}: {
  contentId: string;
  episodeId: string;
}) {
  const supabase = await createClient();

  // Auth + subscription check
  let isAuthenticated = false;
  let isSubscriber = false;
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    isAuthenticated = !!user;

    if (user) {
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("status")
        .eq("user_id", user.id)
        .eq("status", "active")
        .limit(1);

      isSubscriber = (sub?.length ?? 0) > 0;
    }
  } catch {
    // Not authenticated
  }

  // Fetch the episode
  const { data: episode, error: epError } = await supabase
    .from("episodes")
    .select("*")
    .eq("id", episodeId)
    .eq("content_id", contentId)
    .single();

  if (epError || !episode) {
    notFound();
  }

  // Fetch parent content
  const { data: content, error: contentError } = await supabase
    .from("contents")
    .select("*")
    .eq("id", contentId)
    .eq("status", "published")
    .single();

  if (contentError || !content) {
    notFound();
  }

  // Fetch categories
  const { data: categoryRows } = await supabase
    .from("content_categories")
    .select("category:categories(*)")
    .eq("content_id", contentId);
  const categories: Category[] = (
    (categoryRows ?? []) as unknown as { category: Category | null }[]
  )
    .map((r) => r.category)
    .filter(Boolean) as Category[];

  // Fetch all episodes for navigation
  const { data: episodes } = await supabase
    .from("episodes")
    .select("*")
    .eq("content_id", contentId)
    .order("episode_number", { ascending: true });

  // Fetch season number for this episode (if TV)
  let seasonNumber = 1;
  if (episode.season_id) {
    const { data: season } = await supabase
      .from("seasons")
      .select("season_number")
      .eq("id", episode.season_id)
      .single();
    if (season) seasonNumber = season.season_number;
  }

  // Get active player provider and build embed URL dynamically
  let embedUrl: string | null = null;
  let isIframe = false;
  let activeProvider: VideoPlayerProvider = "2embed";

  // Check if this is a Melolo microdrama
  const isMelolo = content.external_content_id?.startsWith("melolo_");
  const meloloDramaId = isMelolo ? content.external_content_id.replace("melolo_", "") : null;

  if (isMelolo && meloloDramaId) {
    // Melolo — use our proxy API to resolve stream URL at runtime
    activeProvider = "melolo";
    embedUrl = `/api/melolo/stream?id=${meloloDramaId}&ep=${episode.episode_number}`;
    isIframe = false; // Will use direct video player
  } else if (content.tmdb_id) {
    try {
      const { provider } = await getActivePlayerProvider();
      activeProvider = provider;
      const contentType = content.type === "movie" ? "movie" : "tv";
      embedUrl = buildEmbedUrl(
        provider,
        content.tmdb_id,
        contentType,
        seasonNumber,
        episode.episode_number,
      );
      isIframe = true;
    } catch {
      // Fallback to stored URL
      embedUrl = episode.video_url || episode.video_url_backup || null;
      isIframe = !!embedUrl;
    }
  } else {
    // No tmdb_id — use stored URL
    embedUrl = episode.video_url || episode.video_url_backup || null;
    isIframe = !!embedUrl;
  }

  const data: PlayerPageData = {
    episode,
    content,
    episodes: episodes ?? [],
    categories,
    isSubscriber,
    isAuthenticated,
    embedUrl,
    isIframe,
    activeProvider,
  };

  return <PlayerClient data={data} />;
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

interface PageProps {
  params: Promise<{ contentId: string; episodeId: string }>;
}

export default async function EpisodePlayerPage({ params }: PageProps) {
  const { contentId, episodeId } = await params;

  return (
    <Suspense fallback={<PlayerSkeleton />}>
      <PlayerPageContent contentId={contentId} episodeId={episodeId} />
    </Suspense>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function PlayerSkeleton() {
  return (
    <div className="min-h-screen bg-cinema-bg">
      {/* Player skeleton */}
      <div className="w-full aspect-video max-h-[70vh] bg-cinema-surface animate-shimmer" />
      {/* Content skeleton */}
      <div className="max-w-[1400px] mx-auto px-5 md:px-8 lg:px-12 py-8 space-y-4">
        <Skeleton className="h-8 w-96 max-w-full rounded-xl" />
        <Skeleton className="h-4 w-64 rounded-xl" />
        <div className="space-y-2 mt-4">
          <Skeleton className="h-4 w-full rounded-xl" />
          <Skeleton className="h-4 w-full rounded-xl" />
          <Skeleton className="h-4 w-3/4 rounded-xl" />
        </div>
      </div>
    </div>
  );
}