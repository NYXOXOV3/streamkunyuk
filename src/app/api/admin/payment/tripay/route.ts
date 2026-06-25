import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertAdmin } from "@/lib/admin/auth-helpers";

/**
 * GET /api/admin/payment/tripay — Get Tripay configuration status
 * POST /api/admin/payment/tripay — Save Tripay configuration
 */
export async function GET(request: NextRequest) {
  const forbidden = await assertAdmin(request);
  if (forbidden) return forbidden;

  try {
    const supabase = await createAdminClient();
    const { data } = await supabase
      .from("payment_gateways")
      .select("*")
      .eq("gateway_name", "tripay")
      .maybeSingle();

    // Never expose full keys — only show masked
    if (data) {
      return NextResponse.json({
        data: {
          ...data,
          api_key: data.api_key ? maskKey(data.api_key) : null,
          private_key: data.private_key ? maskKey(data.private_key) : null,
        },
        error: null,
      });
    }

    return NextResponse.json({
      data: null,
      error: null,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const forbidden = await assertAdmin(request);
  if (forbidden) return forbidden;

  try {
    const supabase = await createAdminClient();
    const body = await request.json();
    const { api_key, private_key, merchant_code, is_sandbox } = body;

    // Get existing config to merge keys (avoid overwriting with masked values)
    const { data: existing } = await supabase
      .from("payment_gateways")
      .select("*")
      .eq("gateway_name", "tripay")
      .maybeSingle();

    // If api_key is masked ("sk-****"), keep existing
    const finalApiKey = api_key?.includes("****") && existing?.api_key
      ? existing.api_key
      : api_key;
    const finalPrivateKey = private_key?.includes("****") && existing?.private_key
      ? existing.private_key
      : private_key;

    if (existing) {
      await supabase
        .from("payment_gateways")
        .update({
          api_key: finalApiKey,
          private_key: finalPrivateKey,
          merchant_code: merchant_code || existing.merchant_code,
          is_sandbox: is_sandbox ?? existing.is_sandbox,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq("gateway_name", "tripay");
    } else {
      await supabase.from("payment_gateways").insert({
        gateway_name: "tripay",
        display_name: "TriPay Indonesia",
        is_active: true,
        is_sandbox: is_sandbox ?? true,
        api_key: finalApiKey,
        private_key: finalPrivateKey,
        merchant_code: merchant_code || "",
      });
    }

    return NextResponse.json({ success: true, error: null });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

function maskKey(key: string): string {
  if (key.length <= 6) return "****";
  return key.slice(0, 3) + "****" + key.slice(-3);
}
