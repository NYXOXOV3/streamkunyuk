"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/lib/stores/authStore";
import { Loader2 } from "lucide-react";

/**
 * AuthGuard
 *
 * Client-side wrapper that checks the Zustand auth store.
 * If the user is not authenticated, redirects to /login.
 *
 * Uses useEffect for redirects to avoid "setState during render" errors.
 */

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading } = useAuthStore();

  const redirect = searchParams.get("redirect") || "/login";

  // Redirect if not authenticated — via useEffect to avoid React errors
  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace(redirect);
    }
  }, [isAuthenticated, isLoading, redirect, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-cinema-red animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Show loader while useEffect redirect fires
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-cinema-red animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}