/**
 * Melolo Short Drama API Client (Server-Side Only)
 *
 * API Docs: https://api.sonzaix.indevs.in/melolo/
 * Base URL: https://api.sonzaix.indevs.in/melolo/
 *
 * Endpoints:
 *   GET /melolo/languages
 *   GET /melolo/home?page=&lang=
 *   GET /melolo/new?page=&lang=
 *   GET /melolo/populer?page=&lang=
 *   GET /melolo/search?q=&page=&lang=
 *   GET /melolo/detail?id=&lang=
 *   GET /melolo/stream?id=&ep=
 *   GET /melolo/streamv2?id=&ep=
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MeloloBook {
  drama_name: string;
  drama_id: string;
  description: string;
  create_time: string;
  episode_count: string | number;
  watch_value: string;
  is_new_book: string;
  language: string;
  thumb_url: string;
  tags: string[];
}

export interface MeloloLanguage {
  code: string;
  name: string;
}

export interface MeloloVideo {
  episode: number;
  video_id: string;
  duration: number;
  cover: string;
}

export interface MeloloDetail {
  drama_id: string;
  drama_name: string;
  description: string;
  episode_count: number;
  video_list: MeloloVideo[];
  tags: string[];
}

export interface MeloloQuality {
  label: string;
  url: string;
  backup_url: string;
  width: number;
  height: number;
  bitrate: number;
  codec: string;
  encrypted: boolean;
}

export interface MeloloStream {
  type: string;
  drama_id: string;
  episode: number;
  vid: string;
  duration: number;
  expire_time: number;
  encrypted: boolean;
  qualities?: MeloloQuality[];
  url?: string;
  playable?: boolean;
}

export interface MeloloResponse<T> {
  type: string;
  data: T;
  total?: number;
  author: string;
  contact: string;
}

// ---------------------------------------------------------------------------
// API Response shapes from the upstream
// ---------------------------------------------------------------------------

interface MeloloHomeData {
  books: MeloloBook[];
}

interface MeloloListData {
  books: MeloloBook[];
}

// ---------------------------------------------------------------------------
// API Client
// ---------------------------------------------------------------------------

const BASE_URL = "https://api.sonzaix.indevs.in/melolo";

/**
 * Fetch wrapper for Melolo API
 */
async function fetchMelolo<T>(path: string, params?: Record<string, string | number>): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const res = await fetch(url.toString(), {
    headers: { "Content-Type": "application/json" },
    next: { revalidate: 300 }, // 5 min CDN cache
  });

  if (!res.ok) {
    throw new Error(`Melolo API error (${res.status}): ${res.statusText}`);
  }

  return res.json();
}

// ---------------------------------------------------------------------------
// API Functions
// ---------------------------------------------------------------------------

/**
 * Get available languages
 */
export async function getLanguages(): Promise<MeloloResponse<MeloloLanguage[]>> {
  return fetchMelolo("/languages");
}

/**
 * Get homepage content
 */
export async function getHomepage(page = 1, lang = "id"): Promise<MeloloResponse<[MeloloHomeData]>> {
  return fetchMelolo("/home", { page, lang });
}

/**
 * Get latest content
 */
export async function getLatest(page = 1, lang = "id"): Promise<MeloloResponse<[MeloloListData]>> {
  return fetchMelolo("/new", { page, lang });
}

/**
 * Get trending/popular content
 */
export async function getPopular(page = 1, lang = "id"): Promise<MeloloResponse<MeloloListData[]>> {
  return fetchMelolo("/populer", { page, lang });
}

/**
 * Search dramas
 */
export async function searchDramas(query: string, page = 1, lang = "id"): Promise<MeloloResponse<[MeloloListData]>> {
  return fetchMelolo("/search", { q: query, page, lang });
}

/**
 * Get drama detail with episodes
 */
export async function getDramaDetail(id: string, lang = "id"): Promise<MeloloResponse<MeloloDetail>> {
  return fetchMelolo("/detail", { id, lang });
}

/**
 * Get stream URL (encrypted — for reference)
 */
export async function getStream(id: string, episode: number): Promise<MeloloResponse<MeloloStream>> {
  return fetchMelolo("/stream", { id, ep: episode });
}

/**
 * Get playable stream URL (decrypted/playable via proxy)
 * This is the one we use for the player
 */
export async function getStreamV2(id: string, episode: number): Promise<MeloloResponse<MeloloStream>> {
  return fetchMelolo("/streamv2", { id, ep: episode });
}
