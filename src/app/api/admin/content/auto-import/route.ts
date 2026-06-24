import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertAdmin } from "@/lib/admin/auth-helpers";

/**
 * POST /api/admin/content/auto-import
 *
 * Body (Melolo): { source: "melolo-home" | "melolo-new" | "melolo-popular", pageFrom: number, pageTo: number, lang: string }
 * Body (TMDB):   { source: "tmdb-discover", type: "movie" | "tv", yearFrom: number, yearTo: number }
 */
export async function POST(request: NextRequest) {
  const forbidden = await assertAdmin(request);
  if (forbidden) return forbidden;

  try {
    const body = await request.json();
    const { source } = body;

    if (source?.startsWith("melolo-")) return handleMeloloImport(body);
    if (source === "tmdb-discover") return handleTmdbDiscover(body);

    return NextResponse.json({ error: `Unknown source: ${source}` }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

// ============================================================================
// MELOLO — import all dramas from page X to page Y
// ============================================================================

async function handleMeloloImport(body: Record<string, unknown>) {
  const { source, pageFrom = 1, pageTo = 1, lang = "id" } = body as {
    source: string;
    pageFrom: number;
    pageTo: number;
    lang: string;
  };

  const BASE_URL = "https://api.sonzaix.indevs.in/melolo";
  const supabase = await createAdminClient();

  // Determine API path
  const pathMap: Record<string, string> = {
    "melolo-home": "/home",
    "melolo-new": "/new",
    "melolo-popular": "/populer",
  };
  const apiPath = pathMap[source];
  if (!apiPath) return NextResponse.json({ error: "Invalid source" }, { status: 400 });

  // Fetch all pages from pageFrom to pageTo
  let allBooks: { drama_name: string; drama_id: string; description: string; thumb_url: string; tags: string[]; episode_count: string | number; language: string }[] = [];
  const seen = new Set<string>();

  for (let page = pageFrom; page <= pageTo; page++) {
    try {
      const res = await fetch(`${BASE_URL}${apiPath}?page=${page}&lang=${lang}`, {
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) break;

      const json = await res.json();
      let found = 0;
      if (json.data && Array.isArray(json.data)) {
        for (const item of json.data) {
          if (item.books && Array.isArray(item.books)) {
            for (const b of item.books) {
              if (!seen.has(b.drama_id)) {
                seen.add(b.drama_id);
                allBooks.push(b);
                found++;
              }
            }
          }
        }
      }
      if (found === 0) break;
    } catch {
      break;
    }
  }

  return importMeloloDramas(allBooks, supabase);
}

// ============================================================================
// TMDB DISCOVER — import by year range
// ============================================================================

async function handleTmdbDiscover(body: Record<string, unknown>) {
  const { type = "movie", yearFrom, yearTo } = body as {
    type: "movie" | "tv";
    yearFrom: number;
    yearTo: number;
  };

  const { getCredential } = await import("@/lib/admin/api-config-actions");
  const { value: apiKey, error: keyError } = await getCredential("tmdb");
  if (keyError || !apiKey) {
    return NextResponse.json({ error: keyError || "TMDB API key not configured" }, { status: 400 });
  }

  const { searchTmdb, getTmdbDetail, parseTmdbToContentType, buildVidapiUrl, tmdbImageUrl, getTmdbTvSeasons } = await import("@/lib/api/tmdb");
  const supabase = await createAdminClient();

  let allResults: { id: number; title: string; release_year: number }[] = [];

  for (let year = yearFrom; year <= yearTo; year++) {
    try {
      // Use search with the year as query to get results from that year
      const res = await searchTmdb(String(year), type, 1, apiKey);
      for (const r of res.results ?? []) {
        const title = r.title || r.name || "Unknown";
        const dateStr = r.release_date || r.first_air_date || "";
        const releaseYear = dateStr ? parseInt(dateStr.split("-")[0], 10) : null;
        if (releaseYear === year) {
          allResults.push({ id: r.id, title, release_year: year });
        }
      }
    } catch { /* skip year */ }
  }

  const results: { tmdbId: number; title: string; success: boolean; error?: string; year?: number }[] = [];
  let imported = 0;

  for (const item of allResults) {
    const { data: existing } = await supabase.from("contents").select("id").eq("tmdb_id", item.id).limit(1);
    if (existing && existing.length > 0) {
      results.push({ tmdbId: item.id, title: item.title, year: item.release_year, success: false, error: "Already exists" });
      continue;
    }

    try {
      const detail = await getTmdbDetail(item.id, type, apiKey);
      const parsed = parseTmdbToContentType(detail, type);
      const vidapiUrl = buildVidapiUrl(parsed.tmdb_id, type);

      await supabase.from("contents").delete().eq("tmdb_id", parsed.tmdb_id);

      const { data: provider } = await supabase.from("content_providers").select("id").eq("name", "TMDB Import").single();
      const { error: insertErr } = await supabase.from("contents").insert({
        tmdb_id: parsed.tmdb_id, title: parsed.title, original_title: parsed.original_title,
        synopsis: parsed.synopsis, type: parsed.type, release_year: parsed.release_year,
        poster_url: parsed.poster_url, backdrop_url: parsed.backdrop_url,
        rating: parsed.rating, rating_count: parsed.rating_count, language: "en",
        status: "draft", is_premium_only: false, free_trial_episodes: 0,
        provider_source_id: provider?.id || null, trailer_url: vidapiUrl,
        slug: parsed.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      });

      if (insertErr) {
        results.push({ tmdbId: item.id, title: item.title, year: item.release_year, success: false, error: insertErr.message });
      } else {
        let epCount = 0;
        const { data: content } = await supabase.from("contents").select("id").eq("tmdb_id", parsed.tmdb_id).single();
        if (content) {
          if (type === "tv") {
            try {
              const seasons = await getTmdbTvSeasons(parsed.tmdb_id, apiKey, detail.seasons);
              for (const { season, episodes: seasonEps } of seasons.slice(0, 1)) {
                const rows = seasonEps.filter(ep => ep.episode_number > 0).map(ep => ({
                  content_id: content.id, episode_number: ep.episode_number,
                  title: ep.name || null, synopsis: ep.overview || null,
                  thumbnail_url: tmdbImageUrl(ep.still_path),
                  runtime_seconds: ep.runtime ? ep.runtime * 60 : null,
                  video_url: buildVidapiUrl(parsed.tmdb_id, "tv", season.season_number, ep.episode_number),
                  is_locked: false, is_free_trial: false,
                }));
                if (rows.length > 0) { await supabase.from("episodes").insert(rows); epCount = rows.length; }
              }
            } catch { /* skip */ }
          } else {
            await supabase.from("episodes").insert({
              content_id: content.id, episode_number: 1, title: parsed.title,
              video_url: vidapiUrl, is_locked: false, is_free_trial: true,
            });
            epCount = 1;
          }
        }
        results.push({ tmdbId: item.id, title: item.title, year: item.release_year, success: true });
        imported++;
      }
    } catch (e) {
      results.push({ tmdbId: item.id, title: item.title, year: item.release_year, success: false, error: (e as Error).message });
    }
  }

  return NextResponse.json({ results, imported, total: allResults.length });
}

// ============================================================================
// Shared: Import Melolo dramas with episode stream URLs
// ============================================================================

async function importMeloloDramas(
  books: { drama_name: string; drama_id: string; description: string; thumb_url: string; tags: string[]; episode_count: string | number; language: string }[],
  supabase: ReturnType<typeof Object>,
) {
  const BASE_URL = "https://api.sonzaix.indevs.in/melolo";
  const results: { dramaId: string; title: string; success: boolean; error?: string }[] = [];
  let imported = 0;

  for (const book of books) {
    const { data: existing } = await supabase.from("contents").select("id").eq("external_content_id", `melolo_${book.drama_id}`).limit(1);
    if (existing && existing.length > 0) {
      results.push({ dramaId: book.drama_id, title: book.drama_name, success: false, error: "Already exists" });
      continue;
    }

    // Fetch detail
    let episodes: { episode: number; video_id: string; duration: number; cover: string }[] = [];
    try {
      const detailRes = await fetch(`${BASE_URL}/detail?id=${encodeURIComponent(book.drama_id)}&lang=${book.language || "id"}`, {
        headers: { "Content-Type": "application/json" }, signal: AbortSignal.timeout(10000),
      });
      const detailJson = await detailRes.json();
      if (detailJson.data?.video_list) episodes = detailJson.data.video_list;
    } catch { /* skip */ }

    try {
      const slug = `melolo-${book.drama_name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
      const { data: content, error: contentErr } = await supabase.from("contents").insert({
        title: book.drama_name, synopsis: book.description || null, type: "microdrama",
        poster_url: book.thumb_url || null, backdrop_url: book.thumb_url || null,
        language: book.language || "id", status: "published", is_premium_only: false, free_trial_episodes: 5,
        external_content_id: `melolo_${book.drama_id}`,
        external_url: `https://api.sonzaix.indevs.in/melolo/detail?id=${book.drama_id}`,
        slug, rating: 0, rating_count: 0, published_at: new Date().toISOString(),
      }).select("id").single();
      if (contentErr) throw contentErr;

      // Build episode rows + fetch streamv2 URL each
      const epCount = Math.max(Number(book.episode_count) || episodes.length || 1, 1);
      const totalEps = Math.min(episodes.length > 0 ? episodes.length : epCount, 200);
      const epRows = [];

      for (let i = 1; i <= totalEps; i++) {
        let videoUrl = null;
        try {
          const sr = await fetch(`${BASE_URL}/streamv2?id=${encodeURIComponent(book.drama_id)}&ep=${i}`, {
            headers: { "Content-Type": "application/json" }, signal: AbortSignal.timeout(10000),
          });
          const sj = await sr.json();
          if (sj.url) videoUrl = sj.url;
        } catch { /* skip */ }

        const ep = episodes.find(e => e.episode === i);
        epRows.push({
          content_id: content.id, episode_number: i, title: `Episode ${i}`,
          thumbnail_url: ep?.cover || book.thumb_url || null,
          runtime_seconds: ep?.duration || null,
          video_url: videoUrl, video_url_backup: null,
          is_locked: false, is_free_trial: i <= 5, air_date: null,
        });
      }

      for (let i = 0; i < epRows.length; i += 20) {
        const batch = epRows.slice(i, i + 20);
        await supabase.from("episodes").insert(batch);
      }

      results.push({ dramaId: book.drama_id, title: book.drama_name, success: true });
      imported++;
    } catch (e) {
      results.push({ dramaId: book.drama_id, title: book.drama_name, success: false, error: (e as Error).message });
    }
  }

  return NextResponse.json({ results, imported, total: books.length });
}
