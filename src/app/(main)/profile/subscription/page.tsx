"use client";

import { Suspense } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { Crown, Check, ArrowLeft, Play } from "lucide-react";

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    features: ["480p streaming", "Ad-supported", "5 free trial episodes per content"],
    active: true,
  },
  {
    name: "Premium",
    price: "$9.99",
    period: "/month",
    features: ["1080p HD streaming", "Ad-free", "Unlimited access", "All content unlocked", "Watch on all devices"],
    active: false,
  },
  {
    name: "Premium+",
    price: "$14.99",
    period: "/month",
    features: ["4K UHD streaming", "Ad-free", "Unlimited access", "Early access to new content", "Priority support", "Download offline"],
    active: false,
  },
];

export default function SubscriptionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cinema-bg" />}>
      <AuthGuard>
        <SubscriptionContent />
      </AuthGuard>
    </Suspense>
  );
}

function SubscriptionContent() {
  return (
    <div className="min-h-screen bg-cinema-bg max-w-5xl mx-auto px-5 py-10">
        <Link href="/profile" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Profile
        </Link>

        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-full bg-cinema-gold/10 flex items-center justify-center mx-auto mb-4">
            <Crown className="w-8 h-8 text-cinema-gold" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Choose Your Plan</h1>
          <p className="text-muted-foreground mt-2">Unlock premium content and enjoy an ad-free experience</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <Card key={plan.name} className={`bg-cinema-surface border rounded-2xl transition-all hover:shadow-lg hover:shadow-black/20 ${plan.active ? "border-cinema-red/50 ring-1 ring-cinema-red/20" : "border-cinema-border"}`}>
              <CardHeader className="pb-3 text-center">
                <CardTitle className="text-lg font-semibold text-foreground">{plan.name}</CardTitle>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Separator className="bg-cinema-border" />
                <ul className="space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-cinema-gold mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full rounded-xl ${plan.active ? "bg-cinema-elevated text-muted-foreground cursor-default" : "bg-cinema-red hover:bg-cinema-red-hover text-white"}`}
                  disabled={plan.active}
                >
                  {plan.active ? "Current Plan" : `Choose ${plan.name}`}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }
