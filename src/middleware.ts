import { NextResponse, type NextRequest } from "next/server";

/**
 * StreamVault Middleware
 *
 * Auth protection is handled client-side via AuthGuard / AdminGuard.
 * The middleware only handles:
 * 1. Supabase placeholder bypass (dev mode)
 * 2. Redirecting authenticated users away from auth pages
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // If Supabase is not configured, pass through (development mode)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")) {
    return NextResponse.next();
  }

  // Let client-side guards (AuthGuard, AdminGuard) handle all auth
  // This avoids cookie-sync issues between browser client and middleware
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|images/|icons/|api/).*)",
  ],
};