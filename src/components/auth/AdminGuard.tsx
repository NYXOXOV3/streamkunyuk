"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/authStore";
import { Loader2, ShieldAlert } from "lucide-react";

/**
 * AdminGuard
 *
 * Client-side wrapper that checks:
 *   1. The user is authenticated
 *   2. The user's profile has is_admin = true
 *
 * If either check fails, redirects to /.
 * Uses useEffect for redirects to avoid "setState during render" errors.
 */

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isAdmin, isLoading } = useAuthStore();

  // Redirect if not authenticated — via useEffect to avoid React errors
  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  // Redirect if not admin — via useEffect
  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    if (!isAdmin) {
      router.replace("/");
    }
  }, [isAuthenticated, isAdmin, isLoading, router]);

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

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4 text-center">
        <ShieldAlert className="w-16 h-16 text-destructive" />
        <h2 className="text-xl font-semibold text-foreground">
          Access Denied
        </h2>
        <p className="text-sm text-muted-foreground max-w-md">
          You do not have admin privileges. Redirecting to the home
          page...
        </p>
      </div>
    );
  }

  return <>{children}</>;
}