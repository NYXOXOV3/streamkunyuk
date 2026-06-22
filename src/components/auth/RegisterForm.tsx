"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUp } from "@/lib/auth/actions";
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
  User,
  Play,
} from "lucide-react";

export function RegisterForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    setServerError(null);
    setSuccessMessage(null);

    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setServerError("Passwords do not match.");
      setIsSubmitting(false);
      return;
    }

    if (password.length < 6) {
      setServerError("Password must be at least 6 characters.");
      setIsSubmitting(false);
      return;
    }

    // Remove confirmPassword before sending to server action
    formData.delete("confirmPassword");

    const result = await signUp(formData);

    if (result.error) {
      setServerError(result.error);
      toast({
        title: "Sign up failed",
        description: result.error,
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    if (result.message) {
      setSuccessMessage(result.message);
      toast({
        title: "Account created!",
        description: result.message,
      });
    }

    setIsSubmitting(false);
  }

  if (successMessage) {
    return (
      <Card className="w-full max-w-md mx-auto bg-cinema-surface border-cinema-border shadow-2xl">
        <CardHeader className="text-center pb-2 space-y-4">
          <div className="w-10 h-10 rounded-lg bg-cinema-red flex items-center justify-center mx-auto glow-red">
            <Play className="w-5 h-5 text-white ml-0.5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">
              Check your email
            </h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
              {successMessage}
            </p>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-3 pb-6">
          <Link
            href="/login"
            className="text-sm text-cinema-red hover:text-cinema-red-hover font-medium transition-colors"
          >
            Back to sign in
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto bg-cinema-surface border-cinema-border shadow-2xl">
      <CardHeader className="text-center pb-2 space-y-4">
        <Link href="/" className="inline-flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-lg bg-cinema-red flex items-center justify-center glow-red">
            <Play className="w-5 h-5 text-white ml-0.5" />
          </div>
          <span className="text-2xl font-bold text-white tracking-tight group-hover:text-cinema-red transition-colors">
            StreamVault
          </span>
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-white">
            Create your account
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Start your free trial today
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {serverError && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3 text-sm text-destructive">
            {serverError}
          </div>
        )}

        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName" className="text-foreground text-sm">
              Display Name
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="displayName"
                name="displayName"
                type="text"
                placeholder="Your name"
                autoComplete="name"
                className="pl-10 h-11 bg-cinema-elevated border-cinema-border text-foreground placeholder:text-muted-foreground focus-visible:ring-cinema-red"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground text-sm">
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="pl-10 h-11 bg-cinema-elevated border-cinema-border text-foreground placeholder:text-muted-foreground focus-visible:ring-cinema-red"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground text-sm">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Min. 6 characters"
                required
                minLength={6}
                autoComplete="new-password"
                className="pl-10 pr-10 h-11 bg-cinema-elevated border-cinema-border text-foreground placeholder:text-muted-foreground focus-visible:ring-cinema-red"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="confirmPassword"
              className="text-foreground text-sm"
            >
              Confirm Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Repeat your password"
                required
                minLength={6}
                autoComplete="new-password"
                className="pl-10 h-11 bg-cinema-elevated border-cinema-border text-foreground placeholder:text-muted-foreground focus-visible:ring-cinema-red"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 bg-cinema-red hover:bg-cinema-red-hover text-white glow-red font-semibold text-sm"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            Create Account
          </Button>
        </form>

        <div className="relative">
          <Separator className="bg-cinema-border" />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-cinema-surface px-3 text-xs text-muted-foreground">
            or continue with
          </span>
        </div>

        <form action={async () => {
          const { signInWithGoogle } = await import("@/lib/auth/actions");
          const result = await signInWithGoogle();
          if (result.url) {
            window.location.href = result.url;
          }
        }}>
          <Button
            type="submit"
            variant="outline"
            className="w-full h-11 bg-cinema-elevated border-cinema-border text-foreground hover:bg-accent hover:text-foreground font-medium text-sm"
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center pb-6">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-cinema-red hover:text-cinema-red-hover font-medium transition-colors"
          >
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}