/**
 * TMDB API Client (Server-Side Only)
 *
 * Fetches movie/TV metadata from TMDB. Designed to be called
 * exclusively from Server Actions and API routes — never from the client.
 *
 * The API key is read from the encrypted `api_credentials` table,
 * NOT from environment variables. This allows the admin to update
 * the TMDB key at runtime via the Admin Panel.
 */

// ---------------------------------------------------------------------------
// TMDB Response Types
// ---------------------------------------------------------------------------

interface TmdbSearchResult {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  media_type?: string;
}

interface TmdbSearchResponse {
  page: number;
  results: TmdbSearchResult[];
  total_pages: number;
  total_results: number;
}

interface TmdbGenre {
  id: number;
  name: string;
}

interface TmdbDetailResult extends TmdbSearchResult {
  genres: TmdbGenre[];
  runtime?: number;
  number_of_seasons?: number;
  number_of_episodes?: number;
  status: string;
  tagline?: string;
  seasons?: TmdbSeasonDetail[];
}

export interface TmdbSeasonDetail {
  id: number;
  season_number: number;
  name: string;
  episode_count: number;
  air_date: string | null;
  overview: string | null;
  poster_path: string | null;
}

export interface TmdbEpisodeDetail {
  id: number;
  episode_number: number;
  name: string;
  overview: string | null;
  air_date: string | null;
  runtime: number | null;
  still_path: string | null;
  vote_average: number;
  season_number: number;
}

export interface TmdbSeasonWithEpisodes {
  season: TmdbSeasonDetail;
  episodes: TmdbEpisodeDetail[];
}

// ---------------------------------------------------------------------------
// Auth helper (shared by all TMDB calls)
// ---------------------------------------------------------------------------

function isV3Key(apiKey: string): boolean {
  return /^[a-f0-9]{32}$/i.test(apiKey.trim());
}

function tmdbHeaders(apiKey: string): Record<string, string> {
  const v3 = isV3Key(apiKey);
  return {
    "Content-Type": "application/json",
    ...(v3 ? {} : { Authorization: `Bearer ${apiKey.trim()}` }),
  };
}

function applyApiKey(url: URL, apiKey: string): void {
  if (isV3Key(apiKey)) {
    url.searchParams.set("api_key", apiKey.trim());
  }
}

// ---------------------------------------------------------------------------
// API Functions
// ---------------------------------------------------------------------------

/**
 * Search TMDB for movies or TV shows by title.
 */
export async function searchTmdb(
  query: string,
  type: "movie" | "tv" = "movie",
  page: number = 1,
  apiKey: string,
  baseUrl: string = "https://api.themoviedb.org/3",
): Promise<TmdbSearchResponse> {
  const url = new URL(`${baseUrl}/search/${type}`);
  url.searchParams.set("query", query);
  url.searchParams.set("page", String(page));
  url.searchParams.set("include_adult", "false");
  url.searchParams.set("language", "en-US");
  applyApiKey(url, apiKey);

  const res = await fetch(url.toString(), {
    headers: tmdbHeaders(apiKey),
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`TMDB search failed (${res.status}): ${body}`);
  }

  return res.json();
}

/**
 * Fetch full details for a specific TMDB movie or TV show.
 */
export async function getTmdbDetail(
  tmdbId: number,
  type: "movie" | "tv" = "movie",
  apiKey: string,
  baseUrl: string = "https://api.themoviedb.org/3",
): Promise<TmdbDetailResult> {
  const url = new URL(`${baseUrl}/${type}/${tmdbId}`);
  url.searchParams.set("language", "en-US");
  applyApiKey(url, apiKey);

  const res = await fetch(url.toString(), {
    headers: tmdbHeaders(apiKey),
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`TMDB detail fetch failed (${res.status}): ${body}`);
  }

  return res.json();
}

/**
 * Fetch all seasons for a TV show, then fetch episodes for each season.
 * Accepts optional pre-fetched season numbers to avoid double-fetching.
 */
export async function getTmdbTvSeasons(
  tmdbId: number,
  apiKey: string,
  existingSeasons?: TmdbSeasonDetail[],
  baseUrl: string = "https://api.themoviedb.org/3",
): Promise<TmdbSeasonWithEpisodes[]> {
  const headers = tmdbHeaders(apiKey);

  // Use pre-fetched seasons or fetch from TMDB
  let seasonNumbers: number[];
  if (existingSeasons && existingSeasons.length > 0) {
    seasonNumbers = existingSeasons
      .filter((s) => s.season_number > 0)
      .map((s) => s.season_number);
  } else {
    // Need to fetch TV detail to get season list
    const detailUrl = new URL(`${baseUrl}/tv/${tmdbId}`);
    detailUrl.searchParams.set("language", "en-US");
    applyApiKey(detailUrl, apiKey);

    const detailRes = await fetch(detailUrl.toString(), { headers, next: { revalidate: 3600 } });
    if (!detailRes.ok) throw new Error(`TMDB TV detail failed (${detailRes.status})`);
    const detail: TmdbDetailResult = await detailRes.json();

    seasonNumbers = (detail.seasons ?? [])
      .filter((s) => s.season_number > 0)
      .map((s) => s.season_number);
  }

  if (seasonNumbers.length === 0) return [];

  // Fetch episodes for each season in batches of 5
  const seasonsWithEpisodes: TmdbSeasonWithEpisodes[] = [];

  for (let i = 0; i < seasonNumbers.length; i += 5) {
    const batch = seasonNumbers.slice(i, i + 5);
    const results = await Promise.allSettled(
      batch.map(async (sn) => {
        const epUrl = new URL(`${baseUrl}/tv/${tmdbId}/season/${sn}`);
        epUrl.searchParams.set("language", "en-US");
        applyApiKey(epUrl, apiKey);

        const epRes = await fetch(epUrl.toString(), { headers });
        if (!epRes.ok) throw new Error(`Season ${sn} fetch failed (${epRes.status})`);
        const epData = await epRes.json();

        // Extract season info from the response itself
        const seasonInfo: TmdbSeasonDetail = {
          id: epData.id ?? sn,
          season_number: epData.season_number ?? sn,
          name: epData.name ?? `Season ${sn}`,
          episode_count: epData.episodes?.length ?? 0,
          air_date: epData.air_date ?? null,
          overview: epData.overview ?? null,
          poster_path: epData.poster_path ?? null,
        };

        return {
          season: seasonInfo,
          episodes: (epData.episodes ?? []) as TmdbEpisodeDetail[],
        };
      }),
    );

    for (const r of results) {
      if (r.status === "fulfilled") seasonsWithEpisodes.push(r.value);
    }
  }

  return seasonsWithEpisodes;
}

// ---------------------------------------------------------------------------
// Image URL Builder
// ---------------------------------------------------------------------------

/**
 * Build the full poster/backdrop URL from a TMDB path.
 */
export function tmdbImageUrl(
  path: string | null,
  size: string = "w500",
  imageBaseUrl: string = "https://image.tmdb.org/t/p",
): string | null {
  if (!path) return null;
  return `${imageBaseUrl}/${size}${path}`;
}

// ---------------------------------------------------------------------------
// Parse TMDB → Content Type
// ---------------------------------------------------------------------------

/**
 * Parse a TMDB search result into a format suitable for our content type.
 */
export function parseTmdbToContentType(
  result: TmdbSearchResult,
  type: "movie" | "tv",
): {
  tmdb_id: number;
  title: string;
  original_title: string | null;
  synopsis: string | null;
  type: "movie" | "series";
  release_year: number | null;
  poster_url: string | null;
  backdrop_url: string | null;
  rating: number;
  rating_count: number;
} {
  const title = result.title || result.name || "Unknown";
  const originalTitle = result.original_title || result.original_name || null;
  const dateStr = result.release_date || result.first_air_date || "";
  const year = dateStr ? parseInt(dateStr.split("-")[0], 10) : null;

  return {
    tmdb_id: result.id,
    title,
    original_title: originalTitle,
    synopsis: result.overview || null,
    type: type === "movie" ? "movie" : "series",
    release_year: year,
    poster_url: tmdbImageUrl(result.poster_path),
    backdrop_url: tmdbImageUrl(result.backdrop_path, "original"),
    rating: Math.round(result.vote_average * 10) / 10,
    rating_count: result.vote_count,
  };
}

// ---------------------------------------------------------------------------
// Video Player URL Builders (multi-provider)
// ---------------------------------------------------------------------------

/**
 * Supported video player providers.
 * Each provider has a unique `id` used in the database and admin panel.
 */
export type VideoPlayerProvider = "vidapi" | "2embed";

/**
 * Build a 2Embed.cc embed URL for a movie.
 * Docs: https://www.2embed.cc/
 *   Movie: https://www.2embed.cc/embed/{tmdbId}
 *   TV:     https://www.2embed.cc/embedtv/{tmdbId}&s={season}&e={episode}
 */
export function build2EmbedMovieUrl(tmdbId: number): string {
  return `https://www.2embed.cc/embed/${tmdbId}`;
}

/**
 * Build a 2Embed.cc embed URL for a TV episode.
 */
export function build2EmbedTvUrl(
  tmdbId: number,
  season: number,
  episode: number,
): string {
  return `https://www.2embed.cc/embedtv/${tmdbId}&s=${season}&e=${episode}`;
}

/**
 * Build a 2Embed.cc URL based on content type.
 */
export function build2EmbedUrl(
  tmdbId: number,
  type: "movie" | "tv",
  season?: number,
  episode?: number,
): string {
  if (type === "movie") return build2EmbedMovieUrl(tmdbId);
  return build2EmbedTvUrl(tmdbId, season ?? 1, episode ?? 1);
}

/**
 * Build an embed URL for any supported provider.
 * This is the main entry point used by the player and import system.
 */
export function buildEmbedUrl(
  provider: VideoPlayerProvider,
  tmdbId: number,
  type: "movie" | "tv",
  season?: number,
  episode?: number,
  config?: VidapiPlayerConfig,
): string {
  switch (provider) {
    case "2embed":
      return build2EmbedUrl(tmdbId, type, season, episode);
    case "vidapi":
    default:
      return buildVidapiUrl(tmdbId, type, season, episode, config);
  }
}

/**
 * Detect the provider from a stored embed URL.
 * Used to identify which provider was used for existing episodes.
 */
export function detectEmbedProvider(videoUrl: string): VideoPlayerProvider | null {
  if (!videoUrl) return null;
  if (videoUrl.includes("2embed.cc")) return "2embed";
  if (videoUrl.includes("vidapi.qzz.io")) return "vidapi";
  return null;
}

// ---------------------------------------------------------------------------
// VidAPI URL Builder (legacy — still supported)
// ---------------------------------------------------------------------------

/**
 * VidAPI player configuration stored in DB per-content.
 * These are the default values used when importing from TMDB.
 *
 * All config is saved to the `contents.trailer_url` (reference URL) and
 * `episodes.video_url` (actual embed URL) columns in Supabase.
 * NOTHING is stored in localStorage.
 *
 * VidAPI docs: https://vidapi.qzz.io/
 *   - Movie:  https://vidapi.qzz.io/movie/{tmdbId}
 *   - TV:     https://vidapi.qzz.io/tv/{tmdbId}/{season}/{episode}
 *
 * Supported params:
 *   primaryColor   - slider/autoplay color (hex without #)
 *   secondaryColor - progress bar behind slider (hex without #)
 *   iconColor      - icon color (hex without #)
 *   icons          - "vid" or "default"
 *   title          - show media title (true/false)
 *   poster         - show poster image (true/false)
 *   autoplay       - auto-start playback (true/false)
 *   nextbutton     - show next episode button at 90% (true/false)
 *   player         - "plus" (Netflix/VideoJS Plus) or default
 *   startAt        - start time in seconds
 *   sub_file       - external subtitle VTT URL
 *   fallback_url   - redirect URL when stream fails
 */

export interface VidapiPlayerConfig {
  primaryColor?: string;
  secondaryColor?: string;
  iconColor?: string;
  icons?: "vid" | "default";
  title?: boolean;
  poster?: boolean;
  autoplay?: boolean;
  nextbutton?: boolean;
  player?: string;
  startAt?: number;
  sub_file?: string;
  fallback_url?: string;
}

/**
 * Default player config matching StreamVault cinema dark theme.
 */
export const DEFAULT_VIDAPI_CONFIG: VidapiPlayerConfig = {
  primaryColor: "8B1A1A",
  secondaryColor: "1A1A2E",
  iconColor: "2ECC71",
  icons: "default",
  title: true,
  poster: true,
  autoplay: true,
  nextbutton: true,
  player: "nf",
};

/**
 * Serialize a VidapiPlayerConfig into URL query parameters.
 */
function vidapiParams(config?: VidapiPlayerConfig): string {
  const c = { ...DEFAULT_VIDAPI_CONFIG, ...config };
  const params = new URLSearchParams();
  if (c.primaryColor) params.set("primaryColor", c.primaryColor);
  if (c.secondaryColor) params.set("secondaryColor", c.secondaryColor);
  if (c.iconColor) params.set("iconColor", c.iconColor);
  if (c.icons) params.set("icons", c.icons);
  if (c.title !== undefined) params.set("title", String(c.title));
  if (c.poster !== undefined) params.set("poster", String(c.poster));
  if (c.autoplay !== undefined) params.set("autoplay", String(c.autoplay));
  if (c.nextbutton !== undefined) params.set("nextbutton", String(c.nextbutton));
  if (c.player) params.set("player", c.player);
  if (c.startAt !== undefined && c.startAt > 0) params.set("startAt", String(c.startAt));
  if (c.sub_file) params.set("sub_file", c.sub_file);
  if (c.fallback_url) params.set("fallback_url", c.fallback_url);
  return params.toString();
}

/**
 * Build vidapi.qzz.io embed URL for a movie.
 */
export function buildVidapiMovieUrl(
  tmdbId: number,
  config?: VidapiPlayerConfig,
): string {
  return `https://vidapi.qzz.io/movie/${tmdbId}?${vidapiParams(config)}`;
}

/**
 * Build vidapi.qzz.io embed URL for a TV episode.
 */
export function buildVidapiTvUrl(
  tmdbId: number,
  season: number,
  episode: number,
  config?: VidapiPlayerConfig,
): string {
  return `https://vidapi.qzz.io/tv/${tmdbId}/${season}/${episode}?${vidapiParams(config)}`;
}

/**
 * Build the vidapi URL based on content type.
 */
export function buildVidapiUrl(
  tmdbId: number,
  type: "movie" | "tv",
  season?: number,
  episode?: number,
  config?: VidapiPlayerConfig,
): string {
  if (type === "movie") return buildVidapiMovieUrl(tmdbId, config);
  return buildVidapiTvUrl(tmdbId, season ?? 1, episode ?? 1, config);
}