import { NextRequest, NextResponse } from "next/server";
import { getApiProviders, saveApiConfig } from "@/lib/admin/api-config-actions";
import { assertAdmin } from "@/lib/admin/auth-helpers";

export async function GET(request: NextRequest) {
  const forbidden = await assertAdmin(request);
  if (forbidden) return forbidden;

  const result = await getApiProviders();
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const forbidden = await assertAdmin(request);
  if (forbidden) return forbidden;

  const body = await request.json();
  const result = await saveApiConfig(body);
  return NextResponse.json(result);
}