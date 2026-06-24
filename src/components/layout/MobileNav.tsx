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
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-cinema-bg/80 backdrop-blur-2xl border-t border-white/[0.06]">
      <div className="flex items-center justify-around h-[60px] max-w-lg mx-auto px-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-0.5 min-w-[60px] transition-colors"
            >
              {isActive ? (
                <div className="flex flex-col items-center gap-0.5 bg-cinema-red/10 rounded-xl px-4 py-1.5">
                  <Icon className="w-[22px] h-[22px] text-cinema-red" />
                  <div className="w-1 h-1 bg-cinema-red rounded-full mt-0.5" />
                  <span className="text-[10px] font-medium tracking-wide text-cinema-red">
                    {label}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-0.5 px-4 py-1.5">
                  <Icon className="w-[22px] h-[22px] text-muted-foreground/70" />
                  <span className="text-[10px] font-medium tracking-wide text-muted-foreground/70">
                    {label}
                  </span>
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {/* Safe area padding for iOS */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}