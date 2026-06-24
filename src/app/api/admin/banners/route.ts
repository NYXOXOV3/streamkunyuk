import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertAdmin } from "@/lib/admin/auth-helpers";

// ----------------------------------------------------------------
// GET /api/admin/banners — list all banners (admin only, uses service role)
// ----------------------------------------------------------------
export async function GET(request: NextRequest) {
  const forbidden = await assertAdmin(request);
  if (forbidden) return forbidden;

  try {
    const supabase = await createAdminClient();

    // Fetch banners ordered by sort_order
    const { data, error } = await supabase
      .from("banners")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      const msg = error.message;
      if (msg.includes("does not exist") || msg.includes("schema cache")) {
        return NextResponse.json({ data: [], error: null, tableMissing: true });
      }
      throw error;
    }

    return NextResponse.json({ data: data ?? [], error: null });
  } catch (e) {
    return NextResponse.json({
      data: [],
      error: (e as Error).message,
    });
  }
}

// ----------------------------------------------------------------
// POST /api/admin/banners — create a new banner
// ----------------------------------------------------------------
export async function POST(request: NextRequest) {
  const forbidden = await assertAdmin(request);
  if (forbidden) return forbidden;

  try {
    const supabase = await createAdminClient();
    const body = await request.json();

    const { data, error } = await supabase
      .from("banners")
      .insert({
        title: body.title || null,
        subtitle: body.subtitle || null,
        banner_type: body.banner_type || "content",
        content_id: body.content_id || null,
        custom_image_url: body.custom_image_url || null,
        custom_link_url: body.custom_link_url || null,
        cta_text: body.cta_text || "Learn More",
        cta_link: body.cta_link || null,
        sort_order: body.sort_order ?? 0,
        is_active: body.is_active ?? true,
        start_date: body.start_date || null,
        end_date: body.end_date || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data, error: null });
  } catch (e) {
    return NextResponse.json({
      data: null,
      error: (e as Error).message,
    });
  }
}

// ----------------------------------------------------------------
// PATCH /api/admin/banners — update a banner (id in body)
// ----------------------------------------------------------------
export async function PATCH(request: NextRequest) {
  const forbidden = await assertAdmin(request);
  if (forbidden) return forbidden;

  try {
    const supabase = await createAdminClient();
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json({ data: null, error: "Banner ID is required" });
    }

    const { id, ...fields } = body;

    const { data, error } = await supabase
      .from("banners")
      .update(fields)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data, error: null });
  } catch (e) {
    return NextResponse.json({
      data: null,
      error: (e as Error).message,
    });
  }
}

// ----------------------------------------------------------------
// DELETE /api/admin/banners?id=xxx — delete a banner
// ----------------------------------------------------------------
export async function DELETE(request: NextRequest) {
  const forbidden = await assertAdmin(request);
  if (forbidden) return forbidden;

  try {
    const supabase = await createAdminClient();
    const id = request.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ data: null, error: "Banner ID is required" });
    }

    const { error } = await supabase.from("banners").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({ data: true, error: null });
  } catch (e) {
    return NextResponse.json({
      data: null,
      error: (e as Error).message,
    });
  }
}