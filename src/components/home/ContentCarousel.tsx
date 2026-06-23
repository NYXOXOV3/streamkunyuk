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
    <section className="relative group/section py-8 first:pt-4">
      {/* Title row */}
      <div className="flex items-center justify-between mb-3.5 px-5 md:px-8 lg:px-0">
        <h2 className="text-base sm:text-[17px] font-semibold text-foreground tracking-tight">
          {title}
        </h2>
        {seeAllHref && (
          <Link
            href={seeAllHref}
            className="text-xs font-medium text-muted-foreground hover:text-cinema-red transition-colors group/link"
          >
            See All{" "}
            <span className="group-hover/link:translate-x-0.5 transition-transform inline-block">
              →
            </span>
          </Link>
        )}
      </div>

      {/* Scrollable row */}
      <div className="relative">
        <div
          ref={scrollRef}
          className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide scroll-smooth px-5 md:px-8 lg:px-0"
        >
          {contents.map((content, i) => (
            <div
              key={content.id}
              className="shrink-0 w-[130px] sm:w-[158px] md:w-[172px] lg:w-[182px] xl:w-[200px]"
            >
              <ContentCard content={content} index={i} />
            </div>
          ))}
        </div>

        {/* Left arrow */}
        <button
          onClick={() => scroll("left")}
          aria-label="Scroll left"
          className="absolute left-0 top-0 bottom-0 w-10 sm:w-14 bg-gradient-to-r from-cinema-bg via-cinema-bg/80 to-transparent flex items-center justify-start pl-2 opacity-0 group-hover/section:opacity-100 transition-opacity duration-300 z-10"
        >
          <div className="w-10 h-10 rounded-full bg-white/[0.08] hover:bg-white/[0.15] backdrop-blur-sm border border-white/[0.08] flex items-center justify-center transition-colors">
            <ChevronLeft className="w-4 h-4 text-white" />
          </div>
        </button>

        {/* Right arrow */}
        <button
          onClick={() => scroll("right")}
          aria-label="Scroll right"
          className="absolute right-0 top-0 bottom-0 w-10 sm:w-14 bg-gradient-to-l from-cinema-bg via-cinema-bg/80 to-transparent flex items-center justify-end pr-2 opacity-0 group-hover/section:opacity-100 transition-opacity duration-300 z-10"
        >
          <div className="w-10 h-10 rounded-full bg-white/[0.08] hover:bg-white/[0.15] backdrop-blur-sm border border-white/[0.08] flex items-center justify-center transition-colors">
            <ChevronRight className="w-4 h-4 text-white" />
          </div>
        </button>
      </div>
    </section>
  );
}