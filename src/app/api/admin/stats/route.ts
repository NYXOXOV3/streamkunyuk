import { NextRequest, NextResponse } from "next/server";
import { getDashboardStats } from "@/lib/admin/content-actions";
import { assertAdmin } from "@/lib/admin/auth-helpers";

export async function GET(request: NextRequest) {
  const forbidden = await assertAdmin(request);
  if (forbidden) return forbidden;

  const result = await getDashboardStats();
  return NextResponse.json(result);
}