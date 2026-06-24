import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ----------------------------------------------------------------
// GET /api/banners — public endpoint for active banners
// Returns active banners with content details (for content-type banners)
// ----------------------------------------------------------------
export async function GET() {
  try {
    const supabase = await createClient();

    const now = new Date().toISOString();

    // Fetch active banners, optionally filtered by date range
    const { data: banners, error } = await supabase
      .from("banners")
      .select(
        `
        id, title, subtitle, banner_type, content_id,
        custom_image_url, custom_link_url, cta_text, cta_link,
        sort_order, start_date, end_date
      `
      )
      .eq("is_active", true)
      .not("start_date", "gt", now)
      .not("end_date", "lt", now)
      .order("sort_order", { ascending: true })
      .limit(10);

    if (error) throw error;

    // For content-type banners, fetch the related content details
    const contentIds = (banners ?? [])
      .filter((b) => b.banner_type === "content" && b.content_id)
      .map((b) => b.content_id);

    const contentMap = new Map<string, Record<string, unknown>>();

    if (contentIds.length > 0) {
      const { data: contents } = await supabase
        .from("contents")
        .select(
          "id, title, synopsis, backdrop_url, poster_url, trailer_url, type, release_year, rating, rating_count, is_premium_only"
        )
        .eq("status", "published")
        .in("id", contentIds);

      for (const c of contents ?? []) {
        contentMap.set(c.id, c);
      }
    }

    // Enrich banners with content data
    const enriched = (banners ?? []).map((b) => {
      if (b.banner_type === "content" && b.content_id) {
        const content = contentMap.get(b.content_id);
        return { ...b, content: content ?? null };
      }
      return { ...b, content: null };
    });

    return NextResponse.json({ data: enriched, error: null });
  } catch (e) {
    // If the banners table doesn't exist, return empty (graceful degradation)
    const msg = (e as Error).message;
    if (msg.includes("does not exist") || msg.includes("schema cache")) {
      return NextResponse.json({ data: [], error: null });
    }
    return NextResponse.json({ data: [], error: msg });
  }
}