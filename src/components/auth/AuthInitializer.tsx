"use client";

/**
 * Auth Initializer
 *
 * Membaca session dari localStorage (via @supabase/supabase-js).
 * getSession() langsung return tanpa network call kalo session masih valid.
 * Fallback ke getUser() kalo getSession() gagal.
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

    async function load() {
      setLoading(true);

      try {
        // getSession() reads from localStorage — instant, no network
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user && mounted) {
          await setUser(session.user.id, session.user.email!);
          return;
        }

        // Fallback: getUser() — validates token with server
        const { data: { user } } = await supabase.auth.getUser();
        if (user && mounted) {
          await setUser(user.id, user.email!);
          return;
        }
      } catch { /* no session */ }

      if (mounted) {
        setAuth({ userId: null, email: null, profile: null, subscription: null });
        setLoading(false);
      }
    }

    async function setUser(userId: string, email: string) {
      // Set auth immediately (so UI renders fast), then fetch profile in background
      setAuth({ userId, email, profile: null, subscription: null });

      try {
        const [profileRes, subRes] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
          supabase.from("subscriptions").select("*, subscription_tier(*)").eq("user_id", userId).maybeSingle(),
        ]);

        if (mounted) {
          setAuth({
            userId, email,
            profile: (profileRes.data as unknown as Profile) ?? null,
            subscription: (subRes.data as unknown as Subscription) ?? null,
          });
        }
      } catch {
        if (mounted) {
          setAuth({ userId, email, profile: null, subscription: null });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === "SIGNED_OUT" || !session?.user) {
          setAuth({ userId: null, email: null, profile: null, subscription: null });
          return;
        }

        await setUser(session.user.id, session.user.email!);
      },
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setAuth, setLoading]);

  return null;
}
