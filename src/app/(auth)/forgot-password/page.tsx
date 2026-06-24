"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card, CardContent, CardFooter, CardHeader,
} from "@/components/ui/card";
import { Mail, Loader2, ArrowLeft, Play, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast.error(error.message);
      } else {
        setSent(true);
        toast.success("Check your email for the reset link");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto rounded-2xl bg-cinema-surface/95 backdrop-blur-xl border-cinema-border shadow-2xl shadow-black/40">
      <CardHeader className="text-center pb-2 space-y-4 px-8 pt-8">
        <Link href="/" className="inline-flex items-center gap-2 group justify-center">
          <div className="w-11 h-11 rounded-xl bg-cinema-red flex items-center justify-center glow-red">
            <Play className="w-5 h-5 text-white ml-0.5" />
          </div>
          <span className="text-2xl font-bold text-white tracking-tight group-hover:text-cinema-red transition-colors">
            StreamVault
          </span>
        </Link>
        <div>
          <h1 className="text-[22px] font-semibold text-white">Reset password</h1>
          <p className="text-[13px] text-muted-foreground/70 mt-1">
            {sent ? "Email sent!" : "Enter your email to receive a reset link"}
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 px-8">
        {sent ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <p className="text-sm text-muted-foreground">
              If an account exists with that email, you will receive a password reset link shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground text-sm">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email" type="email" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com" required autoComplete="email"
                  className="pl-10 h-12 rounded-xl bg-cinema-elevated border-cinema-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>
            <Button type="submit" disabled={isSubmitting}
              className="w-full h-12 rounded-xl bg-cinema-red hover:bg-cinema-red-hover text-white glow-red font-semibold text-[15px]"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Send Reset Link
            </Button>
          </form>
        )}
      </CardContent>

      <CardFooter className="justify-center px-8 pb-8">
        <Link href="/login" className="inline-flex items-center gap-1.5 text-[13px] text-cinema-red hover:text-cinema-red-hover font-medium transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Sign In
        </Link>
      </CardFooter>
    </Card>
  );
}
