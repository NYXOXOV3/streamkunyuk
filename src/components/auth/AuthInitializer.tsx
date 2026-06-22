"use client";

/**
 * Auth Initializer
 *
 * Fetches session on mount, syncs into Zustand auth store.
 * Listens for auth state changes (login, logout, token refresh).
 *
 * Uses the singleton client from @/lib/supabase/client which
 * persists sessions via localStorage.
 */

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/stores/authStore";
import type { Profile, Subscription } from "@/lib/supabase/types";

export function AuthInitializer() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const setLoading = useAuthStore((s) => s.setLoading);

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    async function loadSession() {
      try {
        // getSession() reads from localStorage (via GoTrue internal storage)
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user || !mounted) {
          setAuth({ userId: null, email: null, profile: null, subscription: null });
          return;
        }

        await fetchProfile(session.user.id, session.user.email!);
      } catch (err) {
        console.error("[AuthInitializer] Failed to load session:", err);
        setAuth({ userId: null, email: null, profile: null, subscription: null });
      } finally {
        if (mounted) setLoading(false);
      }
    }

    async function fetchProfile(userId: string, email: string) {
      try {
        const [profileRes, subRes] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", userId).single(),
          supabase.from("subscriptions").select("*, subscription_tier(*)").eq("user_id", userId).single(),
        ]);

        if (mounted) {
          setAuth({
            userId,
            email,
            profile: (profileRes.data as Profile) ?? null,
            subscription: (subRes.data as Subscription) ?? null,
          });
        }
      } catch (err) {
        console.error("[AuthInitializer] Failed to fetch profile:", err);
        if (mounted) {
          setAuth({ userId, email, profile: null, subscription: null });
        }
      }
    }

    setLoading(true);
    loadSession();

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        console.log("[AuthInitializer] Auth event:", event);

        if (!session?.user) {
          // Signed out or session expired
          setAuth({ userId: null, email: null, profile: null, subscription: null });
          return;
        }

        // Signed in or token refreshed — refetch profile
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