import { NextRequest, NextResponse } from "next/server";
import { getApiProviders, saveApiConfig } from "@/lib/admin/api-config-actions";

export async function GET() {
  const result = await getApiProviders();
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = await saveApiConfig(body);
  return NextResponse.json(result);
}