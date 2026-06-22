/**
 * Player Store (Zustand)
 *
 * Client-side state for the video player instance.
 * Tracks current playback state, episode context, and progress
 * for resume-playback and auto-play-next features.
 */

import { create } from "zustand";

interface PlayerState {
  // Currently playing
  isPlaying: boolean;
  contentId: string | null;
  episodeId: string | null;
  episodeNumber: number | null;
  contentTitle: string | null;

  // Playback tracking
  currentTime: number;
  duration: number;
  isBuffering: boolean;
  isFullscreen: boolean;
  volume: number;
  isMuted: boolean;

  // Quality & subtitles
  quality: string;
  subtitleLang: string | null;

  // Actions
  play: () => void;
  pause: () => void;
  setEpisode: (params: {
    contentId: string;
    episodeId: string;
    episodeNumber: number;
    contentTitle: string;
  }) => void;
  updateTime: (currentTime: number) => void;
  setDuration: (duration: number) => void;
  setBuffering: (isBuffering: boolean) => void;
  setFullscreen: (isFullscreen: boolean) => void;
  setVolume: (volume: number) => void;
  setMuted: (isMuted: boolean) => void;
  setQuality: (quality: string) => void;
  setSubtitleLang: (lang: string | null) => void;
  reset: () => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  isPlaying: false,
  contentId: null,
  episodeId: null,
  episodeNumber: null,
  contentTitle: null,
  currentTime: 0,
  duration: 0,
  isBuffering: false,
  isFullscreen: false,
  volume: 1,
  isMuted: false,
  quality: "auto",
  subtitleLang: null,

  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),

  setEpisode: ({ contentId, episodeId, episodeNumber, contentTitle }) =>
    set({
      contentId,
      episodeId,
      episodeNumber,
      contentTitle,
      currentTime: 0,
      duration: 0,
      isPlaying: false,
    }),

  updateTime: (currentTime) => set({ currentTime }),
  setDuration: (duration) => set({ duration }),
  setBuffering: (isBuffering) => set({ isBuffering }),
  setFullscreen: (isFullscreen) => set({ isFullscreen }),
  setVolume: (volume) => set({ volume, isMuted: volume === 0 }),
  setMuted: (isMuted) => set({ isMuted }),
  setQuality: (quality) => set({ quality }),
  setSubtitleLang: (subtitleLang) => set({ subtitleLang }),

  reset: () =>
    set({
      isPlaying: false,
      contentId: null,
      episodeId: null,
      episodeNumber: null,
      contentTitle: null,
      currentTime: 0,
      duration: 0,
      isBuffering: false,
      isFullscreen: false,
    }),
}));