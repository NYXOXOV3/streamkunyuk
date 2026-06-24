import { NextRequest, NextResponse } from "next/server";
import { getEpisodes, createEpisode } from "@/lib/admin/content-actions";
import { assertAdmin } from "@/lib/admin/auth-helpers";

export async function GET(request: NextRequest) {
  const forbidden = await assertAdmin(request);
  if (forbidden) return forbidden;

  const sp = request.nextUrl.searchParams;
  const contentId = sp.get("contentId");
  if (!contentId) {
    return NextResponse.json({ data: [], error: "contentId is required" }, { status: 400 });
  }
  const result = await getEpisodes(contentId);
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const forbidden = await assertAdmin(request);
  if (forbidden) return forbidden;

  const { contentId, ...formData } = await request.json();
  if (!contentId) {
    return NextResponse.json({ success: false, error: "contentId is required" }, { status: 400 });
  }
  const result = await createEpisode(contentId, formData);
  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}