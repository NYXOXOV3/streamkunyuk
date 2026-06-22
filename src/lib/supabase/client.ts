/**
 * Supabase Browser Client
 *
 * Creates a Supabase client for use in Client Components.
 * Uses @supabase/ssr createBrowserClient with explicit cookie
 * storage so auth tokens are shared with middleware/server.
 */

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return document.cookie
            .split("; ")
            .map((c) => {
              const [name, ...rest] = c.split("=");
              return { name, value: rest.join("=") };
            });
        },
        setAll(cookies) {
          cookies.forEach(({ name, value, options }) => {
            let cookieStr = `${name}=${value}`;
            if (options?.maxAge) cookieStr += `; max-age=${options.maxAge}`;
            if (options?.path) cookieStr += `; path=${options.path}`;
            if (options?.domain) cookieStr += `; domain=${options.domain}`;
            if (options?.sameSite) cookieStr += `; samesite=${options.sameSite}`;
            if (options?.secure) cookieStr += `; secure`;
            // Always allow cookie access
            document.cookie = cookieStr;
          });
        },
      },
    },
  );
}