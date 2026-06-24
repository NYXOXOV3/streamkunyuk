/**
 * Supabase Browser Client
 *
 * Uses @supabase/ssr createBrowserClient which stores the auth token
 * in cookies (not localStorage). This is CRITICAL for Vercel deployment
 * where the server-side middleware needs to read the session cookie
 * to maintain auth state across page loads.
 *
 * Cookie-based auth ensures that:
 * 1. Login → cookie ter-set → server bisa baca → halaman render sebagai authenticated
 * 2. Middleware bisa refresh token via cookie
 * 3. Tidak ada mismatch antara client state & server state
 */

import { createBrowserClient } from "@supabase/ssr";

let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null;

function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url || url.includes("placeholder")) return "https://placeholder.supabase.co";
  return url;
}

function getSupabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key || key.includes("placeholder")) return "placeholder-key";
  return key;
}

/**
 * Returns the singleton Supabase browser client instance.
 * Uses cookie-based auth (localStorage fallback jika cookies tidak tersedia).
 */
export function createClient() {
  if (!supabaseInstance) {
    supabaseInstance = createBrowserClient(getSupabaseUrl(), getSupabaseAnonKey(), {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        // FlowType: "pkce" ensures the auth code exchange works on Vercel Edge
        flowType: "pkce",
      },
    });
  }
  return supabaseInstance;
}
