"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card, CardContent, CardHeader,
} from "@/components/ui/card";
import { Lock, Loader2, Play, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // The user should arrive here via the reset link from email
    // Supabase auto-exchanges the code in the URL on page load
    const supabase = createClient();
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsReady(true);
      }
    });
    // Also try to get session directly
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setIsReady(true);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Password updated successfully!");
        router.push("/login");
      }
    } catch {
      toast.error("Something went wrong");
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
          <span className="text-2xl font-bold text-white tracking-tight">StreamVault</span>
        </Link>
        <div>
          <h1 className="text-[22px] font-semibold text-white">Set new password</h1>
          <p className="text-[13px] text-muted-foreground/70 mt-1">Enter your new password below</p>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 px-8 pb-8">
        {!isReady ? (
          <div className="text-center py-8">
            <Loader2 className="w-6 h-6 text-cinema-red animate-spin mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Verifying reset link...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground text-sm">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password" type={showPassword ? "text" : "password"}
                  value={password} minLength={6}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters" required autoComplete="new-password"
                  className="pl-10 pr-10 h-12 rounded-xl bg-cinema-elevated border-cinema-border text-foreground placeholder:text-muted-foreground"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" disabled={isSubmitting}
              className="w-full h-12 rounded-xl bg-cinema-red hover:bg-cinema-red-hover text-white glow-red font-semibold text-[15px]"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Update Password
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
