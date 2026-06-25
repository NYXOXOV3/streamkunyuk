import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createTransaction, getPaymentChannels, type TripayConfig } from "@/lib/api/tripay";

/**
 * POST /api/payment/create
 *
 * Create a subscription payment via Tripay.
 * Authenticated user selects a plan → we create a Tripay transaction.
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { plan_id, payment_channel, return_url } = body;

    if (!plan_id || !payment_channel) {
      return NextResponse.json({ error: "plan_id and payment_channel required" }, { status: 400 });
    }

    const admin = await createAdminClient();

    // Get plan details
    const { data: plan, error: planError } = await admin
      .from("subscription_plans")
      .select("*")
      .eq("id", plan_id)
      .single();

    if (planError || !plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    // Get Tripay config
    const { data: gateway, error: gwError } = await admin
      .from("payment_gateways")
      .select("*")
      .eq("gateway_name", "tripay")
      .single();

    if (gwError || !gateway?.api_key) {
      return NextResponse.json({ error: "Payment gateway not configured" }, { status: 502 });
    }

    const tripayConfig: TripayConfig = {
      apiKey: gateway.api_key,
      privateKey: gateway.private_key || "",
      merchantCode: gateway.merchant_code || "",
      isSandbox: gateway.is_sandbox,
    };

    // Generate merchant reference
    const merchantRef = `SUB-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    // Get user profile for customer info
    const { data: profile } = await admin
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    // Create Tripay transaction
    const result = await createTransaction(tripayConfig, {
      method: payment_channel,
      merchantRef,
      amount: Number(plan.price),
      customerName: profile?.display_name || user.email?.split("@")[0] || "Customer",
      customerEmail: user.email || "",
      customerPhone: user.phone || undefined,
      orderItems: [
        {
          sku: `SUB-${plan.name}`,
          name: `StreamVault ${plan.display_name}`,
          price: Number(plan.price),
          quantity: 1,
        },
      ],
      returnUrl: return_url || `${request.headers.get("origin") || "https://kzr-six.vercel.app"}/profile/subscription`,
      expiredTime: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
    });

    // Save transaction to database
    await admin.from("payment_transactions").insert({
      user_id: user.id,
      plan_id: plan.id,
      gateway_name: "tripay",
      gateway_reference: result.reference,
      merchant_ref: merchantRef,
      amount: result.amount,
      fee_merchant: result.fee_merchant,
      fee_customer: result.fee_customer,
      amount_received: result.amount_received,
      status: result.status || "UNPAID",
      payment_method: result.payment_method,
      payment_name: result.payment_name,
      pay_code: result.pay_code,
      checkout_url: result.checkout_url,
      expired_at: result.expired_time ? new Date(result.expired_time * 1000).toISOString() : null,
    });

    return NextResponse.json({
      success: true,
      data: {
        reference: result.reference,
        merchant_ref: merchantRef,
        pay_code: result.pay_code,
        checkout_url: result.checkout_url,
        amount: result.amount,
        status: result.status,
        payment_name: result.payment_name,
        expired_time: result.expired_time,
        instructions: result.instructions,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
