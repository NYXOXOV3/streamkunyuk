import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareClient } from "@/lib/supabase/middleware";

/**
 * StreamVault Middleware
 *
 * 1. Refreshes Supabase session cookies on every request
 * 2. Passes through all auth checks (handled client-side)
 *
 * Session refresh is critical on Vercel Edge to keep the
 * auth cookie in sync with the actual session state.
 */
export async function middleware(request: NextRequest) {
  // If Supabase is not configured, pass through
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")) {
    return NextResponse.next();
  }

  try {
    // Refresh session cookie — this is required for SSR to work
    // on Vercel where the edge network handles requests
    const { supabase, response } = await createMiddlewareClient(request);
    await supabase.auth.getSession();
    return response;
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|images/|icons/).*)",
  ],
};
