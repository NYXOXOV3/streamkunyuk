"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Hls from "hls.js";
import { usePlayerStore } from "@/lib/stores/playerStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Content, Episode } from "@/lib/supabase/types";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  List,
  X,
  Lock,
  Crown,
  Loader2,
} from "lucide-react";

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
  const { episode, content, episodes, isSubscriber, isAuthenticated } = data;
  const router = useRouter();

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const hideControlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  // Player store
  const {
    setEpisode: storeSetEpisode,
    play: storePlay,
    pause: storePause,
    updateTime: storeUpdateTime,
    setDuration: storeSetDuration,
    setFullscreen: storeSetFullscreen,
    setVolume: storeSetVolume,
    setMuted: storeSetMuted,
  } = usePlayerStore();

  // Detect vidapi embed URL — use iframe instead of native video
  const videoUrl = episode.video_url || episode.video_url_backup;
  const isVidapiEmbed = !!videoUrl && videoUrl.includes("vidapi.qzz.io");

  // Local state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeLocal] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showEpisodeList, setShowEpisodeList] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(!isVidapiEmbed);
  const [seekProgress, setSeekProgress] = useState<number | null>(null);

  // Derived
  const currentEpIndex = episodes.findIndex((e) => e.id === episode.id);
  const prevEpisode = currentEpIndex > 0 ? episodes[currentEpIndex - 1] : null;
  const nextEpisode =
    currentEpIndex < episodes.length - 1 ? episodes[currentEpIndex + 1] : null;

  // Premium lock: episode is locked and user is not a subscriber (and not free trial)
  const isLocked =
    episode.is_locked && !isSubscriber && !episode.is_free_trial;

  // ---------------------------------------------------------------------------
  // Video init: HLS.js or native
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (isLocked || isVidapiEmbed) return;

    const video = videoRef.current;
    if (!video) return;

    const videoUrl = episode.video_url || episode.video_url_backup;
    if (!videoUrl) return;

    // Clean up previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (videoUrl.endsWith(".m3u8") && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hlsRef.current = hls;
      hls.loadSource(videoUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        // Ready to play — don't auto-play
      });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          // Try backup URL on fatal error
          const backupUrl = episode.video_url_backup;
          if (backupUrl && backupUrl !== videoUrl) {
            hls.loadSource(backupUrl);
          } else {
            hls.destroy();
            hlsRef.current = null;
          }
        }
      });
    } else if (
      videoUrl.endsWith(".m3u8") &&
      video.canPlayType("application/vnd.apple.mpegurl")
    ) {
      // Safari native HLS
      video.src = videoUrl;
    } else {
      // Direct video URL (mp4, webm, etc.)
      video.src = videoUrl;
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [episode.video_url, episode.video_url_backup, isLocked, isVidapiEmbed]);

  // ---------------------------------------------------------------------------
  // Store sync on mount
  // ---------------------------------------------------------------------------

  useEffect(() => {
    storeSetEpisode({
      contentId: content.id,
      episodeId: episode.id,
      episodeNumber: episode.episode_number,
      contentTitle: content.title,
    });
  }, [content.id, content.title, episode.id, episode.episode_number, storeSetEpisode]);

  // ---------------------------------------------------------------------------
  // Video event handlers
  // ---------------------------------------------------------------------------

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video || isLocked) return;

    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isLocked]);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const t = video.currentTime;
    setCurrentTime(t);
    storeUpdateTime(t);
  }, [storeUpdateTime]);

  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const d = video.duration;
    setDuration(d);
    storeSetDuration(d);
  }, [storeSetDuration]);

  // Start the auto-hide timer (call when playing starts or user moves mouse)
  const startHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
    }
    hideControlsTimerRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  }, []);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    storePlay();
    startHideTimer();
  }, [storePlay, startHideTimer]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
    storePause();
    setShowControls(true);
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
    }
  }, [storePause]);

  const handleWaiting = useCallback(() => setIsBuffering(true), []);
  const handleCanPlay = useCallback(() => setIsBuffering(false), []);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    storePause();
  }, [storePause]);

  // ---------------------------------------------------------------------------
  // Seek
  // ---------------------------------------------------------------------------

  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const video = videoRef.current;
      if (!video || !duration) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const time = ratio * duration;
      video.currentTime = time;
      setCurrentTime(time);
      storeUpdateTime(time);
    },
    [duration, storeUpdateTime]
  );

  const handleSeekHover = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      setSeekProgress(ratio * 100);
    },
    []
  );

  const handleSeekLeave = useCallback(() => {
    setSeekProgress(null);
  }, []);

  // ---------------------------------------------------------------------------
  // Volume
  // ---------------------------------------------------------------------------

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const newMuted = !video.muted;
    video.muted = newMuted;
    setIsMuted(newMuted);
    storeSetMuted(newMuted);
  }, [storeSetMuted]);

  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const video = videoRef.current;
      if (!video) return;
      const vol = parseFloat(e.target.value);
      video.volume = vol;
      setVolumeLocal(vol);
      storeSetVolume(vol);
      if (vol === 0) {
        video.muted = true;
        setIsMuted(true);
        storeSetMuted(true);
      } else if (video.muted) {
        video.muted = false;
        setIsMuted(false);
        storeSetMuted(false);
      }
    },
    [storeSetVolume, storeSetMuted]
  );

  // ---------------------------------------------------------------------------
  // Fullscreen
  // ---------------------------------------------------------------------------

  const toggleFullscreen = useCallback(async () => {
    const container = containerRef.current;
    if (!container) return;

    try {
      if (!document.fullscreenElement) {
        await container.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Fullscreen not supported or denied
    }
  }, []);

  useEffect(() => {
    const handleFsChange = () => {
      const fs = !!document.fullscreenElement;
      setIsFullscreen(fs);
      storeSetFullscreen(fs);
    };

    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, [storeSetFullscreen]);

  // ---------------------------------------------------------------------------
  // Controls visibility (fade in/out)
  // ---------------------------------------------------------------------------

  const handleMouseMove = useCallback(() => {
    startHideTimer();
  }, [startHideTimer]);

  const handleMouseLeave = useCallback(() => {
    if (isPlaying) {
      hideControlsTimerRef.current = setTimeout(() => {
        setShowControls(false);
      }, 1000);
    }
  }, [isPlaying]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (hideControlsTimerRef.current) {
        clearTimeout(hideControlsTimerRef.current);
      }
    };
  }, []);

  // For vidapi: auto-hide top bar after iframe loads so the player has full control
  useEffect(() => {
    if (isVidapiEmbed && iframeLoaded) {
      const timer = setTimeout(() => {
        setShowControls(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVidapiEmbed, iframeLoaded]);

  // ---------------------------------------------------------------------------
  // Keyboard shortcuts
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const video = videoRef.current;
      if (!video) return;

      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowLeft":
          e.preventDefault();
          video.currentTime = Math.max(0, video.currentTime - 10);
          break;
        case "ArrowRight":
          e.preventDefault();
          video.currentTime = Math.min(duration, video.currentTime + 10);
          break;
        case "ArrowUp":
          e.preventDefault();
          video.volume = Math.min(1, video.volume + 0.1);
          setVolumeLocal(video.volume);
          storeSetVolume(video.volume);
          break;
        case "ArrowDown":
          e.preventDefault();
          video.volume = Math.max(0, video.volume - 0.1);
          setVolumeLocal(video.volume);
          storeSetVolume(video.volume);
          break;
        case "f":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "m":
          e.preventDefault();
          toggleMute();
          break;
        case "Escape":
          if (showEpisodeList) {
            setShowEpisodeList(false);
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    togglePlay,
    toggleFullscreen,
    toggleMute,
    duration,
    showEpisodeList,
    storeSetVolume,
  ]);

  // ---------------------------------------------------------------------------
  // Episode navigation
  // ---------------------------------------------------------------------------

  const goToEpisode = useCallback(
    (ep: Episode) => {
      if (ep.id === episode.id) return;
      router.push(`/watch/${content.id}/${ep.id}`);
    },
    [router, content.id, episode.id]
  );

  // ---------------------------------------------------------------------------
  // Progress calculation
  // ---------------------------------------------------------------------------

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black flex"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Video Element or VidAPI iframe */}
      <div className="flex-1 relative">
        {isVidapiEmbed && !isLocked ? (
          <>
            {!iframeLoaded && (
              <div className="absolute inset-0 flex items-center justify-center z-10 bg-black">
                <Loader2 className="w-12 h-12 text-white/80 animate-spin" />
              </div>
            )}
            <iframe
              src={videoUrl}
              className="w-full h-full border-0"
              allowFullScreen
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              referrerPolicy="no-referrer"
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-presentation"
              onLoad={() => setIframeLoaded(true)}
            />
          </>
        ) : (
          <video
            ref={videoRef}
            className="w-full h-full object-contain bg-black cursor-pointer"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={handlePlay}
            onPause={handlePause}
            onWaiting={handleWaiting}
            onCanPlay={handleCanPlay}
            onEnded={handleEnded}
            onClick={togglePlay}
            playsInline
            preload="metadata"
          />
        )}

        {/* Buffering spinner (only for native video) */}
        {isBuffering && isPlaying && !isVidapiEmbed && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Loader2 className="w-12 h-12 text-white/80 animate-spin" />
          </div>
        )}

        {/* Premium Lock Overlay */}
        {isLocked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-30">
            <div className="flex flex-col items-center gap-4 text-center px-6">
              <div className="w-20 h-20 rounded-full bg-cinema-gold/20 flex items-center justify-center">
                <Lock className="w-10 h-10 text-cinema-gold" />
              </div>
              <h2 className="text-2xl font-bold text-white">
                Premium Episode
              </h2>
              <p className="text-muted-foreground max-w-md">
                This episode requires an active subscription. Subscribe now to
                unlock all premium content.
              </p>
              {isAuthenticated ? (
                <Link
                  href="/profile/subscription"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-cinema-gold hover:bg-cinema-gold/80 text-black font-semibold transition-colors shadow-lg shadow-cinema-gold/20"
                >
                  <Crown className="w-5 h-5" />
                  Subscribe to Watch
                </Link>
              ) : (
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-cinema-gold hover:bg-cinema-gold/80 text-black font-semibold transition-colors shadow-lg shadow-cinema-gold/20"
                >
                  <Crown className="w-5 h-5" />
                  Sign In to Subscribe
                </Link>
              )}
            </div>
          </div>
        )}

        {/* ================================================================
            CONTROLS OVERLAY (hidden for vidapi — it has its own)
            ================================================================ */}

        {/* Top bar — title + back + episode list toggle */}
        <div
          className={`absolute top-0 left-0 right-0 z-20 transition-opacity duration-300 ${
            isVidapiEmbed
              ? (showControls || showEpisodeList ? "opacity-100" : "opacity-0 pointer-events-none")
              : (showControls || !isPlaying ? "opacity-100" : "opacity-0 pointer-events-none")
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/30 to-transparent" />
          <div className="relative flex items-center justify-between px-4 py-4 md:px-8 md:py-6">
            <div className="flex items-center gap-3 min-w-0">
              {/* Back button */}
              <Link
                href={`/watch/${content.id}`}
                className="flex-shrink-0 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>

              {/* Episode info */}
              <div className="min-w-0">
                <p className="text-xs text-white/60 truncate">
                  {content.title}
                </p>
                <h1 className="text-sm sm:text-base md:text-lg font-semibold text-white truncate">
                  E{episode.episode_number}
                  {episode.title ? ` · ${episode.title}` : ""}
                </h1>
              </div>
            </div>

            {/* Episode list toggle */}
            <button
              onClick={() => setShowEpisodeList((v) => !v)}
              className={`flex-shrink-0 p-2.5 rounded-xl transition-colors ${
                showEpisodeList
                  ? "bg-cinema-red text-white"
                  : "bg-white/10 hover:bg-white/20 text-white"
              }`}
              aria-label="Toggle episode list"
            >
              {showEpisodeList ? (
                <X className="w-5 h-5" />
              ) : (
                <List className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Center — big play/pause button (only for native video, not vidapi iframe) */}
        {!isPlaying && !isLocked && !isVidapiEmbed && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 z-10 flex items-center justify-center group"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-cinema-red/90 hover:bg-cinema-red flex items-center justify-center transition-all group-hover:scale-110 glow-red">
              <Play className="w-7 h-7 sm:w-8 sm:h-8 text-white ml-1" />
            </div>
          </button>
        )}

        {/* Bottom controls bar (hidden for vidapi — it has its own) */}
        {!isVidapiEmbed && (
        <div
          className={`absolute bottom-0 left-0 right-0 z-20 transition-opacity duration-300 ${
            showControls || !isPlaying ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          <div className="relative px-4 pb-4 md:px-8 md:pb-6 space-y-2">
            {/* Seek bar */}
            <div
              className="group relative h-1.5 cursor-pointer"
              onClick={handleSeek}
              onMouseMove={handleSeekHover}
              onMouseLeave={handleSeekLeave}
            >
              {/* Track background */}
              <div className="absolute inset-0 rounded-full bg-white/20" />
              {/* Progress */}
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-cinema-red transition-[width] duration-100"
                style={{ width: `${progressPercent}%` }}
              />
              {/* Hover preview line */}
              {seekProgress !== null && (
                <div
                  className="absolute inset-y-0 left-0 bg-white/40 rounded-full transition-[width] duration-75"
                  style={{ width: `${seekProgress}%` }}
                />
              )}
              {/* Scrubber dot */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-cinema-red opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                style={{ left: `calc(${progressPercent}% - 7px)` }}
              />
            </div>

            {/* Controls row */}
            <div className="flex items-center gap-2 md:gap-4">
              {/* Play/Pause */}
              <button
                onClick={togglePlay}
                className="p-1.5 text-white hover:text-cinema-red transition-colors"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 md:w-6 md:h-6" />
                ) : (
                  <Play className="w-5 h-5 md:w-6 md:h-6" />
                )}
              </button>

              {/* Previous episode */}
              {prevEpisode && (
                <button
                  onClick={() => goToEpisode(prevEpisode)}
                  className="p-1.5 text-white/70 hover:text-white transition-colors"
                  aria-label="Previous episode"
                >
                  <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                </button>
              )}

              {/* Next episode */}
              {nextEpisode && (
                <button
                  onClick={() => goToEpisode(nextEpisode)}
                  className="p-1.5 text-white/70 hover:text-white transition-colors"
                  aria-label="Next episode"
                >
                  <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                </button>
              )}

              {/* Time display */}
              <span className="text-xs md:text-sm text-white/80 font-mono tabular-nums select-none">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Volume control */}
              <div className="flex items-center gap-1.5 group/vol">
                <button
                  onClick={toggleMute}
                  className="p-1.5 text-white/80 hover:text-white transition-colors"
                  aria-label={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-5 h-5" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-0 group-hover/vol:w-20 md:w-0 md:group-hover/vol:w-24 transition-all duration-200 accent-cinema-red h-1 cursor-pointer"
                  aria-label="Volume"
                />
              </div>

              {/* Fullscreen toggle */}
              <button
                onClick={toggleFullscreen}
                className="p-1.5 text-white/80 hover:text-white transition-colors"
                aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? (
                  <Minimize className="w-5 h-5" />
                ) : (
                  <Maximize className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
        )}
        {/* End bottom controls */}
      </div>
      {/* End flex-1 relative */}

      {/* ================================================================
          EPISODE LIST SIDEBAR
          ================================================================ */}
      <div
        className={`absolute top-0 right-0 h-full z-30 transition-transform duration-300 ease-in-out ${
          showEpisodeList ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ width: "min(380px, 85vw)" }}
      >
        {/* Backdrop */}
        {showEpisodeList && (
          <div
            className="absolute inset-0 -left-[100vw] w-[200vw] h-full bg-black/40 -z-10"
            onClick={() => setShowEpisodeList(false)}
          />
        )}

        <div className="h-full bg-cinema-bg border-l border-white/[0.06] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.06]">
            <h2 className="text-[13px] font-semibold text-foreground truncate">
              Episodes
              <span className="text-muted-foreground font-normal ml-1.5">
                {episodes.length}
              </span>
            </h2>
            <button
              onClick={() => setShowEpisodeList(false)}
              className="p-2 rounded-xl hover:bg-cinema-surface text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close episode list"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Episode list */}
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {episodes.map((ep) => {
                const isActive = ep.id === episode.id;
                const epLocked =
                  ep.is_locked && !isSubscriber && !ep.is_free_trial;

                return (
                  <button
                    key={ep.id}
                    onClick={() => {
                      if (epLocked) return;
                      goToEpisode(ep);
                    }}
                    disabled={epLocked}
                    className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-colors group ${
                      isActive
                        ? "bg-cinema-red/15 border border-cinema-red/30"
                        : epLocked
                          ? "opacity-60 cursor-not-allowed"
                          : "hover:bg-cinema-surface border border-transparent"
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="relative flex-shrink-0 w-[130px] aspect-video rounded-lg overflow-hidden bg-cinema-surface">
                      {ep.thumbnail_url ? (
                        <img
                          src={ep.thumbnail_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
                          <Play className="w-5 h-5" />
                        </div>
                      )}
                      {/* Runtime badge */}
                      {ep.runtime_seconds && (
                        <span className="absolute bottom-1 right-1 text-[10px] font-medium text-white bg-black/70 px-1.5 py-0.5 rounded">
                          {formatTime(ep.runtime_seconds)}
                        </span>
                      )}
                      {/* Playing indicator */}
                      {isActive && isPlaying && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <div className="flex items-center gap-0.5">
                            <span className="w-0.5 h-3 bg-cinema-red rounded-full animate-pulse" />
                            <span className="w-0.5 h-4 bg-cinema-red rounded-full animate-pulse [animation-delay:0.15s]" />
                            <span className="w-0.5 h-2 bg-cinema-red rounded-full animate-pulse [animation-delay:0.3s]" />
                          </div>
                        </div>
                      )}
                      {/* Lock icon */}
                      {epLocked && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Lock className="w-4 h-4 text-cinema-gold" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground flex-shrink-0">
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
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                          {ep.synopsis}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}