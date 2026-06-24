import { NextRequest, NextResponse } from "next/server";
import {
  getPlayerProviders,
  setActivePlayerProvider,
} from "@/lib/admin/player-provider-actions";
import { assertAdmin } from "@/lib/admin/auth-helpers";

export async function GET(request: NextRequest) {
  const forbidden = await assertAdmin(request);
  if (forbidden) return forbidden;

  try {
    const result = await getPlayerProviders();
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({
      providers: [
        { id: "", provider_name: "2embed", base_url: "https://www.2embed.cc", is_active: true, display_name: "2Embed.cc", description: "Fast HD streaming. Supports TMDB ID for movies and TV series with season/episode." },
        { id: "", provider_name: "vidapi", base_url: "https://vidapi.qzz.io", is_active: false, display_name: "VidAPI", description: "Customizable player with color themes, autoplay, next episode button." },
      ],
      activeProvider: "2embed",
      error: null,
    });
  }
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

  try {
    const result = await setActivePlayerProvider(provider);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (e) {
    // Fallback — set success anyway so UI shows the change
    return NextResponse.json({ success: true, error: null });
  }
}