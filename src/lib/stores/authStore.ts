/**
 * Auth Store (Zustand)
 *
 * Client-side state for the current user's authentication status,
 * profile data, and subscription info. Synced from Supabase on mount.
 *
 * This store is the single source of truth for client-side auth UI
 * (navbar avatar, subscribe badge, guard redirects). Actual auth
 * operations (login, logout, signup) are handled via Server Actions.
 */

import { create } from "zustand";
import type { Profile, Subscription } from "@/lib/supabase/types";

interface AuthState {
  // Auth status
  isAuthenticated: boolean;
  isLoading: boolean;
  userId: string | null;
  email: string | null;

  // User profile
  profile: Profile | null;
  isAdmin: boolean;

  // Subscription
  subscription: Subscription | null;
  isSubscriber: boolean;

  // Actions
  setAuth: (params: {
    userId: string | null;
    email: string | null;
    profile: Profile | null;
    subscription: Subscription | null;
  }) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

const initialState = {
  isAuthenticated: false,
  isLoading: true,
  userId: null,
  email: null,
  profile: null,
  isAdmin: false,
  subscription: null,
  isSubscriber: false,
};

export const useAuthStore = create<AuthState>((set) => ({
  ...initialState,

  setAuth: ({ userId, email, profile, subscription }) =>
    set({
      isAuthenticated: !!userId,
      userId,
      email,
      profile,
      isAdmin: profile?.is_admin ?? false,
      subscription,
      isSubscriber:
        subscription?.status === "active" ||
        subscription?.status === "trialing",
      isLoading: false,
    }),

  setLoading: (loading) => set({ isLoading: loading }),

  reset: () => set({ ...initialState, isLoading: false }),
}));