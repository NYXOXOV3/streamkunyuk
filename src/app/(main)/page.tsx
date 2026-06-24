import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { HeroBanner } from "@/components/home/HeroBanner";
import { BannerHero, type BannerItem } from "@/components/home/BannerHero";
import { ContentCarousel } from "@/components/home/ContentCarousel";
import { HomeSkeleton } from "@/components/home/HomeSkeleton";
import type { Content, ContentType, Category, Episode, WatchHistory } from "@/lib/supabase/types";

// ---------------------------------------------------------------------------
// Data types
// ---------------------------------------------------------------------------

interface CarouselSection {
  title: string;
  contents: Content[];
  href?: string;
}

interface HomeData {
  featured: Content[];
  sections: CarouselSection[];
  continueWatching: {
    content: Content;
    episode: Episode;
    progress_seconds: number;
    duration_seconds: number;
  }[];
}

// ---------------------------------------------------------------------------
// Content card columns for list queries (lightweight — no synopsis)
// ---------------------------------------------------------------------------

const CARD_SELECT = "id, title, type, poster_url, backdrop_url, release_year, rating, rating_count, is_premium_only";

const HERO_SELECT = "id, title, synopsis, backdrop_url, poster_url, trailer_url, type, release_year, rating, rating_count, is_premium_only";

// ---------------------------------------------------------------------------
// Data fetcher (server-side, parallel)
// ---------------------------------------------------------------------------

async function fetchHomeData(): Promise<HomeData> {
  const supabase = await createClient();

  // Get user (optional — for Continue Watching)
  let userId: string | null = null;
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  } catch {
    // Not authenticated — continue without Continue Watching
  }

  // --- Parallel queries ---
  const [
    featuredRes,
    trendingRes,
    newReleasesRes,
    moviesRes,
    seriesRes,
    animeRes,
    continueWatchingRes,
    categoriesRes,
  ] = await Promise.all([
    // Featured content for hero
    supabase
      .from("contents")
      .select(HERO_SELECT)
      .eq("featured", true)
      .eq("status", "published")
      .order("featured_order", { ascending: true })
      .limit(5),

    // Trending — highest rated
    supabase
      .from("contents")
      .select(CARD_SELECT)
      .eq("status", "published")
      .gt("rating", 0)
      .order("rating", { ascending: false })
      .limit(15),

    // New releases
    supabase
      .from("contents")
      .select(CARD_SELECT)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(15),

    // Movies
    supabase
      .from("contents")
      .select(CARD_SELECT)
      .eq("status", "published")
      .eq("type", "movie")
      .order("rating", { ascending: false })
      .limit(15),

    // Series
    supabase
      .from("contents")
      .select(CARD_SELECT)
      .eq("status", "published")
      .eq("type", "series")
      .order("rating", { ascending: false })
      .limit(15),

    // Anime & Donghua combined
    supabase
      .from("contents")
      .select(CARD_SELECT)
      .eq("status", "published")
      .in("type", ["anime", "donghua"])
      .order("rating", { ascending: false })
      .limit(15),

    // Continue Watching (only if authenticated)
    userId
      ? supabase
          .from("watch_history")
          .select("content_id, episode_id, progress_seconds, duration_seconds, last_watched_at, content:contents(id, title, type, poster_url, backdrop_url, release_year, rating, rating_count, is_premium_only), episode:episodes(id, episode_number, title, thumbnail_url, runtime_seconds)")
          .eq("user_id", userId)
          .eq("completed", false)
          .order("last_watched_at", { ascending: false })
          .limit(10)
      : Promise.resolve({ data: null, error: null }),

    // Categories (for dynamic carousel rows)
    supabase
      .from("categories")
      .select("id, name, slug, type_filter, sort_order")
      .order("sort_order", { ascending: true })
      .limit(20),
  ]);

  // --- Build carousel sections ---
  const sections: CarouselSection[] = [];

  if (trendingRes.data?.length) {
    sections.push({
      title: "Trending Now",
      contents: trendingRes.data,
      href: "/browse?sort=rating",
    });
  }

  if (newReleasesRes.data?.length) {
    sections.push({
      title: "New Releases",
      contents: newReleasesRes.data,
      href: "/browse?sort=newest",
    });
  }

  if (moviesRes.data?.length) {
    sections.push({
      title: "Action & Movies",
      contents: moviesRes.data,
      href: "/browse/movie",
    });
  }

  if (seriesRes.data?.length) {
    sections.push({
      title: "Popular Series",
      contents: seriesRes.data,
      href: "/browse/series",
    });
  }

  if (animeRes.data?.length) {
    sections.push({
      title: "Anime & Donghua",
      contents: animeRes.data,
      href: "/browse/anime",
    });
  }

  // Category-based rows (pick top 3 categories with content)
  if (categoriesRes.data?.length) {
    for (const cat of categoriesRes.data.slice(0, 3)) {
      const { data: catContent } = await supabase
        .from("contents")
        .select(CARD_SELECT)
        .eq("status", "published")
        .innerJoin("content_categories", "contents.id", "content_categories.content_id")
        .eq("content_categories.category_id", cat.id)
        .order("rating", { ascending: false })
        .limit(15);

      if (catContent && catContent.length > 0) {
        // The join returns combined rows — extract content fields
        const contents: Content[] = catContent.map((row: Record<string, unknown>) => ({
          id: row.id as string,
          title: row.title as string,
          type: row.type as ContentType,
          poster_url: row.poster_url as string | null,
          backdrop_url: row.backdrop_url as string | null,
          release_year: row.release_year as number | null,
          rating: (row.rating as number) ?? 0,
          rating_count: (row.rating_count as number) ?? 0,
          is_premium_only: (row.is_premium_only as boolean) ?? false,
        }));

        sections.push({
          title: cat.name,
          href: `/browse?category=${cat.slug}`,
          contents,
        });
      }
    }
  }

  // --- Continue Watching ---
  const continueWatching = (continueWatchingRes.data ?? [])
    .filter((row: Record<string, unknown>) => row.content && row.episode)
    .map((row: Record<string, unknown>) => ({
      content: row.content as Content,
      episode: row.episode as Episode,
      progress_seconds: row.progress_seconds as number,
      duration_seconds: row.duration_seconds as number,
    }));

  return {
    featured: featuredRes.data ?? [],
    sections,
    continueWatching,
  };
}

// ---------------------------------------------------------------------------
// Home Content (client boundary for Suspense)
// ---------------------------------------------------------------------------

async function HomeContent() {
  const data = await fetchHomeData();

  return (
    <div className="-mt-16 relative z-10 space-y-0">
      {/* Continue Watching (only if user has history) */}
      {data.continueWatching.length > 0 && (
        <ContinueWatchingRow items={data.continueWatching} />
      )}

      {/* Content carousels */}
      {data.sections.map((section) => (
        <ContentCarousel
          key={section.title}
          title={section.title}
          contents={section.contents}
          seeAllHref={section.href}
        />
      ))}

      {/* Empty state — no content at all */}
      {!data.featured.length && data.sections.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-muted-foreground text-sm">
            No content available yet. Check back soon!
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Continue Watching Row (special carousel with progress bars)
// ---------------------------------------------------------------------------

import Link from "next/link";
import { Play, Clock } from "lucide-react";

function ContinueWatchingRow({
  items,
}: {
  items: {
    content: Content;
    episode: Episode;
    progress_seconds: number;
    duration_seconds: number;
  }[];
}) {
  return (
    <section className="relative py-4">
      <div className="mb-3 px-5 md:px-8 lg:px-0">
        <h2 className="text-base sm:text-[17px] font-semibold text-foreground">
          Continue Watching
        </h2>
      </div>

      <div className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth px-5 md:px-8 lg:px-0">
        {items.map((item) => {
          const progress =
            item.duration_seconds > 0
              ? Math.min(
                  (item.progress_seconds / item.duration_seconds) * 100,
                  100,
                )
              : 0;
          const imageUrl =
            item.content.backdrop_url || item.content.poster_url;

          return (
            <Link
              key={item.episode.id}
              href={`/watch/${item.content.id}/${item.episode.id}`}
              className="shrink-0 w-[280px] sm:w-[320px] group"
            >
              <div className="relative aspect-video rounded-xl overflow-hidden bg-cinema-elevated border border-white/[0.06]">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={item.content.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Play className="w-8 h-8 text-muted-foreground/20" />
                  </div>
                )}

                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                  <div className="w-11 h-11 rounded-full bg-cinema-red/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300">
                    <Play className="w-4 h-4 text-white ml-0.5" />
                  </div>
                </div>

                {/* Progress bar */}
                <div className="absolute bottom-0 inset-x-0 h-[3px] bg-white/20">
                  <div
                    className="h-full bg-cinema-red transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="mt-1.5 px-0.5">
                <p className="text-[13px] font-medium text-foreground truncate">
                  {item.content.title}
                </p>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  <span>
                    E{item.episode.episode_number}
                    {item.episode.title
                      ? `: ${item.episode.title}`
                      : ""}
                  </span>
                  <span className="text-muted-foreground/40">·</span>
                  <Clock className="w-3 h-3" />
                  <span>
                    {Math.floor(item.progress_seconds / 60)}m watched
                  </span>
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Banner — server-fetched, rendered client-side for animation */}
      <Suspense fallback={<HeroBannerFallback />}>
        <HeroBannerWrapper />
      </Suspense>

      {/* Carousels — loaded with Suspense + skeleton */}
      <div className="max-w-[1400px] mx-auto">
        <Suspense fallback={<HomeSkeleton />}>
          <HomeContent />
        </Suspense>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hero Banner async wrapper — checks banners table first, falls back to featured content
// ---------------------------------------------------------------------------

async function HeroBannerWrapper() {
  const supabase = await createClient();

  // 1. Try to get active banners from the banners table
  let bannerItems: BannerItem[] = [];
  try {
    const now = new Date().toISOString();
    const { data: banners, error } = await supabase
      .from("banners")
      .select(
        "id, title, subtitle, banner_type, content_id, custom_image_url, custom_link_url, cta_text, cta_link, sort_order, start_date, end_date"
      )
      .eq("is_active", true)
      .not("start_date", "gt", now)
      .not("end_date", "lt", now)
      .order("sort_order", { ascending: true })
      .limit(10);

    if (!error && banners && banners.length > 0) {
      // Fetch content details for content-type banners
      const contentIds = banners
        .filter((b) => b.banner_type === "content" && b.content_id)
        .map((b) => b.content_id);

      let contentMap = new Map<string, Record<string, unknown>>();
      if (contentIds.length > 0) {
        const { data: contents } = await supabase
          .from("contents")
          .select(HERO_SELECT)
          .eq("status", "published")
          .in("id", contentIds);
        for (const c of contents ?? []) {
          contentMap.set(c.id, c);
        }
      }

      bannerItems = banners.map((b) => ({
        ...b,
        content: b.banner_type === "content" && b.content_id
          ? (contentMap.get(b.content_id) ?? null)
          : null,
      })) as BannerItem[];
    }
  } catch {
    // banners table might not exist — fall through to featured content
  }

  // 2. If we have banners, render BannerHero
  if (bannerItems.length > 0) {
    return <BannerHero items={bannerItems} />;
  }

  // 3. Fallback: use featured content from contents table
  const { data } = await supabase
    .from("contents")
    .select(HERO_SELECT)
    .eq("featured", true)
    .eq("status", "published")
    .order("featured_order", { ascending: true })
    .limit(5);

  const items = data ?? [];
  return <HeroBanner items={items} />;
}

// ---------------------------------------------------------------------------
// Hero skeleton (matches HeroBanner dimensions)
// ---------------------------------------------------------------------------

function HeroBannerFallback() {
  return (
    <section className="relative w-full h-[65vh] sm:h-[70vh] min-h-[420px] max-h-[720px] overflow-hidden bg-cinema-surface">
      <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-cinema-surface via-cinema-elevated to-cinema-surface bg-[length:200%_100%]" />
      <div className="absolute inset-0 cinema-gradient-bottom" />
      <div className="relative z-10 flex flex-col justify-end h-full max-w-[1400px] mx-auto px-5 md:px-8 lg:px-12 pb-14 sm:pb-16">
        <div className="max-w-xl space-y-3">
          <div className="h-5 w-20 rounded bg-white/10" />
          <div className="h-10 w-96 rounded bg-white/10" />
          <div className="h-4 w-64 rounded bg-white/5" />
          <div className="h-4 w-80 rounded bg-white/5" />
          <div className="flex gap-3 mt-4">
            <div className="h-11 w-28 rounded-md bg-white/10" />
            <div className="h-11 w-32 rounded-md bg-white/5" />
          </div>
        </div>
      </div>
    </section>
  );
}