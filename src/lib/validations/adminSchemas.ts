import { z } from "zod";

// ---------------------------------------------------------------------------
// API Configuration Schema
// ---------------------------------------------------------------------------

export const apiProviderSchema = z.object({
  provider_name: z
    .string()
    .min(1, "Provider name is required")
    .max(100),
  provider_type: z.enum(["metadata", "microdrama", "video_source"]),
  description: z.string().max(500).optional().default(""),
  base_url: z
    .string()
    .url("Must be a valid URL")
    .min(1, "Base URL is required"),
  is_active: z.boolean().default(false),
});

export type ApiProviderFormValues = z.infer<typeof apiProviderSchema>;

export const apiCredentialSchema = z.object({
  api_key: z.string().min(1, "API Key is required"),
  secret_key: z.string().optional(),
});

export type ApiCredentialFormValues = z.infer<typeof apiCredentialSchema>;

// ---------------------------------------------------------------------------
// Content Schema (Manual Upload)
// ---------------------------------------------------------------------------

export const manualContentSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(500),
  original_title: z.string().max(500).optional(),
  synopsis: z.string().max(5000).optional().default(""),
  type: z.enum(["anime", "donghua"]),
  release_year: z
    .number({ invalid_type_error: "Must be a number" })
    .int("Must be a whole number")
    .min(1900)
    .max(2030)
    .optional(),
  runtime_minutes: z
    .number()
    .int()
    .min(1)
    .max(600)
    .optional(),
  poster_url: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
  backdrop_url: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
  trailer_url: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
  language: z.string().length(2).default("id"),
  country_of_origin: z
    .string()
    .length(2)
    .optional(),
  status: z.enum(["draft", "published"]).default("draft"),
  is_premium_only: z.boolean().default(false),
  free_trial_episodes: z.number().int().min(0).default(2),
});

export type ManualContentFormValues = z.infer<typeof manualContentSchema>;

// ---------------------------------------------------------------------------
// Episode Schema
// ---------------------------------------------------------------------------

export const episodeSchema = z.object({
  episode_number: z.number().int().min(1, "Episode number must be ≥ 1"),
  title: z.string().max(500).optional(),
  synopsis: z.string().max(3000).optional(),
  thumbnail_url: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
  video_url: z
    .string()
    .min(1, "Video URL is required")
    .refine(
      (v) => v.endsWith(".m3u8") || v.endsWith(".mp4") || v.startsWith("http"),
      "Must be a valid video URL (.m3u8 or .mp4)",
    ),
  video_url_backup: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
  subtitle_url: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
  is_locked: z.boolean().default(false),
  is_free_trial: z.boolean().default(false),
});

export type EpisodeFormValues = z.infer<typeof episodeSchema>;

/** Partial version for editing — all fields optional */
export const updateEpisodeSchema = episodeSchema.partial();

export type UpdateEpisodeFormValues = z.infer<typeof updateEpisodeSchema>;

// ---------------------------------------------------------------------------
// TMDB Search Schema
// ---------------------------------------------------------------------------

export const tmdbSearchSchema = z.object({
  query: z.string().min(1, "Search query is required").max(200),
  type: z.enum(["movie", "tv"]).default("movie"),
  page: z.number().int().min(1).default(1),
});

export type TmdbSearchFormValues = z.infer<typeof tmdbSearchSchema>;