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

function getEnvVar(name: string, fallback: string): string {
  const val = process.env[name];
  if (!val || val.includes("placeholder")) return fallback;
  return val;
}

export async function createAdminClient() {
  const cookieStore = await cookies();

  return createServerClient(
    getEnvVar("NEXT_PUBLIC_SUPABASE_URL", "https://placeholder.supabase.co"),
    getEnvVar("SUPABASE_SERVICE_ROLE_KEY", "placeholder-key"),
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