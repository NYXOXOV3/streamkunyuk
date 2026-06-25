import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyCallback } from "@/lib/api/tripay";

/**
 * POST /api/tripay/callback
 *
 * Callback endpoint yang dipanggil Tripay saat status transaksi berubah.
 * URL ini didaftarkan di Tripay Merchant Dashboard atau saat request transaksi.
 *
 * Callback akan:
 * 1. Validasi signature HMAC-SHA256
 * 2. Update status transaksi di payment_transactions
 * 3. Update subscription user jika status = PAID
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const signature = request.headers.get("x-callback-signature") || "";

    // Get Tripay config from database
    const supabase = await createAdminClient();
    const { data: gateway } = await supabase
      .from("payment_gateways")
      .select("*")
      .eq("gateway_name", "tripay")
      .single();

    if (!gateway?.private_key) {
      console.error("[TripayCallback] Private key not configured");
      return NextResponse.json({ success: false, error: "Not configured" }, { status: 500 });
    }

    // Verify signature
    if (!verifyCallback(gateway.private_key, body, signature)) {
      console.error("[TripayCallback] Invalid signature");
      return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 403 });
    }

    // Extract data from callback
    const { reference, merchant_ref, status, paid_at, amount, fee_merchant, fee_customer, amount_received, payment_method, payment_name } = body;

    if (!merchant_ref) {
      return NextResponse.json({ success: false, error: "Missing merchant_ref" }, { status: 400 });
    }

    // Update transaction record
    const { error: txError } = await supabase
      .from("payment_transactions")
      .update({
        status: status || "PAID",
        gateway_reference: reference,
        payment_method,
        payment_name,
        amount: amount || 0,
        fee_merchant: fee_merchant || 0,
        fee_customer: fee_customer || 0,
        amount_received: amount_received || 0,
        paid_at: paid_at ? new Date(Number(paid_at) * 1000).toISOString() : new Date().toISOString(),
        callback_data: body,
        updated_at: new Date().toISOString(),
      })
      .eq("merchant_ref", merchant_ref);

    if (txError) {
      console.error("[TripayCallback] Failed to update transaction:", txError.message);
    }

    // If payment is PAID, activate subscription
    if (status === "PAID") {
      // Find transaction to get user_id and plan_id
      const { data: tx } = await supabase
        .from("payment_transactions")
        .select("user_id, plan_id")
        .eq("merchant_ref", merchant_ref)
        .single();

      if (tx?.user_id && tx?.plan_id) {
        // Get plan details for duration
        const { data: plan } = await supabase
          .from("subscription_plans")
          .select("duration_days, display_name")
          .eq("id", tx.plan_id)
          .single();

        if (plan) {
          const now = new Date();
          const endDate = new Date(now);
          endDate.setDate(endDate.getDate() + (plan.duration_days || 30));

          // Upsert subscription
          await supabase.from("subscriptions").upsert({
            user_id: tx.user_id,
            status: "active",
            tier_id: null, // will be set based on plan
            current_period_start: now.toISOString(),
            current_period_end: endDate.toISOString(),
          }, { onConflict: "user_id" });

          // Also update the old subscription_tiers reference
          const { data: tier } = await supabase
            .from("subscription_tiers")
            .select("id")
            .eq("name", "premium")
            .single();

          if (tier) {
            await supabase.from("subscriptions").update({
              tier_id: tier.id,
            }).eq("user_id", tx.user_id);
          }
        }
      }
    }

    // Tripay expects { "success": true }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[TripayCallback] Error:", e);
    return NextResponse.json({ success: false, error: (e as Error).message }, { status: 500 });
  }
}
