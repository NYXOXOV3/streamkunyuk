import { NextRequest, NextResponse } from "next/server";
import { getContentList, createContent } from "@/lib/admin/content-actions";
import { assertAdmin } from "@/lib/admin/auth-helpers";

export async function GET(request: NextRequest) {
  const forbidden = await assertAdmin(request);
  if (forbidden) return forbidden;

  const sp = request.nextUrl.searchParams;
  const result = await getContentList({
    page: Number(sp.get("page")) || 1,
    pageSize: Number(sp.get("pageSize")) || 20,
    type: (sp.get("type") as "movie" | "series" | "anime" | "donghua" | "microdrama" | "all") || "all",
    status: (sp.get("status") as "draft" | "published" | "archived" | "all") || "all",
    search: sp.get("search") || undefined,
  });
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const forbidden = await assertAdmin(request);
  if (forbidden) return forbidden;

  const body = await request.json();
  const result = await createContent(body);
  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}