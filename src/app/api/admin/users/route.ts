import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ---------- Helper: verify request is from an admin ----------
async function isAdmin(req: NextRequest): Promise<boolean> {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) return false;
    const token = authHeader.slice(7);

    const supabase = await createAdminClient();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return false;

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();
    return profile?.is_admin === true;
  } catch {
    return false;
  }
}

// ---------- Helper: get current user's JWT from request ----------
function getToken(req: NextRequest): string | null {
  const h = req.headers.get("authorization");
  return h?.startsWith("Bearer ") ? h.slice(7) : null;
}

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

// ------------------------------------------------------------------
// PATCH  /api/admin/users?id=<uuid>  — update display_name / is_admin
// ------------------------------------------------------------------
export async function PATCH(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supabase = await createAdminClient();
    const userId = request.nextUrl.searchParams.get("id");
    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};
    if (typeof body.display_name === "string") updates.display_name = body.display_name;
    if (typeof body.is_admin === "boolean") updates.is_admin = body.is_admin;
    if (typeof body.avatar_url === "string") updates.avatar_url = body.avatar_url;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select("id, display_name, avatar_url, is_admin, created_at")
      .single();

    if (error) throw error;

    return NextResponse.json({ data, error: null });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

// ------------------------------------------------------------------
// DELETE  /api/admin/users?id=<uuid>  — delete a user's profile & auth
// ------------------------------------------------------------------
export async function DELETE(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supabase = await createAdminClient();
    const userId = request.nextUrl.searchParams.get("id");
    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    // Prevent self-deletion
    const token = getToken(request);
    if (token) {
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user?.id === userId) {
        return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
      }
    }

    // Delete profile first (RLS won't block service role)
    await supabase.from("profiles").delete().eq("id", userId);
    // Delete auth user via admin API
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);
    if (authError) throw authError;

    return NextResponse.json({ data: { deleted: true }, error: null });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}