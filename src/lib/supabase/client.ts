/**
 * Supabase Browser Client
 *
 * Uses @supabase/supabase-js createClient directly (NOT @supabase/ssr).
 * This stores auth tokens in localStorage by default, which is the most
 * reliable approach for client-side auth in Next.js 16 with Turbopack.
 *
 * The @supabase/ssr createBrowserClient had cookie-sync issues in
 * Next.js 16 Turbopack, causing sessions to be lost after page reload.
 *
 * NOTE: Lazy initialization — client is created on first use, not at module level.
 * This prevents build errors when env vars aren't available during prerendering.
 */

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

let supabaseInstance: ReturnType<typeof createSupabaseClient> | null = null;

function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url || url.includes("placeholder")) {
    // Return a dummy URL during build/prerendering — actual client calls
    // will only be made in the browser or in API routes where env is set.
    return "https://placeholder.supabase.co";
  }
  return url;
}

function getSupabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key || key.includes("placeholder")) {
    return "placeholder-key";
  }
  return key;
}

/**
 * Returns the singleton Supabase client instance.
 * Created lazily on first call — safe to use in Server Components,
 * Client Components, and during build time.
 */
export function createClient() {
  if (!supabaseInstance) {
    supabaseInstance = createSupabaseClient(getSupabaseUrl(), getSupabaseAnonKey(), {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
  }
  return supabaseInstance;
}
