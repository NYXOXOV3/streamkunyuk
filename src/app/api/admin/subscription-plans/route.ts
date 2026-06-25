import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertAdmin } from "@/lib/admin/auth-helpers";

export async function GET() {
  const supabase = await createAdminClient();
  const { data } = await supabase.from("subscription_plans").select("*").order("sort_order", { ascending: true });
  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: NextRequest) {
  const forbidden = await assertAdmin(request);
  if (forbidden) return forbidden;

  try {
    const supabase = await createAdminClient();
    const body = await request.json();

    if (body.id) {
      await supabase.from("subscription_plans").update({
        display_name: body.display_name,
        description: body.description || null,
        price: parseFloat(body.price),
        duration_days: parseInt(body.duration_days),
        quality: body.quality,
        max_devices: parseInt(body.max_devices),
        features: body.features || [],
        is_active: body.is_active ?? true,
      }).eq("id", body.id);
    } else {
      const { data: plans } = await supabase.from("subscription_plans").select("sort_order").order("sort_order", { ascending: false }).limit(1);
      const maxOrder = (plans?.[0] as { sort_order?: number })?.sort_order ?? 0;
      await supabase.from("subscription_plans").insert({
        name: body.display_name.toLowerCase().replace(/\s+/g, "_"),
        display_name: body.display_name,
        description: body.description || null,
        price: parseFloat(body.price),
        duration_days: parseInt(body.duration_days),
        quality: body.quality,
        max_devices: parseInt(body.max_devices),
        features: body.features || [],
        is_active: true,
        sort_order: maxOrder + 1,
      });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const forbidden = await assertAdmin(request);
  if (forbidden) return forbidden;

  try {
    const supabase = await createAdminClient();
    const body = await request.json();
    await supabase.from("subscription_plans").update({ is_active: body.is_active }).eq("id", body.id);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
