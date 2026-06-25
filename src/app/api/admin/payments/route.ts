import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertAdmin } from "@/lib/admin/auth-helpers";

/**
 * GET /api/admin/payments?page=1&pageSize=20&status=PAID&search=ref
 *
 * Returns payment transactions with user & plan info.
 */
export async function GET(request: NextRequest) {
  const forbidden = await assertAdmin(request);
  if (forbidden) return forbidden;

  try {
    const supabase = await createAdminClient();
    const sp = request.nextUrl.searchParams;
    const page = Math.max(1, Number(sp.get("page")) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(sp.get("pageSize")) || 20));
    const statusFilter = sp.get("status") || "";
    const search = sp.get("search")?.trim() || "";

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Build query
    let query = supabase
      .from("payment_transactions")
      .select("*, profiles!inner(display_name), subscription_plans(display_name)", { count: "exact" });

    if (statusFilter) {
      query = query.eq("status", statusFilter);
    }

    if (search) {
      query = query.or(`merchant_ref.ilike.%${search}%,gateway_reference.ilike.%${search}%`);
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    return NextResponse.json({
      data: data ?? [],
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / pageSize),
      page,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message, data: [], total: 0, totalPages: 0 }, { status: 500 });
  }
}
