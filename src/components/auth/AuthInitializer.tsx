"use client";

/**
 * Auth Initializer
 *
 * 1. getSession() dari localStorage (via @supabase/supabase-js)
 * 2. Kalo dapet token, fetch profile via /api/auth/profile
 *    (pake service_role key — bypass RLS — jadi data admin kebaca)
 * 3. Set auth store
 */

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/stores/authStore";

export function AuthInitializer() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const setLoading = useAuthStore((s) => s.setLoading);

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    async function load() {
      setLoading(true);

      try {
        // Get session from localStorage
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user && mounted) {
          setAuth({ userId: null, email: null, profile: null, subscription: null });
          setLoading(false);
          return;
        }

        if (!session) {
          if (mounted) {
            setAuth({ userId: null, email: null, profile: null, subscription: null });
            setLoading(false);
          }
          return;
        }

        // Fetch profile via API (bypasses RLS with service_role key)
        const res = await fetch("/api/auth/profile", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        if (res.ok && mounted) {
          const data = await res.json();
          setAuth({
            userId: data.userId,
            email: data.email,
            profile: data.profile,
            subscription: data.subscription,
          });
        } else if (mounted) {
          // Fallback: set with userId only
          setAuth({
            userId: session.user.id,
            email: session.user.email!,
            profile: null,
            subscription: null,
          });
        }
      } catch {
        if (mounted) {
          setAuth({ userId: null, email: null, profile: null, subscription: null });
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

        // Fetch profile via API
        setLoading(true);
        try {
          const res = await fetch("/api/auth/profile", {
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
          if (res.ok && mounted) {
            const data = await res.json();
            setAuth({
              userId: data.userId,
              email: data.email,
              profile: data.profile,
              subscription: data.subscription,
            });
          } else if (mounted) {
            setAuth({
              userId: session.user.id,
              email: session.user.email!,
              profile: null,
              subscription: null,
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
      },
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setAuth, setLoading]);

  return null;
}
