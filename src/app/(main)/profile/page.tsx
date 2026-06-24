"use client";

import { Suspense } from "react";
import { useAuthStore } from "@/lib/stores/authStore";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { User, Crown, Mail, Calendar, ShieldCheck, LogOut, Play } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cinema-bg" />}>
      <AuthGuard>
        <ProfileContent />
      </AuthGuard>
    </Suspense>
  );
}

function ProfileContent() {
  const { profile, email, isSubscriber, isAdmin, subscription } = useAuthStore();
  const router = useRouter();

  const initials = profile?.display_name
    ? profile.display_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : email?.[0]?.toUpperCase() ?? "U";

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    useAuthStore.getState().reset();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-cinema-bg max-w-3xl mx-auto px-5 py-10 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-cinema-border">
            <AvatarImage src={profile?.avatar_url ?? undefined} />
            <AvatarFallback className="bg-cinema-elevated text-lg font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{profile?.display_name || "User"}</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <Mail className="w-3.5 h-3.5" /> {email}
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              {isSubscriber && (
                <Badge className="rounded-lg bg-cinema-gold/10 text-cinema-gold border-cinema-gold/30 text-[10px] gap-1">
                  <Crown className="w-3 h-3" /> Premium
                </Badge>
              )}
              {isAdmin && (
                <Badge className="rounded-lg bg-cinema-red/10 text-cinema-red border-cinema-red/30 text-[10px] gap-1">
                  <ShieldCheck className="w-3 h-3" /> Admin
                </Badge>
              )}
            </div>
          </div>
        </div>

        <Separator className="bg-cinema-border" />

        {/* Subscription Card */}
        <Card className="bg-cinema-surface border-cinema-border rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-[15px] font-semibold text-foreground flex items-center gap-2">
              <Crown className="w-4 h-4 text-cinema-gold" />
              Subscription
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isSubscriber && subscription ? (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Plan</span>
                  <span className="text-foreground font-medium">{subscription.subscription_tier?.display_name || "Premium"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <Badge className="rounded-lg bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]">{subscription.status}</Badge>
                </div>
                {subscription.current_period_end && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Renewal</span>
                    <span className="text-foreground">{new Date(subscription.current_period_end).toLocaleDateString()}</span>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-3">You are on the Free plan</p>
                <Button asChild className="bg-cinema-gold hover:bg-cinema-gold/80 text-black font-semibold rounded-xl">
                  <Link href="/profile/subscription"><Crown className="w-4 h-4 mr-1.5" />Upgrade</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card className="bg-cinema-surface border-cinema-border rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-[15px] font-semibold text-foreground">Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/my-list" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-cinema-elevated transition-colors text-sm text-muted-foreground hover:text-foreground">
              <Play className="w-4 h-4" /> My List
            </Link>
            <Link href="/history" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-cinema-elevated transition-colors text-sm text-muted-foreground hover:text-foreground">
              <Calendar className="w-4 h-4" /> Watch History
            </Link>
            {isAdmin && (
              <Link href="/admin" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-cinema-elevated transition-colors text-sm text-cinema-gold hover:text-cinema-gold">
                <ShieldCheck className="w-4 h-4" /> Admin Panel
              </Link>
            )}
          </CardContent>
        </Card>

        {/* Sign Out */}
        <Button
          onClick={handleSignOut}
          variant="outline"
          className="w-full border-cinema-border text-muted-foreground hover:text-destructive hover:border-destructive/30 rounded-xl"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    );
  }
