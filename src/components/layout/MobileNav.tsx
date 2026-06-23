"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Film, Bookmark, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/browse", label: "Browse", icon: Film },
  { href: "/search", label: "Search", icon: Search },
  { href: "/my-list", label: "My List", icon: Bookmark },
  { href: "/profile", label: "Profile", icon: User },
];

export function MobileNav() {
  const pathname = usePathname();

  // Hide on auth pages
  if (pathname.startsWith("/login") || pathname.startsWith("/register")) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-cinema-surface/90 backdrop-blur-xl border-t border-cinema-border/50">
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto px-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors min-w-[56px]",
                isActive
                  ? "text-cinema-red"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="w-5 h-5" />
              {isActive && (
                <div className="w-1 h-1 rounded-full bg-cinema-red mt-0.5" />
              )}
              <span
                className={cn(
                  "text-[10px] font-medium tracking-wide",
                  isActive && "text-cinema-red font-semibold",
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Safe area padding for iOS */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}