import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertAdmin } from "@/lib/admin/auth-helpers";
import { getDramaDetail, getStreamV2 } from "@/lib/api/melolo";

/**
 * POST /api/admin/content/melolo-import
 *
 * Import a Melolo short drama with all its episodes into the local database.
 * Fetches drama detail + stream URLs for each episode.
 */
export async function POST(request: NextRequest) {
  const forbidden = await assertAdmin(request);
  if (forbidden) return forbidden;

  try {
    const supabase = await createAdminClient();
    const body = await request.json();
    const { drama_id, drama_name, description, thumb_url, tags, episode_count, language } = body;

    if (!drama_id || !drama_name) {
      return NextResponse.json(
        { error: "drama_id and drama_name are required" },
        { status: 400 },
      );
    }

    // 1. Check if already imported (by external_content_id)
    const { data: existing } = await supabase
      .from("contents")
      .select("id")
      .eq("external_content_id", `melolo_${drama_id}`)
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json({
        success: true,
        contentId: existing[0].id,
        title: drama_name,
        episodes: 0,
        note: "Already imported",
      });
    }

    // 2. Fetch drama detail from Melolo API to get episode list
    let episodes: { episode: number; video_id: string; duration: number; cover: string }[] = [];
    try {
      const detailRes = await getDramaDetail(drama_id, language || "id");
      episodes = detailRes.data?.video_list ?? [];
    } catch {
      // Detail might not be available — skip episode pre-fetch
    }

    // 3. Insert content record (with minimal required fields — no provider_source_id)
    const slug = `melolo-${drama_name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
    const epCount = Math.max(Number(episode_count) || episodes.length || 1, 1);

    const { data: content, error: contentErr } = await supabase
      .from("contents")
      .insert({
        title: drama_name,
        synopsis: description || null,
        type: "microdrama",
        poster_url: thumb_url || null,
        backdrop_url: thumb_url || null,
        language: language || "id",
        status: "published",
        is_premium_only: false,
        free_trial_episodes: 5,
        external_content_id: `melolo_${drama_id}`,
        external_url: `https://api.sonzaix.indevs.in/melolo/detail?id=${drama_id}`,
        slug,
        trailer_url: null,
        original_title: null,
        release_year: null,
        runtime_minutes: null,
        rating: 0,
        rating_count: 0,
        country_of_origin: null,
        featured: false,
        featured_order: 0,
        meta_title: null,
        meta_description: null,
        published_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (contentErr) {
      return NextResponse.json(
        { error: `Content insert failed: ${contentErr.message}` },
        { status: 500 },
      );
    }
    const contentId = content.id;

    // 4. Insert episodes (batched to avoid overload)
    let importedEpisodes = 0;
    const BATCH_SIZE = 20;

    // Build episode data from detail or create placeholders
    // Fetch streamv2 URL for each episode and save to database
    const buildEpisodeRows = async () => {
      const rows = [];
      const epSource = episodes.length > 0
        ? episodes
        : Array.from({ length: Math.min(epCount, 200) }, (_, i) => ({ episode: i + 1, video_id: "", duration: 0, cover: "" }));

      for (const ep of epSource) {
        // Fetch stream URL from streamv2 endpoint
        let videoUrl = null;
        try {
          const meloloBase = "https://api.sonzaix.indevs.in/melolo";
          const streamRes = await fetch(`${meloloBase}/streamv2?id=${encodeURIComponent(drama_id)}&ep=${ep.episode}`, {
            headers: { "Content-Type": "application/json" },
            signal: AbortSignal.timeout(10000),
          });
          const streamJson = await streamRes.json();
          if (streamJson.url) videoUrl = streamJson.url;
        } catch { /* stream not available, video_url stays null */ }

        rows.push({
          content_id: contentId,
          episode_number: ep.episode,
          title: `Episode ${ep.episode}`,
          synopsis: null,
          thumbnail_url: "cover" in ep ? ep.cover as string : thumb_url || null,
          runtime_seconds: "duration" in ep ? ep.duration as number : null,
          video_url: videoUrl, // saved to DB!
          video_url_backup: null,
          is_locked: false,
          is_free_trial: ep.episode <= 5,
          air_date: null,
        });
      }
      return rows;
    };

    const allRows = await buildEpisodeRows();

    // Insert in batches
    for (let i = 0; i < allRows.length; i += BATCH_SIZE) {
      const batch = allRows.slice(i, i + BATCH_SIZE);
      const { error: epErr } = await supabase.from("episodes").insert(batch);
      if (epErr) {
        console.error(`Episode batch insert failed at ${i}:`, epErr.message);
      } else {
        importedEpisodes += batch.length;
      }
    }

    return NextResponse.json({
      success: true,
      contentId,
      title: drama_name,
      episodes: importedEpisodes,
    });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 },
    );
  }
}
