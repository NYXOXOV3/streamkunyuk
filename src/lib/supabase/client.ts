/**
 * Supabase Browser Client
 *
 * Creates a Supabase client for use in Client Components, middleware,
 * and client-side hooks. Uses @supabase/ssr createBrowserClient
 * to properly handle cookie-based auth sessions.
 *
 * USAGE:
 *   import { createClient } from "@/lib/supabase/client";
 *   const supabase = createClient();
 *   const { data: { user } } = await supabase.auth.getUser();
 */

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}