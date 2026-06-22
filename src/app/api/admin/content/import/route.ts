import { NextRequest, NextResponse } from "next/server";
import { importFromTmdb } from "@/lib/admin/content-actions";

export async function POST(request: NextRequest) {
  const { tmdbId, type } = await request.json();
  if (!tmdbId || !type) {
    return NextResponse.json({ success: false, error: "tmdbId and type are required" }, { status: 400 });
  }
  const result = await importFromTmdb({ tmdbId, type });
  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}