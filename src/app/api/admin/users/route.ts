import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface UserSubscription {
  id: string;
  status: string;
  current_period_end: string | null;
  subscription_tier: {
    display_name: string;
  } | null;
}

interface UserRow {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  created_at: string;
  subscriptions: UserSubscription[];
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createAdminClient();
    const search = request.nextUrl.searchParams.get("search") || undefined;

    let query = supabase
      .from("profiles")
      .select(
        `
        id, display_name, avatar_url, is_admin, created_at,
        subscriptions(
          id, status, current_period_end,
          subscription_tier:id ( display_name )
        )
      `,
      )
      .order("created_at", { ascending: false });

    if (search) {
      query = query.or(
        `display_name.ilike.%${search}%,email.ilike.%${search}%`,
      );
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      data: (data ?? []) as UserRow[],
      error: null,
    });
  } catch (e) {
    return NextResponse.json({
      data: [],
      error: (e as Error).message,
    });
  }
}