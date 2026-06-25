"use client";

import { Suspense, useState, useEffect } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Crown, Check, ArrowLeft, Loader2, CreditCard, Wallet, Landmark, Building2, Store, Smartphone, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { adminFetch } from "@/lib/admin/client-helpers";

interface Plan {
  id: string;
  display_name: string;
  description: string | null;
  price: number;
  duration_days: number;
  features: string[];
  quality: string;
  max_devices: number;
}

interface PaymentChannel {
  code: string;
  name: string;
  type: string;
  icon_url: string;
  total_fee: { flat: number; percent: string };
  minimum_amount: number;
  maximum_amount: number;
  active: boolean;
}

const GROUP_ICONS: Record<string, typeof CreditCard> = {
  "Virtual Account": Landmark,
  "Convenience Store": Store,
  "E-Wallet": Wallet,
};

function SubscriptionContent() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [channels, setChannels] = useState<Record<string, PaymentChannel[]>>({});
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{
    checkout_url?: string;
    pay_code?: string;
    reference?: string;
    payment_name?: string;
    instructions?: { title: string; steps: string[] }[];
    status?: string;
  } | null>(null);

  useEffect(() => {
    async function load() {
      try {
        // Fetch plans
        const client = (await import("@/lib/supabase/client")).createClient();
        const { data: planData } = await client.from("subscription_plans").select("*").eq("is_active", true).order("sort_order");
        setPlans((planData ?? []) as Plan[]);

        // Fetch payment channels
        const res = await fetch("/api/payment/channels");
        const chanJson = await res.json();
        if (chanJson.data) setChannels(chanJson.data);
      } catch { /* ignore */ }
      setIsLoading(false);
    }
    load();
  }, []);

  async function handleSubscribe() {
    if (!selectedPlan || !selectedChannel) return;
    setIsProcessing(true);

    try {
      // Get session token from Supabase client
      const supabase = (await import("@/lib/supabase/client")).createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch("/api/payment/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          plan_id: selectedPlan,
          payment_channel: selectedChannel,
          return_url: window.location.href,
        }),
      });
      const json = await res.json();

      if (json.error) {
        toast.error(json.error);
      } else if (json.data) {
        setResult(json.data);
        // Open checkout URL for redirect-type payments
        if (json.data.checkout_url) {
          window.open(json.data.checkout_url, "_blank");
        }
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setIsProcessing(false);
    }
  }

  const renderChannelIcon = (group: string) => {
    const Icon = GROUP_ICONS[group] || CreditCard;
    return <Icon className="w-4 h-4" />;
  };

  return (
    <div className="min-h-screen bg-cinema-bg max-w-6xl mx-auto px-5 py-10">
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

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="bg-cinema-surface border-cinema-border rounded-2xl p-6 space-y-4">
              <Skeleton className="h-6 w-24 rounded" />
              <Skeleton className="h-10 w-32 rounded" />
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-3/4 rounded" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Plan Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`bg-cinema-surface border rounded-2xl transition-all hover:shadow-lg hover:shadow-black/20 cursor-pointer ${
                  selectedPlan === plan.id
                    ? "border-cinema-red/50 ring-1 ring-cinema-red/20"
                    : "border-cinema-border"
                }`}
                onClick={() => { setSelectedPlan(plan.id); setResult(null); }}
              >
                <CardHeader className="pb-3 text-center">
                  <CardTitle className="text-lg font-semibold text-foreground">{plan.display_name}</CardTitle>
                  {plan.description && (
                    <p className="text-xs text-muted-foreground mt-1">{plan.description}</p>
                  )}
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-foreground">Rp{plan.price.toLocaleString()}</span>
                    <span className="text-muted-foreground text-sm">/{plan.duration_days}d</span>
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
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Payment Channel Selection */}
          {selectedPlan && Object.keys(channels).length > 0 && (
            <Card className="bg-cinema-surface border-cinema-border rounded-2xl max-w-2xl mx-auto mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-[15px] font-semibold text-foreground flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-cinema-red" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(channels).map(([group, chs]) => (
                  <div key={group}>
                    <p className="text-[11px] text-muted-foreground/70 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      {renderChannelIcon(group)} {group}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {chs.map((ch) => {
                        const selected = selectedChannel === ch.code;
                        const planPrice = plans.find((p) => p.id === selectedPlan)?.price || 0;
                        const disabled = planPrice < ch.minimum_amount || planPrice > ch.maximum_amount;
                        return (
                          <button
                            key={ch.code}
                            disabled={disabled}
                            onClick={() => { setSelectedChannel(ch.code); setResult(null); }}
                            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs transition-all text-left ${
                              disabled
                                ? "opacity-30 cursor-not-allowed bg-cinema-elevated border border-cinema-border"
                                : selected
                                  ? "bg-cinema-red/10 border border-cinema-red/30 text-foreground"
                                  : "bg-cinema-elevated border border-cinema-border text-muted-foreground hover:border-white/20 hover:text-foreground"
                            }`}
                          >
                            <span className="truncate">{ch.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Subscribe Button */}
          {selectedPlan && selectedChannel && !result && (
            <div className="text-center">
              <Button
                onClick={handleSubscribe}
                disabled={isProcessing}
                className="bg-cinema-red hover:bg-cinema-red-hover text-white rounded-xl shadow-lg shadow-cinema-red/20 px-8 h-12 text-base"
              >
                {isProcessing ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Crown className="w-5 h-5 mr-2" />}
                {isProcessing ? "Processing..." : "Pay Now"}
              </Button>
            </div>
          )}

          {/* Result */}
          {result && (
            <Card className="bg-cinema-surface border-cinema-border rounded-2xl max-w-lg mx-auto">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-cinema-gold/10 flex items-center justify-center mx-auto">
                  <Crown className="w-8 h-8 text-cinema-gold" />
                </div>
                <h3 className="font-semibold text-foreground">Payment Created</h3>
                <p className="text-sm text-muted-foreground">
                  {result.payment_name} — {result.pay_code ? `Code: ${result.pay_code}` : "Redirecting to payment..."}
                </p>
                {result.checkout_url && (
                  <a
                    href={result.checkout_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-cinema-red hover:text-cinema-red-hover"
                  >
                    <ExternalLink className="w-4 h-4" /> Open Payment Page
                  </a>
                )}
                {result.instructions && result.instructions.length > 0 && (
                  <div className="text-left space-y-3">
                    <Separator className="bg-cinema-border" />
                    {result.instructions.map((inst) => (
                      <div key={inst.title}>
                        <p className="text-xs font-medium text-foreground mb-1">{inst.title}</p>
                        <ol className="list-decimal list-inside space-y-1">
                          {inst.steps.map((s, i) => (
                            <li key={i} className="text-xs text-muted-foreground" dangerouslySetInnerHTML={{ __html: s }} />
                          ))}
                        </ol>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

export default function SubscriptionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cinema-bg" />}>
      <AuthGuard>
        <SubscriptionContent />
      </AuthGuard>
    </Suspense>
  );
}
