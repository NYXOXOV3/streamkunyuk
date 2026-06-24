import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertAdmin } from "@/lib/admin/auth-helpers";

// ---------------------------------------------------------------------------
// Default SEO values
// ---------------------------------------------------------------------------

const DEFAULT_SEO = {
  site_title: "StreamVault — Premium Streaming",
  tagline: "Movies, Series, Anime, Donghua & Micro-Dramas",
  description: "Stream movies, series, anime, donghua, and micro-dramas. Cinematic experience, anytime, anywhere.",
  keywords: "streaming, movies, series, anime, donghua, micro-drama, watch online",
  og_image: "",
  twitter_handle: "@streamvault",
  logo_url: "",
  icon_url: "",
};

// ---------------------------------------------------------------------------
// GET — Return current SEO settings
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const forbidden = await assertAdmin(request);
  if (forbidden) return forbidden;

  try {
    const supabase = await createAdminClient();

    // Try to fetch from site_settings table
    const { data: rows, error } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", Object.keys(DEFAULT_SEO));

    if (error) {
      // Table might not exist — return defaults
      return NextResponse.json({ data: DEFAULT_SEO, error: null });
    }

    // Merge DB values with defaults
    const stored: Record<string, string> = {};
    for (const row of rows ?? []) {
      stored[row.key] = row.value;
    }

    return NextResponse.json({
      data: { ...DEFAULT_SEO, ...stored },
      error: null,
    });
  } catch (e) {
    return NextResponse.json({ data: DEFAULT_SEO, error: null });
  }
}

// ---------------------------------------------------------------------------
// POST — Save SEO settings
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const forbidden = await assertAdmin(request);
  if (forbidden) return forbidden;

  try {
    const body = await request.json();
    const supabase = await createAdminClient();

    // Upsert each key-value pair
    for (const [key, value] of Object.entries(body)) {
      if (key in DEFAULT_SEO && typeof value === "string") {
        await supabase
          .from("site_settings")
          .upsert({ key, value }, { onConflict: "key" });
      }
    }

    return NextResponse.json({ success: true, error: null });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: (e as Error).message },
      { status: 500 },
    );
  }
}
