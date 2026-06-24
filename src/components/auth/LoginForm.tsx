"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/stores/authStore";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  Loader2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Play,
} from "lucide-react";
import type { Profile, Subscription } from "@/lib/supabase/types";

export function LoginForm() {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setServerError(null);

    const formEl = e.currentTarget;
    const email = (formEl.elements.namedItem("email") as HTMLInputElement)?.value;
    const password = (formEl.elements.namedItem("password") as HTMLInputElement)?.value;

    const supabase = createClient();

    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      setIsSubmitting(false);
      setServerError("Request timed out. Check your Supabase connection.");
      toast({ title: "Timeout", description: "Login request timed out", variant: "destructive" });
    }, 15000);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    clearTimeout(timeout);

    if (error) {
      setServerError(error.message);
      toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
      setIsSubmitting(false);
      return;
    }

    if (!data.session?.user) {
      setServerError("Login succeeded but no session returned.");
      setIsSubmitting(false);
      return;
    }

    // Fetch profile via API (bypasses RLS with service_role key)
    try {
      const res = await fetch("/api/auth/profile", {
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      });
      if (res.ok) {
        const json = await res.json();
        useAuthStore.getState().setAuth({
          userId: json.userId,
          email: json.email,
          profile: json.profile,
          subscription: json.subscription,
        });
      } else {
        useAuthStore.getState().setAuth({
          userId: data.session.user.id,
          email: data.session.user.email!,
          profile: null,
          subscription: null,
        });
      }
    } catch {
      useAuthStore.getState().setAuth({
        userId: data.session.user.id,
        email: data.session.user.email!,
        profile: null,
        subscription: null,
      });
    }

    toast({ title: "Welcome back!" });

    // Hard reload to homepage — session persisted in localStorage
    window.location.href = "/";
  }

  async function handleGoogleSignIn() {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (!error && data.url) {
      window.location.href = data.url;
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto rounded-2xl bg-cinema-surface/95 backdrop-blur-xl border-cinema-border shadow-2xl shadow-black/40">
      <CardHeader className="text-center pb-2 space-y-4 px-8 pt-8">
        <Link href="/" className="inline-flex items-center gap-2 group">
          <div className="w-11 h-11 rounded-xl bg-cinema-red flex items-center justify-center glow-red">
            <Play className="w-5 h-5 text-white ml-0.5" />
          </div>
          <span className="text-2xl font-bold text-white tracking-tight group-hover:text-cinema-red transition-colors">
            StreamVault
          </span>
        </Link>
        <div>
          <h1 className="text-[22px] font-semibold text-white">Welcome back</h1>
          <p className="text-[13px] text-muted-foreground/70 mt-1">Sign in to continue watching</p>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 px-8">
        {serverError && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3 text-sm text-destructive">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground text-sm">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email" name="email" type="email" placeholder="you@example.com"
                required autoComplete="email"
                className="pl-10 h-12 rounded-xl bg-cinema-elevated border-cinema-border text-foreground placeholder:text-muted-foreground focus-visible:ring-cinema-red/40 focus-visible:border-cinema-red/50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-foreground text-sm">Password</Label>
              <Link href="/forgot-password" className="text-[12px] text-cinema-red hover:text-cinema-red-hover transition-colors">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="password" name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password" required autoComplete="current-password"
                className="pl-10 pr-10 h-12 rounded-xl bg-cinema-elevated border-cinema-border text-foreground placeholder:text-muted-foreground focus-visible:ring-cinema-red/40 focus-visible:border-cinema-red/50"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" tabIndex={-1}>
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting}
            className="w-full h-12 rounded-xl bg-cinema-red hover:bg-cinema-red-hover text-white glow-red font-semibold text-[15px]">
            {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Sign In
          </Button>
        </form>

        <div className="relative">
          <Separator className="bg-cinema-border" />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-cinema-surface px-3 text-[11px] text-muted-foreground">
            or continue with
          </span>
        </div>

        <Button type="button" variant="outline" onClick={handleGoogleSignIn}
          className="w-full h-12 rounded-xl bg-cinema-elevated border-cinema-border text-foreground hover:bg-cinema-elevated/80 hover:text-foreground font-medium text-sm">
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continue with Google
        </Button>
      </CardContent>

      <CardFooter className="justify-center px-8 pb-8">
        <p className="text-[13px] text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-cinema-red hover:text-cinema-red-hover font-medium transition-colors">Sign up free</Link>
        </p>
      </CardFooter>
    </Card>
  );
}