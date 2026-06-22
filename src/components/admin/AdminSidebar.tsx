"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/lib/stores/uiStore";
import {
  LayoutDashboard,
  Film,
  Key,
  Users,
  ListVideo,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/content", label: "Content", icon: Film },
  { href: "/admin/content/new", label: "Add Content", icon: ListVideo },
  { href: "/admin/content/tmdb-import", label: "TMDB Import", icon: ListVideo },
  { href: "/admin/api-config", label: "API Config", icon: Key },
  { href: "/admin/users", label: "Users", icon: Users },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { isSidebarOpen, toggleSidebar } = useUIStore();

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col h-screen sticky top-0 border-r border-cinema-border bg-sidebar transition-all duration-200",
        isSidebarOpen ? "w-60" : "w-16",
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 h-16 px-4 border-b border-cinema-border shrink-0">
        <div className="w-8 h-8 rounded-md bg-cinema-red flex items-center justify-center shrink-0 glow-red">
          <Play className="w-4 h-4 text-white ml-0.5" />
        </div>
        {isSidebarOpen && (
          <div className="flex items-center gap-1 overflow-hidden">
            <span className="text-sm font-bold text-white truncate">
              StreamVault
            </span>
            <ShieldCheck className="w-3.5 h-3.5 text-cinema-gold shrink-0" />
          </div>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto scrollbar-thin">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-cinema-red/10 text-cinema-red"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent",
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {isSidebarOpen && (
                <span className="truncate">{label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="p-2 border-t border-cinema-border shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="w-full justify-center text-muted-foreground hover:text-foreground hover:bg-accent"
        >
          {isSidebarOpen ? (
            <ChevronLeft className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </Button>
      </div>
    </aside>
  );
}