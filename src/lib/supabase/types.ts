/**
 * Supabase Types
 *
 * Generated database types. This file will be populated with
 * `supabase gen types typescript` output once connected to a project.
 *
 * For now, we define the core interfaces that the app expects.
 * These should be replaced with auto-generated types in production.
 */

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export type ContentType = "movie" | "series" | "anime" | "donghua" | "microdrama";

export type ContentStatus = "draft" | "published" | "archived";

export type SubscriptionStatus =
  | "active"
  | "inactive"
  | "cancelled"
  | "past_due"
  | "trialing";

export type PaymentStatus =
  | "pending"
  | "completed"
  | "failed"
  | "refunded"
  | "expired";

export type ApiTestStatus = "success" | "fail" | "pending" | "untested";

export type ApiProviderType = "metadata" | "microdrama" | "video_source";

// ---------------------------------------------------------------------------
// Database Row Types
// ---------------------------------------------------------------------------

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionTier {
  id: string;
  name: string;
  display_name: string;
  price_monthly: number;
  price_yearly: number;
  max_quality: string;
  features: string[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  tier_id: string;
  status: SubscriptionStatus;
  payment_provider: string | null;
  payment_provider_sub_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  trial_end: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
  subscription_tier?: SubscriptionTier;
}

export interface ApiProvider {
  id: string;
  provider_name: string;
  provider_type: ApiProviderType;
  description: string | null;
  base_url: string | null;
  is_active: boolean;
  last_tested_at: string | null;
  test_status: ApiTestStatus;
  created_at: string;
  updated_at: string;
}

export interface ContentProvider {
  id: string;
  name: string;
  type: string;
  api_provider_id: string | null;
  created_at: string;
}

export interface Content {
  id: string;
  tmdb_id: number | null;
  provider_source_id: string | null;
  title: string;
  original_title: string | null;
  synopsis: string | null;
  type: ContentType;
  release_year: number | null;
  runtime_minutes: number | null;
  poster_url: string | null;
  backdrop_url: string | null;
  trailer_url: string | null;
  rating: number;
  rating_count: number;
  language: string;
  country_of_origin: string | null;
  external_content_id: string | null;
  external_url: string | null;
  is_premium_only: boolean;
  free_trial_episodes: number;
  status: ContentStatus;
  featured: boolean;
  featured_order: number;
  slug: string | null;
  meta_title: string | null;
  meta_description: string | null;
  published_at: string;
  created_at: string;
  updated_at: string;
  // Joined relations (optional)
  content_provider?: ContentProvider;
  categories?: Category[];
  seasons?: Season[];
  episode_count?: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  type_filter: string | null;
  icon_url: string | null;
  sort_order: number;
}

export interface Season {
  id: string;
  content_id: string;
  season_number: number;
  title: string | null;
  synopsis: string | null;
  poster_url: string | null;
  air_date: string | null;
}

export interface Episode {
  id: string;
  content_id: string;
  season_id: string | null;
  episode_number: number;
  title: string | null;
  synopsis: string | null;
  thumbnail_url: string | null;
  runtime_seconds: number | null;
  video_url: string | null;
  video_url_backup: string | null;
  video_quality: Record<string, string> | null;
  subtitles_url: Record<string, string>[] | null;
  external_episode_id: string | null;
  external_url: string | null;
  is_locked: boolean;
  is_free_trial: boolean;
  air_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface WatchHistory {
  id: string;
  user_id: string;
  content_id: string;
  episode_id: string | null;
  progress_seconds: number;
  duration_seconds: number;
  completed: boolean;
  last_watched_at: string;
  created_at: string;
  updated_at: string;
  content?: Content;
  episode?: Episode;
}

export interface Favorite {
  user_id: string;
  content_id: string;
  created_at: string;
  content?: Content;
}

export interface Payment {
  id: string;
  user_id: string;
  subscription_id: string | null;
  payment_provider: string;
  provider_payment_id: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payment_method: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// API Response Types
// ---------------------------------------------------------------------------

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ContentWithRelations extends Content {
  categories: Category[];
  seasons?: Season[];
}

export interface EpisodeWithContent extends Episode {
  content?: Content;
}