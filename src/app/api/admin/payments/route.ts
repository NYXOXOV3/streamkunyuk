import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertAdmin } from "@/lib/admin/auth-helpers";

/**
 * GET /api/admin/payments?page=1&pageSize=20&status=PAID&search=ref
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

    // Fetch transactions with plan info (no profiles join — FK is to auth.users, not profiles)
    let query = supabase
      .from("payment_transactions")
      .select("*, subscription_plans(display_name)", { count: "exact" });

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

    // Fetch user display names separately
    const userIds = [...new Set((data ?? []).map((tx: { user_id: string }) => tx.user_id))];
    let profileMap: Record<string, { display_name: string | null }> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", userIds);
      for (const p of profiles ?? []) {
        profileMap[p.id] = p;
      }
    }

    // Attach profiles to transactions
    const enriched = (data ?? []).map((tx: Record<string, unknown>) => ({
      ...tx,
      profiles: profileMap[tx.user_id as string] || { display_name: null },
    }));

    return NextResponse.json({
      data: enriched,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / pageSize),
      page,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message, data: [], total: 0, totalPages: 0 }, { status: 500 });
  }
}
