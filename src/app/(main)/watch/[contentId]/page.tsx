import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EpisodeGrid } from "@/components/content/EpisodeGrid";
import type { Content, ContentType, Category, Episode } from "@/lib/supabase/types";
import { TYPE_LABELS } from "@/lib/constants";
import {
  Play,
  Star,
  Calendar,
  Clock,
  Film,
  Tv,
  Crown,
  Lock,
  ArrowLeft,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TYPE_ICONS: Record<ContentType, typeof Film> = {
  movie: Film,
  series: Tv,
  anime: Tv,
  donghua: Tv,
  microdrama: Film,
};

const HAS_EPISODES: ContentType[] = ["series", "anime", "donghua", "microdrama"];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ContentDetailData {
  content: Content;
  episodes: Episode[];
  categories: Category[];
  isSubscriber: boolean;
  userId: string | null;
}

// ---------------------------------------------------------------------------
// Detail Content (async — fetches data server-side)
// ---------------------------------------------------------------------------

async function ContentDetailContent({
  contentId,
}: {
  contentId: string;
}) {
  const supabase = await createClient();

  // Get user session for subscription check
  let userId: string | null = null;
  let isSubscriber = false;
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;

    if (userId) {
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("status")
        .eq("user_id", userId)
        .eq("status", "active")
        .limit(1);

      isSubscriber = (sub?.length ?? 0) > 0;
    }
  } catch {
    // Not authenticated — that's OK, just no subscription
  }

  // Fetch content with categories
  const { data: content, error: contentError } = await supabase
    .from("contents")
    .select("*")
    .eq("id", contentId)
    .eq("status", "published")
    .single();

  if (contentError || !content) {
    notFound();
  }

  // Fetch categories for this content
  const { data: categoryRows } = await supabase
    .from("content_categories")
    .select("category:categories(*)")
    .eq("content_id", contentId);

  const categories: Category[] = (
    categoryRows
      ?.map((r: { category: Category | null }) => r.category)
      .filter(Boolean) ?? []
  ) as Category[];

  // Fetch episodes (all for multi-episode types, first one for movies)
  let episodes: Episode[] = [];
  if (HAS_EPISODES.includes(content.type)) {
    const { data: epData } = await supabase
      .from("episodes")
      .select("*")
      .eq("content_id", contentId)
      .order("episode_number", { ascending: true });

    episodes = epData ?? [];
  } else {
    // For movies, fetch the first episode so the Play button can link to the player
    const { data: epData } = await supabase
      .from("episodes")
      .select("*")
      .eq("content_id", contentId)
      .order("episode_number", { ascending: true })
      .limit(1);
    episodes = epData ?? [];
  }

  const data: ContentDetailData = {
    content,
    episodes,
    categories,
    isSubscriber,
    userId,
  };

  return <ContentDetailLayout data={data} />;
}

// ---------------------------------------------------------------------------
// Content Detail Layout (client-interactive parts)
// ---------------------------------------------------------------------------

import ContentDetailClient from "./ContentDetailClient";

function ContentDetailLayout({ data }: { data: ContentDetailData }) {
  const { content, episodes, categories, isSubscriber } = data;
  const TypeIcon = TYPE_ICONS[content.type];
  const hasEpisodes = HAS_EPISODES.includes(content.type);

  // Determine the play URL for movies (uses first episode if available)
  const moviePlayUrl =
    episodes.length > 0
      ? `/watch/${content.id}/${episodes[0].id}`
      : `/watch/${content.id}`;

  // Determine if the "Play" button should be locked
  const isLocked =
    content.is_premium_only && !isSubscriber && !hasEpisodes;

  return (
    <div className="min-h-screen bg-transparent -mt-16">
      {/* Backdrop Section */}
      <div className="relative w-full h-[50vh] sm:h-[55vh] min-h-[350px] max-h-[600px]">
        {content.backdrop_url ? (
          <img
            src={content.backdrop_url}
            alt=""
            className="w-full h-full object-cover object-top"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-cinema-surface to-cinema-bg" />
        )}

        {/* Gradient overlays */}
        <div className="absolute inset-0 cinema-gradient-bottom" />
        <div className="absolute inset-0 cinema-gradient-right" />
        <div className="absolute inset-0 bg-black/20" />

        {/* Back button + Play button overlay */}
        <div className="absolute inset-0 flex flex-col justify-between z-10">
          {/* Top: Back button */}
          <div className="flex items-center p-6 md:px-10">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="rounded-xl bg-black/30 backdrop-blur-sm border border-white/10 h-10 px-4 text-sm text-white/80 hover:text-white hover:bg-white/10 -ml-2"
            >
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Link>
            </Button>
          </div>

          {/* Bottom: Play button (for movies) */}
          {!hasEpisodes && (
            <div className="px-6 md:px-10 pb-8">
              {isLocked ? (
                <Button
                  asChild
                  size="lg"
                  className="rounded-xl bg-cinema-gold hover:bg-cinema-gold/80 text-black font-semibold"
                >
                  <Link href="/profile/subscription">
                    <Crown className="w-5 h-5 mr-2" />
                    Subscribe to Watch
                  </Link>
                </Button>
              ) : content.trailer_url ? (
                <div className="flex items-center gap-3">
                  <Button
                    asChild
                    size="lg"
                    className="rounded-xl bg-cinema-red hover:bg-cinema-red-hover text-white glow-red font-semibold"
                  >
                    <Link href={moviePlayUrl}>
                      <Play className="w-5 h-5 mr-2" />
                      Play
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="rounded-xl border-white/20 text-white hover:bg-white/10"
                  >
                    <a
                      href={content.trailer_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Play className="w-5 h-5 mr-2" />
                      Trailer
                    </a>
                  </Button>
                </div>
              ) : (
                <Button
                  asChild
                  size="lg"
                  className="rounded-xl bg-cinema-red hover:bg-cinema-red-hover text-white glow-red font-semibold"
                >
                  <Link href={moviePlayUrl}>
                    <Play className="w-5 h-5 mr-2" />
                    Play
                  </Link>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content Info */}
      <div className="max-w-[1400px] mx-auto px-5 md:px-8 lg:px-12 -mt-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
          {/* Poster (sidebar on desktop, hidden on mobile since backdrop is shown) */}
          <div className="hidden lg:block">
            <div className="sticky top-20">
              {content.poster_url ? (
                <img
                  src={content.poster_url}
                  alt={content.title}
                  className="w-full rounded-xl shadow-2xl shadow-black/60 border border-cinema-border"
                />
              ) : (
                <div className="aspect-[2/3] rounded-xl bg-cinema-surface border border-cinema-border flex items-center justify-center">
                  <TypeIcon className="w-12 h-12 text-muted-foreground/20" />
                </div>
              )}
            </div>
          </div>

          {/* Main info */}
          <div className="space-y-6 pb-12">
            {/* Title + Meta */}
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <Badge className="rounded-lg bg-cinema-red text-white border-none text-[11px] font-semibold uppercase tracking-wider">
                  <TypeIcon className="w-3 h-3 mr-1" />
                  {TYPE_LABELS[content.type]}
                </Badge>
                {content.is_premium_only && (
                  <Badge className="rounded-lg bg-cinema-gold/90 text-black border-none text-[11px] font-semibold gap-0.5">
                    <Crown className="w-3 h-3" />
                    Premium
                  </Badge>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground leading-tight tracking-tight">
                {content.title}
              </h1>

              {content.original_title &&
                content.original_title !== content.title && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {content.original_title}
                  </p>
                )}

              {/* Meta row */}
              <div className="flex items-center flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground mt-3">
                {content.release_year && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {content.release_year}
                  </span>
                )}
                {content.runtime_minutes && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {content.runtime_minutes}m
                  </span>
                )}
                {content.rating > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-cinema-gold fill-cinema-gold" />
                    {content.rating.toFixed(1)}
                    {content.rating_count > 0 && (
                      <span className="text-muted-foreground/50">
                        ({content.rating_count.toLocaleString()})
                      </span>
                    )}
                  </span>
                )}
                {content.language && (
                  <span className="uppercase text-xs tracking-wider">
                    {content.language}
                  </span>
                )}
              </div>

              {/* Category tags */}
              {categories.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap mt-3">
                  {categories.map((cat) => (
                    <Badge
                      key={cat.id}
                      variant="outline"
                      className="rounded-lg border-cinema-border text-[11px] text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors cursor-default"
                    >
                      {cat.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Synopsis */}
            {content.synopsis && (
              <ContentDetailClient synopsis={content.synopsis} />
            )}

            {/* Episodes Section */}
            {hasEpisodes && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold tracking-tight text-foreground">
                    Episodes
                    {episodes.length > 0 && (
                      <span className="text-sm font-normal text-muted-foreground ml-2">
                        {episodes.length} episode
                        {episodes.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </h2>

                  <div className="flex items-center gap-3">
                    {/* Premium warning for non-subscribers */}
                    {content.is_premium_only && !isSubscriber && (
                      <Badge className="rounded-lg bg-cinema-gold/10 text-cinema-gold border-cinema-gold/30 text-xs gap-1">
                        <Lock className="w-3 h-3" />
                        Some episodes require subscription
                      </Badge>
                    )}

                    {/* Play First Episode button for TV series */}
                    {episodes.length > 0 && !(content.is_premium_only && !isSubscriber) && (
                      <Button
                        asChild
                        size="sm"
                        className="rounded-xl bg-cinema-red hover:bg-cinema-red-hover text-white glow-red font-semibold text-xs"
                      >
                        <Link href={`/watch/${content.id}/${episodes[0].id}`}>
                          <Play className="w-3.5 h-3.5 mr-1.5" />
                          Play S1 E1
                        </Link>
                      </Button>
                    )}
                    {episodes.length > 0 && content.is_premium_only && !isSubscriber && (
                      <Button
                        asChild
                        size="sm"
                        className="rounded-xl bg-cinema-gold hover:bg-cinema-gold/80 text-black font-semibold text-xs"
                      >
                        <Link href="/profile/subscription">
                          <Crown className="w-3.5 h-3.5 mr-1.5" />
                          Subscribe to Watch
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>

                {episodes.length > 0 ? (
                  <EpisodeGrid
                    episodes={episodes}
                    contentId={content.id}
                    contentType={content.type}
                    contentPremiumOnly={content.is_premium_only}
                    isSubscriber={isSubscriber}
                  />
                ) : (
                  <div className="text-center py-12 rounded-xl bg-cinema-surface border border-cinema-border">
                    <p className="text-sm text-muted-foreground">
                      No episodes available yet
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

interface PageProps {
  params: Promise<{ contentId: string }>;
}

export default async function ContentDetailPage({ params }: PageProps) {
  const { contentId } = await params;

  return (
    <Suspense fallback={<ContentDetailSkeleton />}>
      <ContentDetailContent contentId={contentId} />
    </Suspense>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function ContentDetailSkeleton() {
  return (
    <div className="min-h-screen bg-transparent">
      {/* Backdrop skeleton */}
      <div className="relative w-full h-[55vh] min-h-[350px] bg-cinema-surface">
        <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-cinema-surface via-cinema-elevated to-cinema-surface bg-[length:200%_100%]" />
        <div className="absolute inset-0 cinema-gradient-bottom" />
      </div>

      {/* Content skeleton */}
      <div className="max-w-[1400px] mx-auto px-5 md:px-8 lg:px-12 -mt-8 space-y-6 pb-12">
        <div className="space-y-3">
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-xl" />
            <Skeleton className="h-6 w-20 rounded-xl" />
          </div>
          <Skeleton className="h-10 w-96 max-w-full rounded-xl" />
          <Skeleton className="h-4 w-64 rounded-xl" />
          <div className="flex gap-4 mt-3">
            <Skeleton className="h-4 w-16 rounded-xl" />
            <Skeleton className="h-4 w-20 rounded-xl" />
            <Skeleton className="h-4 w-24 rounded-xl" />
          </div>
          <div className="space-y-2 mt-6">
            <Skeleton className="h-4 w-full rounded-xl" />
            <Skeleton className="h-4 w-full rounded-xl" />
            <Skeleton className="h-4 w-3/4 rounded-xl" />
          </div>
        </div>

        {/* Episode skeleton */}
        <div className="space-y-3">
          <Skeleton className="h-6 w-32 rounded-xl" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="flex gap-3 p-2.5 rounded-xl bg-cinema-surface border border-cinema-border"
              >
                <Skeleton className="w-[160px] aspect-video rounded-xl" />
                <div className="flex-1 space-y-2 py-0.5">
                  <Skeleton className="h-4 w-3/4 rounded-xl" />
                  <Skeleton className="h-3 w-full rounded-xl" />
                  <Skeleton className="h-3 w-2/3 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}