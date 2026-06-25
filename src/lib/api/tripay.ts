/**
 * Tripay Payment Gateway Client (Server-Side)
 *
 * API Docs: https://tripay.co.id/developer
 * Production: https://tripay.co.id/api/
 * Sandbox:    https://tripay.co.id/api-sandbox/
 */

import crypto from "crypto";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TripayConfig {
  apiKey: string;
  privateKey: string;
  merchantCode: string;
  isSandbox: boolean;
}

export interface TripayChannel {
  group: string;
  code: string;
  name: string;
  type: "direct" | "redirect";
  fee_merchant: { flat: number; percent: number };
  fee_customer: { flat: number; percent: number };
  total_fee: { flat: number; percent: string };
  minimum_fee: number;
  maximum_fee: number;
  minimum_amount: number;
  maximum_amount: number;
  icon_url: string;
  active: boolean;
}

export interface TripayOrderItem {
  sku?: string;
  name: string;
  price: number;
  quantity: number;
  product_url?: string;
  image_url?: string;
}

export interface TripayCreateTransactionResponse {
  reference: string;
  merchant_ref: string;
  payment_selection_type: string;
  payment_method: string;
  payment_name: string;
  customer_name: string;
  customer_email: string;
  amount: number;
  fee_merchant: number;
  fee_customer: number;
  total_fee: number;
  amount_received: number;
  pay_code: string;
  pay_url: string | null;
  checkout_url: string;
  qr_string: string | null;
  qr_url: string | null;
  status: string;
  expired_time: number;
  order_items: TripayOrderItem[];
  instructions: { title: string; steps: string[] }[];
}

export interface TripayTransaction {
  reference: string;
  merchant_ref: string;
  payment_method: string;
  payment_name: string;
  customer_name: string;
  amount: number;
  fee_merchant: number;
  fee_customer: number;
  total_fee: number;
  amount_received: number;
  pay_code: string;
  checkout_url: string;
  status: string;
  paid_at: string | null;
  expired_time: number;
  order_items: TripayOrderItem[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getBaseUrl(isSandbox: boolean): string {
  return isSandbox
    ? "https://tripay.co.id/api-sandbox"
    : "https://tripay.co.id/api";
}

/**
 * Generate HMAC-SHA256 signature for closed payment (subscription)
 * signature = HMAC-SHA256(privateKey, merchantCode + merchantRef + amount)
 */
export function createSignature(
  privateKey: string,
  merchantCode: string,
  merchantRef: string,
  amount: number,
): string {
  return crypto
    .createHmac("sha256", privateKey)
    .update(merchantCode + merchantRef + amount)
    .digest("hex");
}

/**
 * Generate HMAC-SHA256 signature for open payment
 * signature = HMAC-SHA256(privateKey, merchantCode + channel + merchantRef)
 */
export function createOpenSignature(
  privateKey: string,
  merchantCode: string,
  channel: string,
  merchantRef: string,
): string {
  return crypto
    .createHmac("sha256", privateKey)
    .update(merchantCode + channel + merchantRef)
    .digest("hex");
}

/**
 * Verify callback signature
 * signature = HMAC-SHA256(privateKey, JSON.stringify(requestBody))
 */
export function verifyCallback(
  privateKey: string,
  body: unknown,
  signature: string,
): boolean {
  const expected = crypto
    .createHmac("sha256", privateKey)
    .update(JSON.stringify(body))
    .digest("hex");
  return expected === signature;
}

// ---------------------------------------------------------------------------
// API Client
// ---------------------------------------------------------------------------

async function tripayFetch<T>(
  config: TripayConfig,
  path: string,
  options?: RequestInit,
): Promise<{ success: boolean; message: string; data: T }> {
  const url = `${getBaseUrl(config.isSandbox)}${path}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    signal: AbortSignal.timeout(15000),
  });

  const json = await res.json();

  if (!json.success) {
    throw new Error(json.message || `Tripay API error (${res.status})`);
  }

  return json;
}

/**
 * Get active payment channels for the merchant
 * GET /merchant/payment-channel
 */
export async function getPaymentChannels(
  config: TripayConfig,
): Promise<TripayChannel[]> {
  const res = await tripayFetch<TripayChannel[]>(config, "/merchant/payment-channel");
  return (res.data ?? []).filter((c) => c.active);
}

/**
 * Get payment instructions for a channel
 * GET /payment/instruction?code=CHANNEL_CODE
 */
export async function getPaymentInstructions(
  config: TripayConfig,
  code: string,
  amount?: number,
  payCode?: string,
): Promise<{ title: string; steps: string[] }[]> {
  const params = new URLSearchParams({ code });
  if (amount) params.set("amount", String(amount));
  if (payCode) params.set("pay_code", payCode);

  const res = await tripayFetch<{ title: string; steps: string[] }[]>(
    config,
    `/payment/instruction?${params}`,
  );
  return res.data ?? [];
}

/**
 * Create a transaction (closed payment — for subscriptions)
 * POST /transaction/create
 */
export async function createTransaction(
  config: TripayConfig,
  params: {
    method: string;
    merchantRef: string;
    amount: number;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    orderItems: TripayOrderItem[];
    returnUrl?: string;
    expiredTime?: number;
  },
): Promise<TripayCreateTransactionResponse> {
  const signature = createSignature(
    config.privateKey,
    config.merchantCode,
    params.merchantRef,
    params.amount,
  );

  const expiredTime =
    params.expiredTime ?? Math.floor(Date.now() / 1000) + 24 * 60 * 60; // 24h default

  const payload = {
    method: params.method,
    merchant_ref: params.merchantRef,
    amount: params.amount,
    customer_name: params.customerName,
    customer_email: params.customerEmail,
    customer_phone: params.customerPhone || null,
    order_items: params.orderItems,
    return_url: params.returnUrl || null,
    expired_time: expiredTime,
    signature,
  };

  const res = await tripayFetch<TripayCreateTransactionResponse>(
    config,
    "/transaction/create",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
  return res.data;
}

/**
 * Get transaction detail
 * GET /transaction/detail?reference=REF
 */
export async function getTransactionDetail(
  config: TripayConfig,
  reference: string,
): Promise<TripayTransaction> {
  const res = await tripayFetch<TripayTransaction>(
    config,
    `/transaction/detail?reference=${encodeURIComponent(reference)}`,
  );
  return res.data;
}

/**
 * Check and update transaction status
 * GET /transaction/check-status?reference=REF
 */
export async function checkTransactionStatus(
  config: TripayConfig,
  reference: string,
): Promise<{ success: boolean; message: string }> {
  const res = await tripayFetch<null>(
    config,
    `/transaction/check-status?reference=${encodeURIComponent(reference)}`,
  );
  return { success: res.success, message: res.message };
}

/**
 * Calculate fee for a channel + amount
 * GET /merchant/fee-calculator?code=CHANNEL&amount=AMOUNT
 */
export async function calculateFee(
  config: TripayConfig,
  code: string,
  amount: number,
): Promise<{ code: string; name: string; fee: { flat: number; percent: string; min: number | null; max: number | null }; total_fee: { merchant: number; customer: number } }[]> {
  const res = await tripayFetch<unknown[]>(
    config,
    `/merchant/fee-calculator?code=${encodeURIComponent(code)}&amount=${amount}`,
  );
  return (res.data ?? []) as unknown as {
    code: string; name: string; fee: { flat: number; percent: string; min: number | null; max: number | null }; total_fee: { merchant: number; customer: number }
  }[];
}
