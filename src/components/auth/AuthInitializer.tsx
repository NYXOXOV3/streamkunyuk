"use client";

/**
 * Auth Initializer
 *
 * Fetches session on mount, syncs into Zustand auth store.
 * Listens for auth state changes (login, logout, token refresh).
 */

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/stores/authStore";
import type { Profile, Subscription } from "@/lib/supabase/types";

export function AuthInitializer() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const setLoading = useAuthStore((s) => s.setLoading);
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user || !mounted) {
          setAuth({ userId: null, email: null, profile: null, subscription: null });
          return;
        }

        await fetchProfile(session.user.id, session.user.email!);
      } catch {
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
      } catch {
        if (mounted) {
          setAuth({ userId, email, profile: null, subscription: null });
        }
      }
    }

    setLoading(true);
    loadSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (!session?.user) {
          setAuth({ userId: null, email: null, profile: null, subscription: null });
          return;
        }

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