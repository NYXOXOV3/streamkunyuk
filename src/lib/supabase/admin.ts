/**
 * Supabase Admin Client (Service Role)
 *
 * Creates a Supabase client with the SERVICE_ROLE key.
 * This client BYPASSES Row Level Security (RLS) and should ONLY be used in:
 *   - Supabase Edge Functions
 *   - Server-side admin API routes
 *   - Server Actions that require elevated access
 *
 * NEVER expose the SERVICE_ROLE key to the client.
 * NEVER use this client in Client Components or middleware.
 *
 * USAGE:
 *   import { createAdminClient } from "@/lib/supabase/admin";
 *   const supabase = createAdminClient();
 *   const { data } = await supabase.from('contents').select('*');
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createAdminClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Ignore in Server Component context
          }
        },
      },
    },
  );
}