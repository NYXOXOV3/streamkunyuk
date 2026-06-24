import { NextResponse, type NextRequest } from "next/server";

/**
 * StreamVault Middleware
 *
 * Auth is handled client-side via AuthGuard + localStorage.
 * Middleware only passes through all requests.
 *
 * We don't try to sync cookies with localStorage here because:
 * - Supabase browser client uses localStorage (not cookies)
 * - Client-side AuthInitializer handles session detection
 * - Admin/API routes use their own auth checks
 */
export async function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|images/|icons/).*)",
  ],
};
