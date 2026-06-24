import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/melolo/stream?id=xxx&ep=1
 *
 * Proxy untuk Melolo stream URL.
 * Melolo API /streamv2 return flat JSON (not nested in "data"),
 * jadi kita fetch langsung.
 */
const MELOLO_BASE = "https://api.sonzaix.indevs.in/melolo";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const id = searchParams.get("id");
    const ep = searchParams.get("ep");

    if (!id || !ep) {
      return NextResponse.json(
        { error: "id and ep are required" },
        { status: 400 },
      );
    }

    const episodeNum = parseInt(ep, 10);
    if (isNaN(episodeNum) || episodeNum < 1) {
      return NextResponse.json(
        { error: "ep must be a positive number" },
        { status: 400 },
      );
    }

    // Fetch directly from Melolo API (flat response, not { data: {...} })
    const url = `${MELOLO_BASE}/streamv2?id=${encodeURIComponent(id)}&ep=${episodeNum}`;
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Melolo API returned ${res.status}` },
        { status: 502 },
      );
    }

    const json = await res.json();

    // The Melolo /streamv2 response is flat:
    // { type, drama_id, episode, vid, playable, encrypted, url, author, contact }
    if (!json.url) {
      return NextResponse.json(
        { error: "No stream URL returned from Melolo" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      url: json.url,
      duration: json.duration ?? 0,
      encrypted: json.encrypted ?? false,
      playable: json.playable ?? true,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
