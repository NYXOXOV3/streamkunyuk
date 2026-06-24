import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { escapePostgrest } from "@/lib/supabase/helpers";
import type { Content, ContentType } from "@/lib/supabase/types";

// ---------------------------------------------------------------------------
// Lightweight select — only fields needed for browse cards
// ---------------------------------------------------------------------------

const BROWSE_SELECT =
  "id, title, original_title, type, poster_url, backdrop_url, release_year, rating, rating_count, is_premium_only, status, language, slug";

// ---------------------------------------------------------------------------
// GET /api/browse?type=...&category=...&sort=...&search=...&page=...&pageSize=...
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const type = searchParams.get("type") as string | null;
    const category = searchParams.get("category");
    const sort = searchParams.get("sort") ?? "rating";
    const search = searchParams.get("search")?.trim();
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.min(
      60,
      Math.max(1, Number(searchParams.get("pageSize")) || 24),
    );

    const supabase = await createClient();

    // --- Build base query ---
    let query = supabase
      .from("contents")
      .select(BROWSE_SELECT, { count: "exact" })
      .eq("status", "published");

    // --- Filter by type ---
    if (type && type !== "all") {
      query = query.eq("type", type);
    }

    // --- Filter by category slug (via content_categories join) ---
    if (category) {
      // First get content IDs for this category
      const { data: catLinks } = await supabase
        .from("content_categories")
        .select("content_id")
        .in("category_id", (
          await supabase.from("categories").select("id").eq("slug", category)
        ).data?.map((c: { id: string }) => c.id) ?? []);

      const contentIds = (catLinks ?? []).map((r: { content_id: string }) => r.content_id);
      if (contentIds.length > 0) {
        query = query.in("id", contentIds);
      }
    }

    // --- Search filter ---
    if (search) {
      const escaped = escapePostgrest(search);
      query = query.or(`title.ilike.%${escaped}%,original_title.ilike.%${escaped}%`);
    }

    // --- Sorting ---
    switch (sort) {
      case "newest":
        query = query.order("published_at", { ascending: false });
        break;
      case "az":
        query = query.order("title", { ascending: true });
        break;
      case "rating":
      default:
        query = query.order("rating", { ascending: false });
        // Secondary sort by rating_count for tie-breaking
        query = query.order("rating_count", { ascending: false });
        break;
    }

    // --- Pagination ---
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;

    if (error) {
      return NextResponse.json(
        { data: [], count: 0, error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      data: data ?? [],
      count: count ?? 0,
      error: null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { data: [], count: 0, error: message },
      { status: 500 },
    );
  }
}
