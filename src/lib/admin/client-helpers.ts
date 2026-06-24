/**
 * Shared admin client-side helpers.
 *
 * All admin pages need to send the user's JWT when calling admin API routes
 * because the server-side assertAdmin() guard reads the Authorization header.
 *
 * Uses the browser-side Supabase client (localStorage-based auth).
 */

import { createClient } from "@/lib/supabase/client";

let cachedHeaders: Promise<HeadersInit> | null = null;

/**
 * Returns auth headers with the current user's access token.
 * Uses a short-lived cache (2s) to avoid calling getSession() on every request.
 */
export async function getAdminHeaders(): Promise<HeadersInit> {
  if (cachedHeaders) return cachedHeaders;

  const promise = (async () => {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.access_token ?? ""}`,
    };
  })();

  cachedHeaders = promise;

  // Invalidate cache after 2 seconds
  setTimeout(() => {
    cachedHeaders = null;
  }, 2000);

  return promise;
}

/**
 * Wrapper around fetch that automatically includes admin auth headers.
 * Use this for all admin API calls from client components.
 */
export async function adminFetch(
  url: string,
  init: RequestInit = {},
): Promise<Response> {
  const headers = await getAdminHeaders();
  return fetch(url, {
    ...init,
    headers: {
      ...headers,
      ...(init.headers instanceof Headers
        ? Object.fromEntries(init.headers.entries())
        : init.headers),
    },
  });
}