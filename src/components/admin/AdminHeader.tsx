"use client";

import Link from "next/link";
import { useAuthStore } from "@/lib/stores/authStore";
import { AdminMobileNav } from "@/components/admin/AdminSidebar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, LogOut, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function AdminHeader({ title }: { title?: string }) {
  const { profile, email } = useAuthStore();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    useAuthStore.getState().reset();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="h-14 border-b border-cinema-border bg-cinema-surface/80 backdrop-blur-sm flex items-center justify-between px-4 md:px-6 shrink-0 gap-2">
      <div className="flex items-center gap-2 min-w-0">
        {/* Mobile hamburger */}
        <AdminMobileNav />

        {/* Back to site */}
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-muted-foreground hover:text-foreground hidden sm:flex"
        >
          <Link href="/">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            <span className="hidden md:inline">Back to Site</span>
          </Link>
        </Button>

        {title && (
          <h1 className="text-base font-semibold text-foreground truncate">
            {title}
          </h1>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-foreground leading-tight">
            {profile?.display_name || "Admin"}
          </p>
          <p className="text-[11px] text-muted-foreground leading-tight">{email}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleSignOut}
          className="border-cinema-border text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-9 w-9"
          aria-label="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
}