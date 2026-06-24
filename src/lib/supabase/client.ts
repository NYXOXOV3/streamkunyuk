/**
 * Supabase Browser Client
 *
 * Uses @supabase/supabase-js createClient directly (NOT @supabase/ssr).
 * This stores auth tokens in localStorage by default, which is the most
 * reliable approach for client-side auth in Next.js 16 with Turbopack.
 *
 * The @supabase/ssr createBrowserClient had cookie-sync issues in
 * Next.js 16 Turbopack, causing sessions to be lost after page reload.
 */

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Singleton instance — localStorage handles session persistence
const supabaseInstance = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

/**
 * Returns the singleton Supabase client instance.
 * Safe to call multiple times — always returns the same instance.
 */
export function createClient() {
  return supabaseInstance;
}