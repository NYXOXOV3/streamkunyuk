import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface UserRow {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  created_at: string;
  subscription_status: string | null;
  subscription_tier: string | null;
  subscription_end: string | null;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createAdminClient();
    const search = request.nextUrl.searchParams.get("search") || undefined;

    // Fetch profiles (no join with subscriptions — avoids schema cache error)
    let profilesQuery = supabase
      .from("profiles")
      .select("id, display_name, avatar_url, is_admin, created_at")
      .order("created_at", { ascending: false });

    if (search) {
      profilesQuery = profilesQuery.or(
        `display_name.ilike.%${search}%`,
      );
    }

    const { data: profiles, error: profilesError } = await profilesQuery;
    if (profilesError) throw profilesError;

    // Fetch all subscriptions separately
    const { data: subs, error: subsError } = await supabase
      .from("subscriptions")
      .select("user_id, status, current_period_end, subscription_tier:subscription_tiers(display_name)")
      .eq("status", "active");

    if (subsError) throw subsError;

    // Build a map of user_id -> subscription info
    const subMap = new Map<string, { status: string; tier: string | null; end: string | null }>();
    for (const sub of subs ?? []) {
      subMap.set(sub.user_id, {
        status: sub.status,
        tier: (sub.subscription_tier as { display_name: string } | null)?.display_name ?? null,
        end: sub.current_period_end,
      });
    }

    // Merge
    const data: UserRow[] = (profiles ?? []).map((p) => {
      const sub = subMap.get(p.id);
      return {
        id: p.id,
        display_name: p.display_name,
        avatar_url: p.avatar_url,
        is_admin: p.is_admin,
        created_at: p.created_at,
        subscription_status: sub?.status ?? null,
        subscription_tier: sub?.tier ?? null,
        subscription_end: sub?.end ?? null,
      };
    });

    return NextResponse.json({ data, error: null });
  } catch (e) {
    return NextResponse.json({
      data: [],
      error: (e as Error).message,
    });
  }
}