"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/stores/authStore";
import { useUIStore } from "@/lib/stores/uiStore";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Play,
  Search,
  User,
  Crown,
  LogOut,
  Menu,
  Bookmark,
  History,
  ShieldCheck,
  Film,
  Tv,
  Sparkles,
  Clapperboard,
  Home,
  X,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Nav items (shared between desktop and mobile)
// ---------------------------------------------------------------------------

const NAV_LINKS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/browse", label: "Browse", icon: Film },
  { href: "/browse/movie", label: "Movies", icon: Film },
  { href: "/browse/series", label: "Series", icon: Tv },
  { href: "/browse/anime", label: "Anime", icon: Sparkles },
  { href: "/browse/microdrama", label: "Micro-Drama", icon: Clapperboard },
];

// ---------------------------------------------------------------------------
// Navbar
// ---------------------------------------------------------------------------

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, profile, isAdmin, isSubscriber, email } =
    useAuthStore();
  const { isMobileMenuOpen, closeMobileMenu, toggleMobileMenu } = useUIStore();

  const initials = profile?.display_name
    ? profile.display_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : email?.[0]?.toUpperCase() ?? "U";

  return (
    <>
      <header className="sticky top-0 z-50 w-full">
        <div className="absolute inset-0 bg-gradient-to-b from-cinema-bg/95 via-cinema-bg/80 to-transparent backdrop-blur-md pointer-events-none" />

        <nav className="relative flex items-center h-14 md:h-16 max-w-8xl mx-auto px-4 md:px-6">
          {/* Left: Hamburger + Logo */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={toggleMobileMenu}
              className="lg:hidden p-2 -ml-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>

            <Link href="/" className="flex items-center gap-2 group shrink-0">
              <div className="w-8 h-8 rounded-lg bg-cinema-red flex items-center justify-center glow-red">
                <Play className="w-4 h-4 text-white ml-0.5" />
              </div>
              <span className="text-base font-bold text-white tracking-tight hidden sm:inline group-hover:text-cinema-red transition-colors">
                StreamVault
              </span>
            </Link>
          </div>

          {/* Center: Nav links (desktop) */}
          <div className="hidden lg:flex items-center gap-1 ml-8">
            {NAV_LINKS.map(({ href, label }) => (
              <NavLink key={href} href={label === "Home" ? "/" : href} isActive={isActivePath(pathname, href)}>
                {label}
              </NavLink>
            ))}
          </div>

          {/* Right: Search + Auth */}
          <div className="flex items-center gap-1.5 ml-auto">
            <button
              onClick={() => {
                closeMobileMenu();
                router.push("/search");
              }}
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {isAuthenticated ? (
              <>
                {!isSubscriber && (
                  <Button
                    onClick={() => router.push("/profile/subscription")}
                    size="sm"
                    className="bg-cinema-gold hover:bg-cinema-gold/80 text-black font-semibold text-xs px-3 hidden sm:flex"
                  >
                    <Crown className="w-3.5 h-3.5 mr-1.5" />
                    Subscribe
                  </Button>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 p-0.5 rounded-full hover:ring-2 hover:ring-cinema-red/40 transition-all">
                      <Avatar className="h-8 w-8 border-2 border-cinema-border">
                        <AvatarImage
                          src={profile?.avatar_url ?? undefined}
                          alt={profile?.display_name ?? "User"}
                        />
                        <AvatarFallback className="bg-cinema-elevated text-foreground text-xs font-semibold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent
                    align="end"
                    className="w-52 bg-cinema-surface border-cinema-border"
                  >
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium text-foreground truncate">
                        {profile?.display_name || "User"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {email}
                      </p>
                      {isSubscriber && (
                        <Badge
                          variant="outline"
                          className="mt-1.5 text-[10px] border-cinema-gold text-cinema-gold"
                        >
                          <Crown className="w-2.5 h-2.5 mr-1" />
                          Premium
                        </Badge>
                      )}
                    </div>

                    <DropdownMenuSeparator className="bg-cinema-border" />

                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="text-sm text-foreground focus:bg-accent cursor-pointer">
                        <User className="w-4 h-4 mr-2" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/my-list" className="text-sm text-foreground focus:bg-accent cursor-pointer">
                        <Bookmark className="w-4 h-4 mr-2" />
                        My List
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/history" className="text-sm text-foreground focus:bg-accent cursor-pointer">
                        <History className="w-4 h-4 mr-2" />
                        Watch History
                      </Link>
                    </DropdownMenuItem>

                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator className="bg-cinema-border" />
                        <DropdownMenuItem asChild>
                          <Link href="/admin" className="text-sm text-cinema-gold focus:bg-accent cursor-pointer">
                            <ShieldCheck className="w-4 h-4 mr-2" />
                            Admin Panel
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}

                    <DropdownMenuSeparator className="bg-cinema-border" />

                    <DropdownMenuItem
                      onClick={async () => {
                        const supabase = createClient();
                        await supabase.auth.signOut();
                        useAuthStore.getState().reset();
                        router.push("/");
                        router.refresh();
                      }}
                      className="text-sm text-destructive focus:bg-destructive/10 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  asChild
                  className="text-foreground hover:text-foreground hover:bg-white/5 text-sm hidden sm:flex"
                >
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="bg-cinema-red hover:bg-cinema-red-hover text-white text-sm"
                >
                  <Link href="/register">Get Started</Link>
                </Button>
              </div>
            )}
          </div>
        </nav>
      </header>

      {/* Mobile Menu Sheet */}
      <Sheet open={isMobileMenuOpen} onOpenChange={(open) => !open && closeMobileMenu()}>
        <SheetContent side="left" className="w-72 bg-cinema-surface border-cinema-border p-0">
          <SheetHeader className="px-5 pt-6 pb-4 border-b border-cinema-border">
            <SheetTitle className="flex items-center gap-2 text-left">
              <div className="w-8 h-8 rounded-lg bg-cinema-red flex items-center justify-center">
                <Play className="w-4 h-4 text-white ml-0.5" />
              </div>
              <span className="text-base font-bold text-white">StreamVault</span>
            </SheetTitle>
          </SheetHeader>

          <nav className="flex flex-col py-2 px-2">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={closeMobileMenu}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActivePath(pathname, href)
                    ? "bg-cinema-red/10 text-cinema-red"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5",
                )}
              >
                <Icon className="w-4.5 h-4.5" />
                {label}
              </Link>
            ))}

            {isAuthenticated && (
              <>
                <div className="my-2 border-t border-cinema-border" />
                <MobileMenuLink href="/my-list" icon={Bookmark} label="My List" pathname={pathname} onClose={closeMobileMenu} />
                <MobileMenuLink href="/history" icon={History} label="Watch History" pathname={pathname} onClose={closeMobileMenu} />
                <MobileMenuLink href="/profile" icon={User} label="Profile" pathname={pathname} onClose={closeMobileMenu} />
                {isAdmin && (
                  <MobileMenuLink href="/admin" icon={ShieldCheck} label="Admin Panel" pathname={pathname} onClose={closeMobileMenu} highlight />
                )}
              </>
            )}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}

// ---------------------------------------------------------------------------
// NavLink (desktop — with active state)
// ---------------------------------------------------------------------------

function NavLink({
  href,
  children,
  isActive,
}: {
  href: string;
  children: string;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "text-[13px] font-medium px-3 py-1.5 rounded-md transition-colors",
        isActive
          ? "text-white bg-white/10"
          : "text-muted-foreground hover:text-foreground hover:bg-white/5",
      )}
    >
      {children}
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Mobile menu link helper
// ---------------------------------------------------------------------------

function MobileMenuLink({
  href,
  icon: Icon,
  label,
  pathname,
  onClose,
  highlight = false,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  pathname: string;
  onClose: () => void;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={onClose}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
        highlight && isActivePath(pathname, href)
          ? "bg-cinema-gold/10 text-cinema-gold"
          : isActivePath(pathname, href)
            ? "bg-cinema-red/10 text-cinema-red"
            : "text-muted-foreground hover:text-foreground hover:bg-white/5",
      )}
    >
      <Icon className="w-4 h-4" />
      {label}
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Path matching helper
// ---------------------------------------------------------------------------

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}