"use client";

/**
 * Auth initializer component.
 *
 * Fetches the current session and profile on mount, then syncs
 * into the Zustand auth store. Place this inside the root layout
 * so it runs exactly once per app load.
 *
 * Gracefully handles missing Supabase configuration.
 */

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/stores/authStore";
import type { Profile, Subscription } from "@/lib/supabase/types";

const isSupabaseConfigured =
  typeof window !== "undefined" &&
  !window.location.hostname.includes("placeholder");

export function AuthInitializer() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const setLoading = useAuthStore((s) => s.setLoading);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // Dev mode: no Supabase — mark as unauthenticated
      setAuth({
        userId: null,
        email: null,
        profile: null,
        subscription: null,
      });
      return;
    }

    let mounted = true;

    async function init() {
      try {
        const supabase = createClient();

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user || !mounted) {
          setAuth({
            userId: null,
            email: null,
            profile: null,
            subscription: null,
          });
          return;
        }

        const userId = session.user.id;
        const email = session.user.email;

        // Fetch profile and subscription in parallel
        const [profileRes, subRes] = await Promise.all([
          supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .single(),
          supabase
            .from("subscriptions")
            .select("*, subscription_tier(*)")
            .eq("user_id", userId)
            .single(),
        ]);

        const profile: Profile | null = profileRes.data ?? null;
        const subscription: Subscription | null = subRes.data ?? null;

        if (mounted) {
          setAuth({ userId, email, profile, subscription });
        }
      } catch {
        if (mounted) {
          setAuth({
            userId: null,
            email: null,
            profile: null,
            subscription: null,
          });
        }
      }
    }

    setLoading(true);
    init();

    // Listen for auth state changes
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user || !mounted) {
        setAuth({
          userId: null,
          email: null,
          profile: null,
          subscription: null,
        });
        return;
      }

      const userId = session.user.id;
      const email = session.user.email;

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      const { data: sub } = await supabase
        .from("subscriptions")
        .select("*, subscription_tier(*)")
        .eq("user_id", userId)
        .single();

      if (mounted) {
        setAuth({
          userId,
          email,
          profile: profile ?? null,
          subscription: sub ?? null,
        });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setAuth, setLoading]);

  return null;
}