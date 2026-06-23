import { NextRequest, NextResponse } from "next/server";
import { importFromTmdb, bulkImportFromTmdb } from "@/lib/admin/content-actions";

// Single import
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { items } = body;

  // Bulk import: items is an array
  if (Array.isArray(items) && items.length > 0) {
    const validItems = items.filter((i: { tmdbId?: number; type?: string }) => i.tmdbId && i.type);
    if (validItems.length === 0) {
      return NextResponse.json({ error: "No valid items to import" }, { status: 400 });
    }
    const result = await bulkImportFromTmdb({
      items: validItems.map((i: { tmdbId: number; type: "movie" | "tv" }) => ({
        tmdbId: i.tmdbId,
        type: i.type,
      })),
    });
    return NextResponse.json(result);
  }

  // Single import: tmdbId + type
  const { tmdbId, type } = body;
  if (!tmdbId || !type) {
    return NextResponse.json({ success: false, error: "tmdbId and type are required" }, { status: 400 });
  }
  const result = await importFromTmdb({ tmdbId, type });
  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}