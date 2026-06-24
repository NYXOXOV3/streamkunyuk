import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { escapePostgrest } from "@/lib/supabase/helpers";
import type { Content, ContentType } from "@/lib/supabase/types";

// ---------------------------------------------------------------------------
// Lightweight select — only fields needed for browse cards
// ---------------------------------------------------------------------------

const BROWSE_SELECT =
  "id, title, type, poster_url, backdrop_url, release_year, rating, rating_count, is_premium_only, status";

// ---------------------------------------------------------------------------
// GET /api/browse?type=...&category=...&sort=...&search=...&page=...&pageSize=...
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const type = searchParams.get("type") as ContentType | null;
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
      query = query
        .innerJoin(
          "content_categories",
          "contents.id",
          "content_categories.content_id",
        )
        .innerJoin(
          "categories",
          "content_categories.category_id",
          "categories.id",
        )
        .eq("categories.slug", category);
    }

    // --- Search filter ---
    if (search) {
      const escaped = escapePostgrest(search);
      if (category) {
        // When join is active, qualify column names with table name
        query = query.or(`contents.title.ilike.%${escaped}%,contents.original_title.ilike.%${escaped}%`);
      } else {
        query = query.or(`title.ilike.%${escaped}%,original_title.ilike.%${escaped}%`);
      }
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

    // When category join is used, the data rows include joined columns.
    // Extract only the content fields to match the Content type.
    const contents: Content[] = (data ?? []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      title: row.title as string,
      type: row.type as ContentType,
      poster_url: row.poster_url as string | null,
      backdrop_url: row.backdrop_url as string | null,
      release_year: row.release_year as number | null,
      rating: (row.rating as number) ?? 0,
      rating_count: (row.rating_count as number) ?? 0,
      is_premium_only: (row.is_premium_only as boolean) ?? false,
      status: row.status as "published",
    }));

    return NextResponse.json({
      data: contents,
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