import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Auth Callback Route
 *
 * Supabase OAuth providers redirect here after authentication.
 * This route exchanges the auth code for a session and then
 * redirects the user to the home page (or the original redirect URL).
 *
 * URL: /auth/callback?code=... (set in Supabase Auth config)
 */

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const redirect = requestUrl.searchParams.get("redirect") || "/";

    if (code) {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error("[AuthCallback] Code exchange failed:", error.message);
      }
    }

    return NextResponse.redirect(new URL(redirect, requestUrl.origin));
  } catch (e) {
    console.error("[AuthCallback] Error:", e);
    return NextResponse.redirect(new URL("/login?error=callback", request.url));
  }
}