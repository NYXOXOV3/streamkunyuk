import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Content } from "@/lib/supabase/types";

/**
 * GET /api/search
 *
 * Public search endpoint for the contents table.
 * Accepts: q (query), type (optional filter), page (default 1)
 * Returns: { data: Content[], count: number, error: string | null }
 */

const PAGE_SIZE = 20;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const q = searchParams.get("q")?.trim() ?? "";
  const type = searchParams.get("type") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));

  // Require at least 1 character to search
  if (q.length === 0) {
    return NextResponse.json({ data: [], count: 0, error: null });
  }

  try {
    const supabase = await createClient();

    // Build the query
    let query = supabase
      .from("contents")
      .select(
        "id, title, original_title, type, poster_url, backdrop_url, release_year, rating, rating_count, is_premium_only",
        { count: "exact" },
      )
      .eq("status", "published")
      .or(`title.ilike.%${q}%,original_title.ilike.%${q}%`)
      .order("rating", { ascending: false });

    // Apply type filter if provided
    if (
      type &&
      ["movie", "series", "anime", "donghua", "microdrama"].includes(type)
    ) {
      query = query.eq("type", type);
    }

    // Pagination
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;

    if (error) {
      console.error("Search API error:", error);
      return NextResponse.json(
        { data: [], count: 0, error: "Search failed. Please try again." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      data: (data as Content[]) ?? [],
      count: count ?? 0,
      error: null,
    });
  } catch (err) {
    console.error("Search API unexpected error:", err);
    return NextResponse.json(
      { data: [], count: 0, error: "An unexpected error occurred." },
      { status: 500 },
    );
  }
}