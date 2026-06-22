"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth/actions";
import { useAuthStore } from "@/lib/stores/authStore";
import { useUIStore } from "@/lib/stores/uiStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Settings,
  Menu,
  Bookmark,
  History,
  ShieldCheck,
} from "lucide-react";

export function Navbar() {
  const router = useRouter();
  const { isAuthenticated, profile, isAdmin, isSubscriber, email } =
    useAuthStore();
  const { openSearch, toggleMobileMenu } = useUIStore();

  // Derive avatar initials
  const initials = profile?.display_name
    ? profile.display_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : email?.[0]?.toUpperCase() ?? "U";

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Gradient fade behind navbar for scroll-through content */}
      <div className="absolute inset-0 bg-gradient-to-b from-cinema-bg/95 via-cinema-bg/80 to-transparent backdrop-blur-sm pointer-events-none" />

      <nav className="relative flex items-center h-16 max-w-8xl mx-auto px-4 md:px-6">
        {/* Left: Logo + Mobile menu toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleMobileMenu}
            className="lg:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="w-8 h-8 rounded-md bg-cinema-red flex items-center justify-center glow-red">
              <Play className="w-4 h-4 text-white ml-0.5" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight hidden sm:inline group-hover:text-cinema-red transition-colors">
              StreamVault
            </span>
          </Link>
        </div>

        {/* Center: Navigation links (desktop) */}
        <div className="hidden lg:flex items-center gap-6 ml-8">
          <NavLink href="/browse">Browse</NavLink>
          <NavLink href="/browse/movie">Movies</NavLink>
          <NavLink href="/browse/series">Series</NavLink>
          <NavLink href="/browse/anime">Anime</NavLink>
          <NavLink href="/browse/microdrama">Micro-Drama</NavLink>
        </div>

        {/* Right: Search + Subscribe + Profile */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Search trigger */}
          <button
            onClick={openSearch}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>

          {isAuthenticated ? (
            <>
              {/* Subscribe button — shown only to free users */}
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

              {/* Profile dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-cinema-red/50 transition-all">
                    <Avatar className="h-8 w-8 border border-cinema-border">
                      <AvatarImage
                        src={profile?.avatar_url ?? undefined}
                        alt={profile?.display_name ?? "User"}
                      />
                      <AvatarFallback className="bg-cinema-elevated text-foreground text-xs font-medium">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  className="w-56 bg-cinema-surface border-cinema-border"
                >
                  {/* User info header */}
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
                    <Link
                      href="/profile"
                      className="text-sm text-foreground focus:bg-accent cursor-pointer"
                    >
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/my-list"
                      className="text-sm text-foreground focus:bg-accent cursor-pointer"
                    >
                      <Bookmark className="w-4 h-4 mr-2" />
                      My List
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/history"
                      className="text-sm text-foreground focus:bg-accent cursor-pointer"
                    >
                      <History className="w-4 h-4 mr-2" />
                      Watch History
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/profile/subscription"
                      className="text-sm text-foreground focus:bg-accent cursor-pointer"
                    >
                      <Crown className="w-4 h-4 mr-2" />
                      Subscription
                    </Link>
                  </DropdownMenuItem>

                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator className="bg-cinema-border" />
                      <DropdownMenuItem asChild>
                        <Link
                          href="/admin"
                          className="text-sm text-cinema-gold focus:bg-accent cursor-pointer"
                        >
                          <ShieldCheck className="w-4 h-4 mr-2" />
                          Admin Panel
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}

                  <DropdownMenuSeparator className="bg-cinema-border" />

                  <DropdownMenuItem
                    onClick={async () => {
                      await signOut();
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
                className="text-foreground hover:text-foreground hover:bg-accent text-sm hidden sm:flex"
              >
                <Link href="/login">Sign In</Link>
              </Button>
              <Button
                asChild
                className="bg-cinema-red hover:bg-cinema-red-hover text-white glow-red text-sm"
              >
                <Link href="/register">Get Started</Link>
              </Button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}

// ---------------------------------------------------------------------------
// NavLink — simple navigation link with active state
// ---------------------------------------------------------------------------

function NavLink({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
    >
      {children}
    </Link>
  );
}