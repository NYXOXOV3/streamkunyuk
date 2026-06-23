"use client";

import { useState } from "react";
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
  PanelLeftClose,
  PanelLeftOpen,
  Play,
  Image,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/content", label: "Content", icon: Film },
  { href: "/admin/content/new", label: "Add Content", icon: ListVideo },
  { href: "/admin/content/tmdb-import", label: "TMDB Import", icon: ListVideo },
  { href: "/admin/banners", label: "Banners", icon: Image },
  { href: "/admin/api-config", label: "API Config", icon: Key },
  { href: "/admin/users", label: "Users", icon: Users },
];

// ---------------------------------------------------------------------------
// Nav link item (shared between desktop sidebar and mobile sheet)
// ---------------------------------------------------------------------------

function SidebarNavLink({
  href,
  label,
  icon: Icon,
  isActive,
  collapsed,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  isActive: boolean;
  collapsed?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
        isActive
          ? "bg-cinema-red/10 text-cinema-red before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-0.5 before:h-5 before:bg-cinema-red before:rounded-r"
          : "text-muted-foreground hover:text-foreground hover:bg-accent",
      )}
    >
      <Icon className="w-5 h-5 shrink-0" />
      {collapsed !== false && <span className="truncate">{label}</span>}
      {collapsed === true && (
        <span className="pointer-events-none absolute left-full ml-3 px-2.5 py-1.5 rounded-md bg-foreground text-background text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-lg">
          {label}
        </span>
      )}
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Desktop Sidebar
// ---------------------------------------------------------------------------

export function AdminSidebar() {
  const pathname = usePathname();
  const { isSidebarOpen, toggleSidebar } = useUIStore();

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col h-screen sticky top-0 border-r border-cinema-border bg-sidebar transition-all duration-200",
        isSidebarOpen ? "w-56" : "w-16",
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 h-14 px-4 border-b border-cinema-border shrink-0">
        <div className="w-7 h-7 rounded-md bg-cinema-red flex items-center justify-center shrink-0 shadow-md shadow-cinema-red/20">
          <Play className="w-3.5 h-3.5 text-white ml-0.5" />
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
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto scrollbar-thin">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(href);

          return (
            <SidebarNavLink
              key={href}
              href={href}
              label={label}
              icon={Icon}
              isActive={isActive}
              collapsed={!isSidebarOpen}
            />
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="p-2 border-t border-cinema-border shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="w-full justify-center text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg"
          aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="w-4 h-4" />
          ) : (
            <PanelLeftOpen className="w-4 h-4" />
          )}
        </Button>
      </div>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// Mobile Admin Nav (hamburger in header + sheet)
// ---------------------------------------------------------------------------

export function AdminMobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Hamburger button — rendered in the header */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden p-2 -ml-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
        aria-label="Open admin menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64 bg-cinema-surface border-cinema-border p-0 rounded-xl">
          <SheetHeader className="px-4 pt-5 pb-3 border-b border-cinema-border">
            <SheetTitle className="flex items-center gap-2 text-left">
              <div className="w-7 h-7 rounded-md bg-cinema-red flex items-center justify-center shadow-md shadow-cinema-red/20">
                <Play className="w-3.5 h-3.5 text-white ml-0.5" />
              </div>
              <span className="text-sm font-bold text-white">Admin Panel</span>
              <ShieldCheck className="w-3.5 h-3.5 text-cinema-gold" />
            </SheetTitle>
          </SheetHeader>

          <nav className="flex flex-col py-2 px-2">
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive =
                href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(href);

              return (
                <SidebarNavLink
                  key={href}
                  href={href}
                  label={label}
                  icon={Icon}
                  isActive={isActive}
                  onClick={() => setOpen(false)}
                />
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}