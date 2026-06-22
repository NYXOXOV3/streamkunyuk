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

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    next: { revalidate: 300 }, // Cache for 5 min
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

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${apiKey}`,
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