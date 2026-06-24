import { NextRequest, NextResponse } from "next/server";
import { updateEpisodeLock, bulkUpdateEpisodeLocks } from "@/lib/admin/content-actions";
import { assertAdmin } from "@/lib/admin/auth-helpers";

export async function PATCH(request: NextRequest) {
  const forbidden = await assertAdmin(request);
  if (forbidden) return forbidden;

  const body = await request.json();

  // Single episode lock toggle
  if (body.episodeId) {
    const { episodeId, ...updates } = body;
    const result = await updateEpisodeLock(episodeId, updates);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  }

  // Bulk update
  if (body.contentId) {
    const { contentId, episodeIds, ...updates } = body;
    const result = await bulkUpdateEpisodeLocks(contentId, updates, episodeIds);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  }

  return NextResponse.json({ success: false, error: "episodeId or contentId is required" }, { status: 400 });
}