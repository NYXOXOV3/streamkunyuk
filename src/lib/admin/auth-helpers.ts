import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Extract the Bearer token from the Authorization header.
 */
export function getToken(req: NextRequest): string | null {
  const h = req.headers.get("authorization");
  return h?.startsWith("Bearer ") ? h.slice(7) : null;
}

/**
 * Assert that the current request is from an authenticated admin user.
 * Returns a 403 JSON response if the check fails.
 * Returns `null` (void) on success so the caller can continue.
 */
export async function assertAdmin(
  request: NextRequest,
): Promise<NextResponse | null> {
  try {
    const token = getToken(request);
    if (!token) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supabase = await createAdminClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);
    if (error || !user) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return null; // auth passed
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}