import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPaymentChannels, type TripayConfig } from "@/lib/api/tripay";

/**
 * GET /api/payment/channels
 *
 * Returns active Tripay payment channels.
 * Used by subscription page to show payment options.
 */
export async function GET() {
  try {
    const admin = await createAdminClient();

    const { data: gateway } = await admin
      .from("payment_gateways")
      .select("*")
      .eq("gateway_name", "tripay")
      .single();

    if (!gateway?.api_key) {
      return NextResponse.json({ data: [], error: null });
    }

    const config: TripayConfig = {
      apiKey: gateway.api_key,
      privateKey: gateway.private_key || "",
      merchantCode: gateway.merchant_code || "",
      isSandbox: gateway.is_sandbox,
    };

    const channels = await getPaymentChannels(config);

    // Group by type
    const grouped = channels.reduce(
      (acc, ch) => {
        const group = ch.group || "Other";
        if (!acc[group]) acc[group] = [];
        acc[group].push(ch);
        return acc;
      },
      {} as Record<string, typeof channels>,
    );

    return NextResponse.json({ data: grouped, error: null });
  } catch (e) {
    return NextResponse.json({ data: {}, error: (e as Error).message });
  }
}
