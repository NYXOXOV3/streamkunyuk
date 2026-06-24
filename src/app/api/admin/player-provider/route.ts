import { NextRequest, NextResponse } from "next/server";
import {
  getPlayerProviders,
  setActivePlayerProvider,
} from "@/lib/admin/player-provider-actions";
import { assertAdmin } from "@/lib/admin/auth-helpers";

export async function GET(request: NextRequest) {
  const forbidden = await assertAdmin(request);
  if (forbidden) return forbidden;

  const result = await getPlayerProviders();
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const forbidden = await assertAdmin(request);
  if (forbidden) return forbidden;

  const body = await request.json();
  const { provider } = body;

  if (!provider || !["2embed", "vidapi"].includes(provider)) {
    return NextResponse.json(
      { error: "Invalid provider. Must be '2embed' or 'vidapi'." },
      { status: 400 },
    );
  }

  const result = await setActivePlayerProvider(provider);
  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}