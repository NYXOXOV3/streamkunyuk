"use client";

/**
 * ContentCard
 *
 * Reusable VERTICAL POSTER card for content rows (home carousels, browse grid).
 * Uses Framer Motion for staggered fade-in and hover scale.
 *
 * Features:
 *   - 2:3 portrait aspect ratio with poster image (fallback to backdrop)
 *   - Hover: scale up, gradient overlay, centered Play button
 *   - Premium badge (gold) if content.is_premium_only
 *   - Rating badge (bottom-left) if rating > 0
 *   - Year + type subtitle
 */

import { motion } from "framer-motion";
import Link from "next/link";
import { Play, Crown, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Content } from "@/lib/supabase/types";
import { TYPE_LABELS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ContentCardProps {
  content: Content;
  index?: number;
}

export function ContentCard({ content, index = 0 }: ContentCardProps) {
  // Prefer poster_url for vertical cards, fallback to backdrop_url
  const imageUrl = content.poster_url || content.backdrop_url;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: index * 0.04, duration: 0.4, ease: "easeOut" }}
    >
      <Link href={`/watch/${content.id}`} className="block group">
        {/* Image Container — VERTICAL poster (2:3 portrait) */}
        <div className="relative aspect-[2/3] rounded-md overflow-hidden bg-cinema-elevated">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={content.title}
              loading={index < 5 ? "eager" : "lazy"}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Play className="w-8 h-8 text-muted-foreground/20" />
            </div>
          )}

          {/* Bottom gradient (always visible for readability) */}
          <div className="absolute inset-x-0 bottom-0 h-2/5 cinema-gradient-card pointer-events-none" />

          {/* Premium Badge */}
          {content.is_premium_only && (
            <Badge className="absolute top-2 right-2 bg-cinema-gold/90 text-black text-[10px] font-semibold border-none gap-0.5">
              <Crown className="w-2.5 h-2.5" />
              Premium
            </Badge>
          )}

          {/* Rating Badge */}
          {content.rating > 0 && (
            <Badge
              variant="outline"
              className="absolute bottom-2 left-2 bg-black/60 text-white border-white/10 text-[10px] gap-0.5 backdrop-blur-sm"
            >
              <Star className="w-2.5 h-2.5 text-cinema-gold fill-cinema-gold" />
              {content.rating.toFixed(1)}
            </Badge>
          )}

          {/* Hover Overlay + Play Button */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute inset-0 bg-black/40" />
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              whileHover={{ scale: 1.05 }}
              className="relative z-10 w-11 h-11 rounded-full bg-cinema-red/95 flex items-center justify-center shadow-lg shadow-cinema-red/30"
            >
              <Play className="w-5 h-5 text-white ml-0.5" />
            </motion.div>
          </div>
        </div>

        {/* Title & Meta */}
        <div className="mt-2 px-0.5">
          <p className="text-sm font-medium text-foreground truncate group-hover:text-cinema-red transition-colors">
            {content.title}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {content.release_year && <span>{content.release_year}</span>}
            {content.release_year && " · "}
            <span>{TYPE_LABELS[content.type]}</span>
          </p>
        </div>
      </Link>
    </motion.div>
  );
}