"use client";

/**
 * Auth Initializer
 *
 * Fetches session on mount, syncs into Zustand auth store.
 * Listens for auth state changes (login, logout, token refresh).
 *
 * Uses two strategies:
 *   1. Initial load: tries getUser() (more reliable than getSession)
 *   2. Listens for onAuthStateChange events for real-time updates
 *
 * Retries up to 3 times if session fetch fails (handles race conditions
 * after login redirect on slow networks/Vercel edge).
 */

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/stores/authStore";
import type { Profile, Subscription } from "@/lib/supabase/types";

export function AuthInitializer() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const setLoading = useAuthStore((s) => s.setLoading);
  const retryCount = useRef(0);
  const MAX_RETRIES = 3;

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    async function fetchProfile(userId: string, email: string) {
      try {
        // Use .maybeSingle() instead of .single() to avoid error when no row exists
        const [profileRes, subRes] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
          supabase
            .from("subscriptions")
            .select("*, subscription_tier(*)")
            .eq("user_id", userId)
            .maybeSingle(),
        ]);

        if (mounted) {
          setAuth({
            userId,
            email,
            profile: (profileRes.data as unknown as Profile) ?? null,
            subscription: (subRes.data as unknown as Subscription) ?? null,
          });
        }
      } catch (err) {
        console.error("[AuthInitializer] Failed to fetch profile:", err);
        if (mounted) {
          setAuth({ userId, email, profile: null, subscription: null });
        }
      }
    }

    async function loadSession() {
      try {
        // getUser() is more reliable than getSession() because it actually
        // validates the token with the server, not just reads localStorage
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user || !mounted) {
          // Try getSession as fallback (faster for cached sessions)
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session?.user && mounted) {
            await fetchProfile(session.user.id, session.user.email!);
          } else if (mounted) {
            if (retryCount.current < MAX_RETRIES) {
              // Retry — handles race condition after login redirect on slow networks
              retryCount.current++;
              setTimeout(loadSession, 500 * retryCount.current);
              return;
            }
            setAuth({ userId: null, email: null, profile: null, subscription: null });
          }
          return;
        }

        await fetchProfile(user.id, user.email!);
      } catch (err) {
        console.error("[AuthInitializer] Session error:", err);
        if (retryCount.current < MAX_RETRIES) {
          retryCount.current++;
          setTimeout(loadSession, 500 * retryCount.current);
          return;
        }
        if (mounted) {
          setAuth({ userId: null, email: null, profile: null, subscription: null });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    setLoading(true);
    loadSession();

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: any) => {
        if (!mounted) return;

        if (event === "SIGNED_OUT" || !session?.user) {
          setAuth({ userId: null, email: null, profile: null, subscription: null });
          return;
        }

        // Signed in, token refreshed, or user updated
        retryCount.current = 0; // reset retry counter on successful event
        await fetchProfile(session.user.id, session.user.email!);
      },
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
