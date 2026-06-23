"use client";

/**
 * ContentCarousel
 *
 * Horizontal scrollable content row with navigation arrows.
 * Uses native CSS scroll-snap for smooth scrolling.
 * Arrows appear on hover (group/section pattern).
 *
 * Features:
 *   - Section title + optional "See All" link
 *   - Left/right gradient-fade arrows on hover
 *   - Each card has a fixed width per breakpoint
 *   - Hidden scrollbar (scrollbar-hide utility)
 */

import { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ContentCard } from "./ContentCard";
import type { Content } from "@/lib/supabase/types";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ContentCarouselProps {
  title: string;
  contents: Content[];
  seeAllHref?: string;
}

export function ContentCarousel({
  title,
  contents,
  seeAllHref,
}: ContentCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Don't render empty carousels
  if (!contents.length) return null;

  function scroll(direction: "left" | "right") {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.72;
    el.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  }

  return (
    <section className="relative group/section py-5 first:pt-2">
      {/* Title row */}
      <div className="flex items-center justify-between mb-3.5 px-6 md:px-10 lg:px-0">
        <h2 className="text-sm sm:text-base font-semibold text-foreground tracking-tight">
          {title}
        </h2>
        {seeAllHref && (
          <Link
            href={seeAllHref}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-200"
          >
            See All →
          </Link>
        )}
      </div>

      {/* Scrollable row */}
      <div className="relative">
        <div
          ref={scrollRef}
          className="flex gap-3.5 overflow-x-auto scrollbar-hide scroll-smooth px-6 md:px-10 lg:px-0"
        >
          {contents.map((content, i) => (
            <div
              key={content.id}
              className="shrink-0 w-[120px] sm:w-[150px] md:w-[165px] lg:w-[175px] xl:w-[190px]"
            >
              <ContentCard content={content} index={i} />
            </div>
          ))}
        </div>

        {/* Left arrow */}
        <button
          onClick={() => scroll("left")}
          aria-label="Scroll left"
          className="absolute left-0 top-0 bottom-0 w-12 sm:w-16 bg-gradient-to-r from-cinema-bg via-cinema-bg/80 to-transparent flex items-center justify-start pl-2 opacity-0 group-hover/section:opacity-100 transition-opacity duration-300 z-10"
        >
          <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors">
            <ChevronLeft className="w-5 h-5 text-white" />
          </div>
        </button>

        {/* Right arrow */}
        <button
          onClick={() => scroll("right")}
          aria-label="Scroll right"
          className="absolute right-0 top-0 bottom-0 w-12 sm:w-16 bg-gradient-to-l from-cinema-bg via-cinema-bg/80 to-transparent flex items-center justify-end pr-2 opacity-0 group-hover/section:opacity-100 transition-opacity duration-300 z-10"
        >
          <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors">
            <ChevronRight className="w-5 h-5 text-white" />
          </div>
        </button>
      </div>
    </section>
  );
}