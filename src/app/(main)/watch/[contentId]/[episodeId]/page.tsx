import { Suspense } from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Skeleton } from "@/components/ui/skeleton";
import type { Content, Episode } from "@/lib/supabase/types";
import PlayerClient from "./PlayerClient";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PlayerPageData {
  episode: Episode;
  content: Content;
  episodes: Episode[];
  isSubscriber: boolean;
  isAuthenticated: boolean;
}

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
    .select(
      "id, content_id, episode_number, title, synopsis, thumbnail_url, runtime_seconds, video_url, video_url_backup, video_quality, subtitles_url, is_locked, is_free_trial"
    )
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

  // Fetch all episodes for navigation (sorted by episode number)
  const { data: episodes } = await supabase
    .from("episodes")
    .select(
      "id, content_id, episode_number, title, synopsis, thumbnail_url, runtime_seconds, video_url, video_url_backup, video_quality, subtitles_url, is_locked, is_free_trial"
    )
    .eq("content_id", contentId)
    .order("episode_number", { ascending: true });

  const data: PlayerPageData = {
    episode,
    content,
    episodes: episodes ?? [],
    isSubscriber,
    isAuthenticated,
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
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      <div className="w-full max-w-5xl aspect-video flex flex-col items-center justify-center gap-4">
        <Skeleton className="w-16 h-16 rounded-full bg-white/10" />
        <Skeleton className="h-4 w-48 bg-white/10" />
        <Skeleton className="h-3 w-32 bg-white/10" />
      </div>
    </div>
  );
}