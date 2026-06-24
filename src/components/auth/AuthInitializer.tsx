"use client";

/**
 * Auth Initializer
 *
 * Simplified & robust version:
 * 1. getSession() — reads session from cookies immediately (fast, local)
 * 2. If found → fetch profile
 * 3. Listen for onAuthStateChange events
 *
 * Untuk AdminGuard: isLoading akan false setelah session di-cek,
 * jadi halaman admin gak bakal muter terus.
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
      // getSession() reads cookies — fast, no network call
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user || !mounted) {
        if (mounted) {
          setAuth({ userId: null, email: null, profile: null, subscription: null });
          setLoading(false);
        }
        return;
      }

      // Session found — fetch profile
      try {
        const [profileRes, subRes] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", session.user.id).maybeSingle(),
          supabase
            .from("subscriptions")
            .select("*, subscription_tier(*)")
            .eq("user_id", session.user.id)
            .maybeSingle(),
        ]);

        if (mounted) {
          setAuth({
            userId: session.user.id,
            email: session.user.email!,
            profile: (profileRes.data as unknown as Profile) ?? null,
            subscription: (subRes.data as unknown as Subscription) ?? null,
          });
        }
      } catch {
        if (mounted) {
          setAuth({
            userId: session.user.id,
            email: session.user.email!,
            profile: null,
            subscription: null,
          });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    setLoading(true);
    loadSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: any) => {
        if (!mounted) return;

        if (event === "SIGNED_OUT" || !session?.user) {
          setAuth({ userId: null, email: null, profile: null, subscription: null });
          return;
        }

        // Re-fetch profile on login / token refresh
        try {
          const [profileRes, subRes] = await Promise.all([
            supabase.from("profiles").select("*").eq("id", session.user.id).maybeSingle(),
            supabase
              .from("subscriptions")
              .select("*, subscription_tier(*)")
              .eq("user_id", session.user.id)
              .maybeSingle(),
          ]);

          if (mounted) {
            setAuth({
              userId: session.user.id,
              email: session.user.email!,
              profile: (profileRes.data as unknown as Profile) ?? null,
              subscription: (subRes.data as unknown as Subscription) ?? null,
            });
          }
        } catch {
          if (mounted) {
            setAuth({
              userId: session.user.id,
              email: session.user.email!,
              profile: null,
              subscription: null,
            });
          }
        }
      },
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setAuth, setLoading]);

  return null;
}
