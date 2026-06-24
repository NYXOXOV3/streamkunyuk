import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/auth/profile
 *
 * Returns the current user's profile using the service_role key.
 * This BYPASSES RLS — ensures admin users are correctly identified.
 *
 * The user's JWT is read from the Authorization header (set by the browser).
 */
export async function GET(request: NextRequest) {
  try {
    // Extract user JWT from Authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.slice(7);

    // Verify the token and get user
    const supabase = await createAdminClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Fetch profile using service_role (bypasses RLS)
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url, is_admin, created_at")
      .eq("id", user.id)
      .maybeSingle();

    // Fetch subscription
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("*, subscription_tier(*)")
      .eq("user_id", user.id)
      .maybeSingle();

    return NextResponse.json({
      userId: user.id,
      email: user.email,
      profile: profile ?? null,
      subscription: sub ?? null,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
