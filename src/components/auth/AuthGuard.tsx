"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/lib/stores/authStore";
import { Loader2 } from "lucide-react";

/**
 * AuthGuard
 *
 * Client-side wrapper that checks the Zustand auth store.
 * If the user is not authenticated, redirects to /login.
 *
 * Place this around any route that requires authentication:
 *   <AuthGuard><ProfilePage /></AuthGuard>
 *
 * Works in tandem with the server-side middleware for defense-in-depth.
 * The middleware handles the redirect on first load; this guard
 * handles SPA navigations and race conditions.
 */

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading } = useAuthStore();

  // Derive state instead of using setState in effect
  const redirect = searchParams.get("redirect") || "/login";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-cinema-red animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    router.replace(redirect);
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-cinema-red animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}