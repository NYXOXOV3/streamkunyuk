"use client";

/**
 * HeroBanner
 *
 * Full-width cinematic hero section for the home page.
 * Auto-cycles through featured content items with Framer Motion transitions.
 *
 * Features:
 *   - Full backdrop image with gradient overlays (bottom + right)
 *   - Auto-advance every 8 seconds with dot indicators
 *   - AnimatePresence for crossfade between items
 *   - Type badge, title, year, rating, synopsis
 *   - "Play" (red, glow) and "More Info" (glass) CTA buttons
 *   - Pauses auto-cycle on hover
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Play, Info, Star, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Content } from "@/lib/supabase/types";
import { TYPE_LABELS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface HeroBannerProps {
  items: Content[];
}

export function HeroBanner({ items }: HeroBannerProps) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = useCallback(
    (index: number) => {
      setCurrent((index + items.length) % items.length);
    },
    [items.length],
  );

  // Auto-cycle — current not in deps because we use callback form
  useEffect(() => {
    if (items.length <= 1 || isPaused) return;

    intervalRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % items.length);
    }, 8000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [items.length, isPaused]);

  const item = items[current];

  if (!item) {
    // Fallback when no featured content
    return (
      <section className="relative w-full h-[60vh] min-h-[400px] bg-gradient-to-b from-cinema-surface to-cinema-bg flex items-center justify-center">
        <p className="text-muted-foreground text-sm">No featured content</p>
      </section>
    );
  }

  const imageUrl = item.backdrop_url || item.poster_url;

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
      {/* Extra darkening for text readability */}
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
            {/* Type Badge */}
            <Badge className="w-fit mb-3 rounded-lg bg-cinema-red text-white border-none text-[11px] font-semibold uppercase tracking-[0.08em]">
              {TYPE_LABELS[item.type]}
            </Badge>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight tracking-tight mb-3">
              {item.title}
            </h1>

            {/* Meta row */}
            <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-[13px] text-white/60 mb-3">
              {item.release_year && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {item.release_year}
                </span>
              )}
              {item.rating > 0 && (
                <span className="flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-cinema-gold fill-cinema-gold" />
                  {item.rating.toFixed(1)}
                  {item.rating_count > 0 && (
                    <span className="text-white/40 text-xs">
                      ({item.rating_count.toLocaleString()})
                    </span>
                  )}
                </span>
              )}
            </div>

            {/* Synopsis */}
            {item.synopsis && (
              <p className="text-sm sm:text-[15px] text-white/50 leading-relaxed mb-6 line-clamp-2 sm:line-clamp-3">
                {item.synopsis}
              </p>
            )}

            {/* CTA Buttons */}
            <div className="flex items-center gap-3">
              <Button
                asChild
                size="lg"
                className="rounded-xl shadow-xl shadow-cinema-red/30 bg-cinema-red hover:bg-cinema-red-hover text-white glow-red font-semibold"
              >
                <Link href={`/watch/${item.id}`}>
                  <Play className="w-5 h-5 mr-2" />
                  Play
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                className="rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/15 font-medium"
              >
                <Link href={`/watch/${item.id}`}>
                  <Info className="w-5 h-5 mr-2" />
                  More Info
                </Link>
              </Button>
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