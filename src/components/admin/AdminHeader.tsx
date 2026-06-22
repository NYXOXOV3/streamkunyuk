"use client";

import Link from "next/link";
import { useAuthStore } from "@/lib/stores/authStore";
import { Button } from "@/components/ui/button";
import { ArrowLeft, LogOut, User } from "lucide-react";
import { signOut } from "@/lib/auth/actions";

export function AdminHeader({ title }: { title?: string }) {
  const { profile, email } = useAuthStore();

  return (
    <header className="h-14 border-b border-cinema-border bg-cinema-surface/50 flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-muted-foreground hover:text-foreground"
        >
          <Link href="/">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Site
          </Link>
        </Button>
        {title && (
          <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-foreground">
            {profile?.display_name || "Admin"}
          </p>
          <p className="text-xs text-muted-foreground">{email}</p>
        </div>
        <form action={async () => { await signOut(); }}>
          <Button
            type="submit"
            variant="outline"
            size="sm"
            className="border-cinema-border text-muted-foreground hover:text-destructive hover:border-destructive"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </header>
  );
}