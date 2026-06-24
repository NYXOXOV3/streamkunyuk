"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Content, Episode, Category } from "@/lib/supabase/types";
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
  Loader2,
} from "lucide-react";
import { TYPE_LABELS } from "@/lib/constants";

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
  activeProvider: string;
}

interface PlayerClientProps {
  data: PlayerPageData;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PlayerClient({ data }: PlayerClientProps) {
  const { episode, content, episodes, categories, isSubscriber, isAuthenticated, embedUrl, isIframe } = data;
  const router = useRouter();
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [directUrl, setDirectUrl] = useState<string | null>(null);
  const [isLoadingDirect, setIsLoadingDirect] = useState(false);
  const [directError, setDirectError] = useState<string | null>(null);

  // Check if this is Melolo (uses our API proxy, not iframe)
  const isMelolo = !isIframe && embedUrl?.startsWith("/api/melolo/");

  // Fetch Melolo direct stream URL
  useEffect(() => {
    if (!isMelolo || !embedUrl) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDirectUrl(null);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDirectError(null);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoadingDirect(true);

    fetch(embedUrl)
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        if (json.url) {
          setDirectUrl(json.url);
        } else {
          setDirectError(json.error || "No stream URL available");
        }
      })
      .catch((err) => {
        if (!cancelled) setDirectError(err.message);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingDirect(false);
      });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/set-state-in-effect
  }, [isMelolo, embedUrl]);

  // Derived
  const currentEpIndex = episodes.findIndex((e) => e.id === episode.id);
  const prevEpisode = currentEpIndex > 0 ? episodes[currentEpIndex - 1] : null;
  const nextEpisode = currentEpIndex < episodes.length - 1 ? episodes[currentEpIndex + 1] : null;
  const TypeIcon = content.type === "movie" ? Film : Tv;
  const isLocked = episode.is_locked && !isSubscriber && !episode.is_free_trial;

  // Episode navigation
  const goToEpisode = useCallback(
    (ep: Episode) => {
      if (ep.id === episode.id) return;
      router.push(`/watch/${content.id}/${ep.id}`);
    },
    [router, content.id, episode.id],
  );

  return (
    <div className="min-h-screen bg-cinema-bg">
      {/* ===================================================================
          PLAYER SECTION — iframe or locked overlay
          =================================================================== */}
      <div className="relative w-full bg-black">
        <div className="w-full aspect-video max-h-[70vh] mx-auto">
          {isLocked ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-black/95">
              <div className="w-20 h-20 rounded-full bg-cinema-gold/20 flex items-center justify-center mb-4">
                <Lock className="w-10 h-10 text-cinema-gold" />
              </div>
              <h2 className="text-2xl font-bold text-white">Premium Episode</h2>
              <p className="text-white/60 mt-2 max-w-md text-center">
                This episode requires an active subscription.
              </p>
              {isAuthenticated ? (
                <Link
                  href="/profile/subscription"
                  className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-cinema-gold hover:bg-cinema-gold/80 text-black font-semibold transition-colors shadow-lg shadow-cinema-gold/20"
                >
                  <Crown className="w-5 h-5" />
                  Subscribe to Watch
                </Link>
              ) : (
                <Link
                  href="/auth/login"
                  className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-cinema-gold hover:bg-cinema-gold/80 text-black font-semibold transition-colors shadow-lg shadow-cinema-gold/20"
                >
                  <Crown className="w-5 h-5" />
                  Sign In to Subscribe
                </Link>
              )}
            </div>
          ) : isMelolo ? (
            <div className="relative w-full h-full bg-black">
              {isLoadingDirect && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <Loader2 className="w-10 h-10 text-white/60 animate-spin" />
                </div>
              )}
              {directError && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <div className="text-center">
                    <p className="text-white/60 text-sm">Video unavailable</p>
                    <p className="text-white/40 text-xs mt-1">{directError}</p>
                  </div>
                </div>
              )}
              {directUrl && (
                <video
                  key={directUrl}
                  src={directUrl}
                  className="w-full h-full"
                  controls
                  autoPlay
                  playsInline
                  onLoadStart={() => setIsLoadingDirect(false)}
                />
              )}
              {!isLoadingDirect && !directUrl && !directError && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-white/60">Loading stream...</p>
                </div>
              )}
            </div>
          ) : isIframe && embedUrl ? (
            <div className="relative w-full h-full">
              {!iframeLoaded && (
                <div className="absolute inset-0 flex items-center justify-center z-10 bg-black">
                  <Loader2 className="w-10 h-10 text-white/60 animate-spin" />
                </div>
              )}
              <iframe
                src={embedUrl}
                className="w-full h-full border-0"
                allowFullScreen
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                referrerPolicy="no-referrer"
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-presentation allow-top-navigation"
                onLoad={() => setIframeLoaded(true)}
              />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/60">
              <p>No video source available</p>
            </div>
          )}
        </div>

        {/* Back button overlay */}
        <Link
          href={`/watch/${content.id}`}
          className="absolute top-3 left-3 z-20 p-2.5 rounded-xl bg-black/50 backdrop-blur-sm border border-white/10 text-white/80 hover:text-white hover:bg-black/70 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
      </div>

      {/* ===================================================================
          CONTENT INFO — scrollable below player
          =================================================================== */}
      <div className="max-w-[1400px] mx-auto px-5 md:px-8 lg:px-12 py-6 space-y-6">
        {/* Title + Meta */}
        <div className="pt-2">
          <Link
            href={`/watch/${content.id}`}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {content.title}
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground mt-1">
            {episode.title || `Episode ${episode.episode_number}`}
          </h1>

          <div className="flex items-center flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
            <Badge className="rounded-lg bg-cinema-red text-white border-none text-[11px] font-semibold uppercase tracking-wider">
              <TypeIcon className="w-3 h-3 mr-1" />
              {TYPE_LABELS[content.type]}
            </Badge>
            <span className="flex items-center gap-1.5">
              <span className="font-mono text-cinema-gold">E{episode.episode_number}</span>
            </span>
            {episode.runtime_seconds && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {formatTime(episode.runtime_seconds)}
              </span>
            )}
            {content.rating > 0 && (
              <span className="flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-cinema-gold fill-cinema-gold" />
                {content.rating.toFixed(1)}
              </span>
            )}
            {content.release_year && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {content.release_year}
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
                  className="rounded-lg border-cinema-border text-[11px] text-muted-foreground cursor-default"
                >
                  {cat.name}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Synopsis */}
        {episode.synopsis && (
          <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
            {episode.synopsis}
          </p>
        )}

        {/* Prev / Next buttons */}
        {(prevEpisode || nextEpisode) && (
          <div className="flex items-center gap-3">
            {prevEpisode ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToEpisode(prevEpisode)}
                className="rounded-xl border-cinema-border text-xs"
              >
                ← Previous Episode
              </Button>
            ) : (
              <div className="w-36" />
            )}
            {nextEpisode && !nextEpisode.is_locked && (
              <Button
                size="sm"
                onClick={() => goToEpisode(nextEpisode)}
                className="rounded-xl bg-cinema-red hover:bg-cinema-red-hover text-white text-xs"
              >
                Next Episode →
              </Button>
            )}
          </div>
        )}

        {/* Episode List */}
        {episodes.length > 1 && (
          <div className="space-y-3 pb-8">
            <h2 className="text-lg font-semibold text-foreground">
              All Episodes
              <span className="text-sm font-normal text-muted-foreground ml-2">
                {episodes.length}
              </span>
            </h2>
            <div className="max-h-[400px] overflow-y-auto rounded-xl">
              <div className="space-y-1.5 pr-1">
                {episodes.map((ep) => {
                  const isActive = ep.id === episode.id;
                  const epLocked = ep.is_locked && !isSubscriber && !ep.is_free_trial;

                  return (
                    <button
                      key={ep.id}
                      onClick={() => !epLocked && goToEpisode(ep)}
                      disabled={epLocked}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors group ${
                        isActive
                          ? "bg-cinema-red/10 border border-cinema-red/25"
                          : epLocked
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:bg-cinema-surface border border-transparent"
                      }`}
                    >
                      {/* Thumbnail */}
                      <div className="relative flex-shrink-0 w-[120px] aspect-video rounded-lg overflow-hidden bg-cinema-surface">
                        {ep.thumbnail_url ? (
                          <img
                            src={ep.thumbnail_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                            <Play className="w-5 h-5" />
                          </div>
                        )}
                        {ep.runtime_seconds && (
                          <span className="absolute bottom-1 right-1 text-[10px] font-medium text-white bg-black/70 px-1.5 py-0.5 rounded">
                            {formatTime(ep.runtime_seconds)}
                          </span>
                        )}
                        {isActive && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <div className="flex items-center gap-0.5">
                              <span className="w-0.5 h-3 bg-cinema-red rounded-full animate-pulse" />
                              <span className="w-0.5 h-4 bg-cinema-red rounded-full animate-pulse [animation-delay:0.15s]" />
                              <span className="w-0.5 h-2 bg-cinema-red rounded-full animate-pulse [animation-delay:0.3s]" />
                            </div>
                          </div>
                        )}
                        {epLocked && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Lock className="w-4 h-4 text-cinema-gold" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-muted-foreground">
                            E{ep.episode_number}
                          </span>
                          {ep.is_free_trial && !ep.is_locked && (
                            <span className="text-[10px] font-semibold text-cinema-gold bg-cinema-gold/10 px-1.5 py-0.5 rounded">
                              FREE
                            </span>
                          )}
                        </div>
                        <p
                          className={`text-sm font-medium mt-0.5 truncate ${
                            isActive ? "text-cinema-red" : "text-foreground"
                          }`}
                        >
                          {ep.title || `Episode ${ep.episode_number}`}
                        </p>
                        {ep.synopsis && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {ep.synopsis}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Content synopsis (if episode has no synopsis) */}
        {!episode.synopsis && content.synopsis && (
          <div className="pt-2">
            <h3 className="text-sm font-semibold text-foreground mb-2">About {content.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
              {content.synopsis}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}