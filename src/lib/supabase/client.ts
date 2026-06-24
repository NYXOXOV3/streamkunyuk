/**
 * Supabase Browser Client
 *
 * Uses @supabase/supabase-js createClient directly.
 * Stores auth tokens in localStorage (not cookies).
 *
 * Kenapa pake ini, bukan @supabase/ssr createBrowserClient?
 * - Di Vercel, middleware pake Edge Runtime — cookies middleware
 *   dan localStorage client ga bisa sync.
 * - Pake @supabase/supabase-js lebih reliable untuk client-side auth
 *   karena localStorage persist antar page load.
 * - Server-side session di-handle oleh getUser() di AuthInitializer
 *   yang pake access token dari localStorage.
 */

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

let supabaseInstance: ReturnType<typeof createSupabaseClient> | null = null;

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
 * Returns singleton Supabase browser client.
 * Session persists in localStorage — reliable across page loads.
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
