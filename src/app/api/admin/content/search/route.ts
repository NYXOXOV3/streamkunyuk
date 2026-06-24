import { NextRequest, NextResponse } from "next/server";
import { searchTmdbContent } from "@/lib/admin/content-actions";
import { assertAdmin } from "@/lib/admin/auth-helpers";

export async function GET(request: NextRequest) {
  const forbidden = await assertAdmin(request);
  if (forbidden) return forbidden;

  const sp = request.nextUrl.searchParams;
  const query = sp.get("q") || "";
  const type = (sp.get("type") as "movie" | "tv") || "movie";
  const page = Number(sp.get("page")) || 1;

  const result = await searchTmdbContent({ query, type, page });
  return NextResponse.json(result);
}