"use client";

/**
 * EpisodeGrid
 *
 * Episode list/grid for the Content Detail page.
 * Implements the paywall access control UI:
 *
 *   - Free episodes: normal "Play" button
 *   - Locked + user IS subscriber: normal "Play" button
 *   - Locked + user NOT subscriber: lock overlay + "Premium" badge
 *   - is_free_trial: "Free Trial" badge, always playable
 *
 * Also includes a PremiumUpgradeDialog that triggers when
 * a locked episode is clicked by a non-subscriber.
 */

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Play, Lock, Crown, Gift, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Episode, ContentType } from "@/lib/supabase/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDuration(seconds: number | null): string {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function canPlayEpisode(
  episode: Episode,
  contentPremiumOnly: boolean,
  isSubscriber: boolean,
): boolean {
  // Free trial episodes are always playable
  if (episode.is_free_trial) return true;
  // Unlocked episodes are always playable
  if (!episode.is_locked) return true;
  // Locked but user has subscription
  if (isSubscriber) return true;
  // Locked + content-level premium + no subscription → blocked
  return false;
}

// ---------------------------------------------------------------------------
// Premium Upgrade Dialog
// ---------------------------------------------------------------------------

function PremiumUpgradeDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-cinema-surface border-cinema-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Crown className="w-5 h-5 text-cinema-gold" />
            Premium Episode
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            This episode is exclusive to subscribers. Upgrade to unlock
            all premium content and enjoy ad-free streaming.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-cinema-elevated rounded-lg p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-cinema-gold/10 flex items-center justify-center shrink-0 mt-0.5">
              <Crown className="w-4 h-4 text-cinema-gold" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Unlimited Access
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Stream all episodes, movies, and exclusive content.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-cinema-gold/10 flex items-center justify-center shrink-0 mt-0.5">
              <Gift className="w-4 h-4 text-cinema-gold" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Free Trial Episodes
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Enjoy select episodes for free before subscribing.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-cinema-border text-sm"
          >
            Maybe Later
          </Button>
          <Button
            asChild
            className="bg-cinema-gold hover:bg-cinema-gold/80 text-black font-semibold text-sm"
          >
            <Link href="/profile/subscription">
              <Crown className="w-4 h-4 mr-1.5" />
              Upgrade Now
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Episode Card
// ---------------------------------------------------------------------------

interface EpisodeCardProps {
  episode: Episode;
  contentId: string;
  contentType: ContentType;
  contentPremiumOnly: boolean;
  isSubscriber: boolean;
}

function EpisodeCard({
  episode,
  contentId,
  contentType,
  contentPremiumOnly,
  isSubscriber,
}: EpisodeCardProps) {
  const [showPremium, setShowPremium] = useState(false);
  const playable = canPlayEpisode(episode, contentPremiumOnly, isSubscriber);
  const isLocked = episode.is_locked && !isSubscriber && !episode.is_free_trial;
  const imageUrl = episode.thumbnail_url;

  function handlePlay() {
    if (!playable) {
      setShowPremium(true);
      return;
    }
    // Navigate to player
    window.location.href = `/watch/${contentId}/${episode.id}`;
  }

  return (
    <>
      <motion.button
        onClick={handlePlay}
        className="group/ep w-full text-left rounded-lg overflow-hidden bg-cinema-surface border border-cinema-border hover:border-cinema-muted/30 transition-all duration-200"
        whileHover={{ scale: 1.015 }}
        whileTap={{ scale: 0.985 }}
      >
        <div className="flex gap-3 p-2.5">
          {/* Thumbnail */}
          <div className="relative w-[140px] sm:w-[160px] shrink-0 aspect-video rounded overflow-hidden bg-cinema-elevated">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Play className="w-6 h-6 text-muted-foreground/20" />
              </div>
            )}

            {/* Episode number badge */}
            <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/70 text-[10px] font-bold text-white backdrop-blur-sm">
              E{episode.episode_number}
            </div>

            {/* Runtime badge */}
            {episode.runtime_seconds && episode.runtime_seconds > 0 && (
              <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/70 text-[10px] text-white/80 backdrop-blur-sm flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" />
                {formatDuration(episode.runtime_seconds)}
              </div>
            )}

            {/* Status badges (top-right) */}
            <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
              {episode.is_free_trial && (
                <Badge className="text-[9px] bg-cinema-gold/90 text-black border-none gap-0.5 px-1.5 py-0">
                  <Gift className="w-2.5 h-2.5" />
                  Free Trial
                </Badge>
              )}
              {isLocked && (
                <Badge className="text-[9px] bg-black/70 text-cinema-gold border-none gap-0.5 px-1.5 py-0 backdrop-blur-sm">
                  <Lock className="w-2.5 h-2.5" />
                  Premium
                </Badge>
              )}
            </div>

            {/* Lock overlay for locked episodes */}
            {isLocked && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-[2px] transition-opacity">
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-10 h-10 rounded-full bg-cinema-gold/20 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-cinema-gold" />
                  </div>
                </div>
              </div>
            )}

            {/* Play overlay for playable episodes (on hover) */}
            {playable && (
              <div className="absolute inset-0 bg-black/0 group-hover/ep:bg-black/40 transition-all duration-300 flex items-center justify-center">
                <div className="w-9 h-9 rounded-full bg-cinema-red/90 flex items-center justify-center opacity-0 group-hover/ep:opacity-100 transform scale-75 group-hover/ep:scale-100 transition-all duration-300 shadow-lg shadow-cinema-red/30">
                  <Play className="w-4 h-4 text-white ml-0.5" />
                </div>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 py-0.5">
            <h4 className="text-sm font-medium text-foreground truncate">
              {episode.title || `Episode ${episode.episode_number}`}
            </h4>
            {episode.synopsis && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                {episode.synopsis}
              </p>
            )}
            {isLocked && (
              <p className="text-xs text-cinema-gold mt-2 font-medium flex items-center gap-1">
                <Crown className="w-3 h-3" />
                Subscribe to unlock
              </p>
            )}
          </div>
        </div>
      </motion.button>

      <PremiumUpgradeDialog open={showPremium} onOpenChange={setShowPremium} />
    </>
  );
}

// ---------------------------------------------------------------------------
// EpisodeGrid — main export
// ---------------------------------------------------------------------------

interface EpisodeGridProps {
  episodes: Episode[];
  contentId: string;
  contentType: ContentType;
  contentPremiumOnly: boolean;
  isSubscriber: boolean;
}

export function EpisodeGrid({
  episodes,
  contentId,
  contentType,
  contentPremiumOnly,
  isSubscriber,
}: EpisodeGridProps) {
  const [showAll, setShowAll] = useState(false);
  const INITIAL_COUNT = 6;

  if (episodes.length === 0) return null;

  const displayEpisodes = showAll ? episodes : episodes.slice(0, INITIAL_COUNT);
  const hasMore = episodes.length > INITIAL_COUNT;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {displayEpisodes.map((episode, i) => (
          <EpisodeCard
            key={episode.id}
            episode={episode}
            contentId={contentId}
            contentType={contentType}
            contentPremiumOnly={contentPremiumOnly}
            isSubscriber={isSubscriber}
          />
        ))}
      </div>

      {/* Show More / Show Less toggle */}
      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            variant="ghost"
            onClick={() => setShowAll(!showAll)}
            className="text-muted-foreground hover:text-foreground text-sm gap-1.5"
          >
            {showAll ? (
              <>
                Show Less <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                Show All {episodes.length} Episodes{" "}
                <ChevronDown className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}