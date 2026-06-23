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

import { type ApiProvider } from "@/lib/supabase/types";

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
}

// ---------------------------------------------------------------------------
// TV Show: Seasons & Episodes
// ---------------------------------------------------------------------------

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

/**
 * Fetch all seasons for a TV show, then fetch episodes for each season.
 */
export async function getTmdbTvSeasons(
  tmdbId: number,
  apiKey: string,
  baseUrl: string = "https://api.themoviedb.org/3",
): Promise<TmdbSeasonWithEpisodes[]> {
  const isV3Key = /^[a-f0-9]{32}$/i.test(apiKey.trim());
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(isV3Key ? {} : { Authorization: `Bearer ${apiKey.trim()}` }),
  };

  // 1. Fetch TV detail to get season list
  const detailUrl = new URL(`${baseUrl}/tv/${tmdbId}`);
  detailUrl.searchParams.set("language", "en-US");
  if (isV3Key) detailUrl.searchParams.set("api_key", apiKey.trim());

  const detailRes = await fetch(detailUrl.toString(), {
    headers,
    next: { revalidate: 3600 },
  });
  if (!detailRes.ok) throw new Error(`TMDB TV detail failed (${detailRes.status})`);
  const detail: TmdbDetailResult & { seasons: TmdbSeasonDetail[] } = await detailRes.json();

  // 2. For each season, fetch episodes (skip season 0 = specials unless desired)
  const seasonsWithEpisodes: TmdbSeasonWithEpisodes[] = [];

  // Fetch seasons in parallel (max 5 concurrent to avoid rate limits)
  const seasonNumbers = (detail.seasons ?? [])
    .filter((s) => s.season_number > 0) // skip specials (season 0)
    .map((s) => s.season_number);

  // Process in batches of 5
  for (let i = 0; i < seasonNumbers.length; i += 5) {
    const batch = seasonNumbers.slice(i, i + 5);
    const results = await Promise.allSettled(
      batch.map(async (sn) => {
        const epUrl = new URL(`${baseUrl}/tv/${tmdbId}/season/${sn}`);
        epUrl.searchParams.set("language", "en-US");
        if (isV3Key) epUrl.searchParams.set("api_key", apiKey.trim());

        const epRes = await fetch(epUrl.toString(), { headers });
        if (!epRes.ok) throw new Error(`Season ${sn} fetch failed`);
        const epData = await epRes.json();
        return { season: epData as TmdbSeasonDetail, episodes: (epData.episodes ?? []) as TmdbEpisodeDetail[] };
      }),
    );

    for (const r of results) {
      if (r.status === "fulfilled") seasonsWithEpisodes.push(r.value);
    }
  }

  return seasonsWithEpisodes;
}

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

  // TMDB supports two auth methods:
  //   v3 API Key (32-char hex) → ?api_key=xxx
  //   v4 Bearer Token (JWT)     → Authorization: Bearer xxx
  // Auto-detect by key format
  const isV3Key = /^[a-f0-9]{32}$/i.test(apiKey.trim());
  if (isV3Key) {
    url.searchParams.set("api_key", apiKey.trim());
  }

  const res = await fetch(url.toString(), {
    headers: {
      ...(isV3Key ? {} : { Authorization: `Bearer ${apiKey.trim()}` }),
      "Content-Type": "application/json",
    },
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
interface TmdbDetailResult extends TmdbSearchResult {
  genres: TmdbGenre[];
  runtime?: number;
  number_of_seasons?: number;
  number_of_episodes?: number;
  status: string;
  tagline?: string;
  seasons?: TmdbSeasonDetail[];
}

export async function getTmdbDetail(
  tmdbId: number,
  type: "movie" | "tv" = "movie",
  apiKey: string,
  baseUrl: string = "https://api.themoviedb.org/3",
): Promise<TmdbDetailResult> {
  const url = new URL(`${baseUrl}/${type}/${tmdbId}`);
  url.searchParams.set("language", "en-US");

  const isV3Key = /^[a-f0-9]{32}$/i.test(apiKey.trim());
  if (isV3Key) {
    url.searchParams.set("api_key", apiKey.trim());
  }

  const res = await fetch(url.toString(), {
    headers: {
      ...(isV3Key ? {} : { Authorization: `Bearer ${apiKey.trim()}` }),
      "Content-Type": "application/json",
    },
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`TMDB detail fetch failed (${res.status}): ${body}`);
  }

  return res.json();
}

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
// VidAPI URL Builder
// ---------------------------------------------------------------------------

/**
 * Build vidapi.qzz.io embed URL for a movie.
 * Colors are hex values matching the StreamVault cinema dark theme.
 */
export function buildVidapiMovieUrl(
  tmdbId: number,
): string {
  return `https://vidapi.qzz.io/movie/${tmdbId}?primaryColor=8B1A1A&secondaryColor=1A1A2E&iconColor=2ECC71&icons=default&player=nf&title=true&poster=true&autoplay=true&nextbutton=true`;
}

/**
 * Build vidapi.qzz.io embed URL for a TV episode.
 */
export function buildVidapiTvUrl(
  tmdbId: number,
  season: number,
  episode: number,
): string {
  return `https://vidapi.qzz.io/tv/${tmdbId}/${season}/${episode}?primaryColor=8B1A1A&secondaryColor=1A1A2E&iconColor=2ECC71&icons=default&player=nf&title=true&poster=true&autoplay=true&nextbutton=true`;
}

/**
 * Build the vidapi URL based on content type.
 */
export function buildVidapiUrl(
  tmdbId: number,
  type: "movie" | "tv",
  season?: number,
  episode?: number,
): string {
  if (type === "movie") return buildVidapiMovieUrl(tmdbId);
  return buildVidapiTvUrl(tmdbId, season ?? 1, episode ?? 1);
}