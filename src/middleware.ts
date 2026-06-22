import { createMiddlewareClient } from "@/lib/supabase/middleware";
import { NextResponse, type NextRequest } from "next/server";

// Routes that require authentication
const PROTECTED_PATHS = ["/profile", "/watch", "/my-list", "/history"];

export async function middleware(request: NextRequest) {
  // If Supabase is not configured, pass through (development mode)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  try {
    const { supabase, response } = await createMiddlewareClient(request);
    supabaseResponse = response;

    // Refresh the session
    const { data: { user } } = await supabase.auth.getUser();
    const { pathname } = request.nextUrl;

    // Protected routes: require auth
    const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));

    if (isProtected && !user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }

    // Admin routes: require auth + is_admin
    if (pathname.startsWith("/admin")) {
      if (!user) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("redirect", pathname);
        return NextResponse.redirect(url);
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();

      if (!profile?.is_admin) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }

    // Redirect authenticated users away from auth pages
    if ((pathname === "/login" || pathname === "/register") && user) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return supabaseResponse;
  } catch {
    // If Supabase is unreachable, pass through
    return supabaseResponse;
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|images/|icons/|api/).*)",
  ],
};