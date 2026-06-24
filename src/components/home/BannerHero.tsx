"use client";

/**
 * BannerHero
 *
 * Full-width hero section that renders either:
 *   1. Content-based banners (from contents table, via banner records)
 *   2. Custom promotional banners (custom image + link)
 *
 * Falls back gracefully: if no banners configured, renders nothing
 * (the parent can fall back to the featured-content HeroBanner).
 *
 * Uses Framer Motion for auto-cycling and crossfade transitions.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Play, Info, Star, Calendar, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ContentType } from "@/lib/supabase/types";
import { TYPE_LABELS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BannerContent {
  id: string;
  title: string;
  synopsis?: string;
  backdrop_url?: string | null;
  poster_url?: string | null;
  trailer_url?: string | null;
  type?: ContentType;
  release_year?: number | null;
  rating?: number;
  rating_count?: number;
  is_premium_only?: boolean;
}

export interface BannerItem {
  id: string;
  title: string | null;
  subtitle: string | null;
  banner_type: "content" | "custom";
  content_id: string | null;
  custom_image_url: string | null;
  custom_link_url: string | null;
  cta_text: string | null;
  cta_link: string | null;
  content: BannerContent | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface BannerHeroProps {
  items: BannerItem[];
}

export function BannerHero({ items }: BannerHeroProps) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = useCallback(
    (index: number) => {
      setCurrent((index + items.length) % items.length);
    },
    [items.length],
  );

  // Auto-cycle
  useEffect(() => {
    if (items.length <= 1 || isPaused) return;
    intervalRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % items.length);
    }, 8000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [items.length, isPaused]); // lint: removing `current` — setCurrent uses callback form

  if (!items.length) return null;

  const item = items[current];
  if (!item) return null;

  // Resolve display values based on banner type
  const isContent = item.banner_type === "content" && item.content;
  const imageUrl = isContent
    ? item.content!.backdrop_url || item.content!.poster_url
    : item.custom_image_url;
  const displayTitle = item.title || (isContent ? item.content!.title : "Promotion");
  const displaySubtitle =
    item.subtitle || (isContent ? item.content!.synopsis?.slice(0, 150) : "");
  const displayType = isContent ? item.content!.type : null;
  const displayYear = isContent ? item.content!.release_year : null;
  const displayRating = isContent ? item.content!.rating ?? 0 : 0;
  const displayRatingCount = isContent ? item.content!.rating_count ?? 0 : 0;

  // CTA: for content banners, link to watch page; for custom, use custom_link_url or cta_link
  const ctaLink = isContent
    ? `/watch/${item.content!.id}`
    : item.custom_link_url || item.cta_link || "#";
  const ctaText = item.cta_text || (isContent ? "Play" : "Learn More");

  return (
    <section
      className="relative w-full h-[65vh] sm:h-[70vh] min-h-[420px] max-h-[720px] overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Backdrop Image — crossfade */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`bg-${item.id}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt=""
              className="w-full h-full object-cover object-center"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-cinema-surface via-cinema-elevated to-cinema-bg" />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Gradient overlays */}
      <div className="absolute inset-0 cinema-gradient-bottom z-[1]" />
      <div className="absolute inset-0 cinema-gradient-right z-[1]" />
      <div className="absolute inset-0 bg-black/20 z-[1]" />

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-end h-full max-w-[1400px] mx-auto px-5 md:px-8 lg:px-12 pb-14 sm:pb-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={`content-${item.id}`}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
            className="max-w-2xl"
          >
            {/* Type Badge (content only) */}
            {displayType && (
              <Badge className="w-fit mb-3 rounded-lg bg-cinema-red text-white border-none text-[11px] font-semibold uppercase tracking-[0.08em]">
                {TYPE_LABELS[displayType]}
              </Badge>
            )}

            {/* Custom banner indicator */}
            {!isContent && (
              <Badge className="w-fit mb-3 rounded-lg bg-white/10 text-white border border-white/20 text-[11px] font-semibold uppercase tracking-wider gap-1">
                <ExternalLink className="w-3 h-3" />
                Promotion
              </Badge>
            )}

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight tracking-tight mb-3">
              {displayTitle}
            </h1>

            {/* Meta row */}
            <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-[13px] text-white/60 mb-3">
              {displayYear && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {displayYear}
                </span>
              )}
              {displayRating > 0 && (
                <span className="flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-cinema-gold fill-cinema-gold" />
                  {displayRating.toFixed(1)}
                  {displayRatingCount > 0 && (
                    <span className="text-white/40 text-xs">
                      ({displayRatingCount.toLocaleString()})
                    </span>
                  )}
                </span>
              )}
            </div>

            {/* Subtitle / Synopsis */}
            {displaySubtitle && (
              <p className="text-sm sm:text-[15px] text-white/50 leading-relaxed mb-6 line-clamp-2 sm:line-clamp-3">
                {displaySubtitle}
              </p>
            )}

            {/* CTA Buttons */}
            <div className="flex items-center gap-3">
              {isContent ? (
                <>
                  <Button
                    asChild
                    size="lg"
                    className="rounded-xl shadow-xl shadow-cinema-red/30 bg-cinema-red hover:bg-cinema-red-hover text-white glow-red font-semibold"
                  >
                    <Link href={ctaLink}>
                      <Play className="w-5 h-5 mr-2" />
                      Play
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    className="rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/15 font-medium"
                  >
                    <Link href={ctaLink}>
                      <Info className="w-5 h-5 mr-2" />
                      More Info
                    </Link>
                  </Button>
                </>
              ) : (
                <Button
                  asChild
                  size="lg"
                  className="rounded-xl shadow-xl shadow-cinema-red/30 bg-cinema-red hover:bg-cinema-red-hover text-white glow-red font-semibold"
                >
                  <Link href={ctaLink}>
                    {ctaText}
                  </Link>
                </Button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dot Indicators */}
      {items.length > 1 && (
        <div className="absolute bottom-7 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2.5">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`rounded-full transition-all duration-300 ${
                i === current
                  ? "w-8 h-[5px] bg-cinema-red"
                  : "w-4 h-[5px] bg-white/25 hover:bg-white/40"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}