"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { adminFetch } from "@/lib/admin/client-helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Loader2, Save, Wifi, WifiOff, CheckCircle2, XCircle, Eye, EyeOff, CreditCard, ExternalLink,
} from "lucide-react";

interface TripayConfig {
  id: string;
  gateway_name: string;
  display_name: string;
  is_active: boolean;
  is_sandbox: boolean;
  api_key: string | null;
  private_key: string | null;
  merchant_code: string | null;
}

export default function TripaySettingsPage() {
  const queryClient = useQueryClient();
  const [apiKey, setApiKey] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [merchantCode, setMerchantCode] = useState("");
  const [isSandbox, setIsSandbox] = useState(true);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [testResult, setTestResult] = useState<{ success?: boolean; message: string; channels?: { code: string; name: string; group: string; fee: string }[] } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-tripay-config"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/payment/tripay");
      const json = await res.json();
      return json.data as TripayConfig | null;
    },
  });

  useEffect(() => {
    if (data) {
      setApiKey(data.api_key || "");
      setPrivateKey(data.private_key || "");
      setMerchantCode(data.merchant_code || "");
      setIsSandbox(data.is_sandbox);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await adminFetch("/api/admin/payment/tripay", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tripay-config"] });
      toast.success("Tripay configuration saved!");
    },
    onError: (e) => toast.error(`Failed: ${e.message}`),
  });

  async function handleTest() {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await adminFetch("/api/admin/payment/tripay/test", {
        method: "POST",
        body: JSON.stringify({
          api_key: apiKey.includes("****") ? undefined : apiKey,
          private_key: privateKey.includes("****") ? undefined : privateKey,
          merchant_code: merchantCode,
          is_sandbox: isSandbox,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setTestResult({ success: true, message: json.message, channels: json.data?.channels });
        toast.success(json.message);
      } else {
        setTestResult({ success: false, message: json.message });
        toast.error(json.message);
      }
    } catch (e) {
      setTestResult({ message: (e as Error).message });
      toast.error((e as Error).message);
    } finally {
      setIsTesting(false);
    }
  }

  function handleSave() {
    saveMutation.mutate({
      api_key: apiKey,
      private_key: privateKey,
      merchant_code: merchantCode,
      is_sandbox: isSandbox,
    });
  }

  return (
    <>
      <AdminHeader title="Tripay Payment" />

      <div className="flex-1 p-8 space-y-6 overflow-y-auto">
        <p className="text-[13px] text-muted-foreground/70 leading-relaxed max-w-2xl">
          Configure TriPay Indonesia payment gateway for subscription payments.
          Get your API credentials from TriPay merchant dashboard.
        </p>

        <Separator className="bg-cinema-border" />

        {isLoading ? (
          <div className="space-y-4 max-w-xl">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 bg-cinema-elevated rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="max-w-xl space-y-6">
            {/* Mode */}
            <Card className="bg-cinema-surface border-cinema-border rounded-2xl">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-cinema-red" />
                  <CardTitle className="text-[15px] font-semibold text-foreground">Mode</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setIsSandbox(true)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all ${
                      isSandbox
                        ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                        : "bg-cinema-elevated text-muted-foreground border border-transparent"
                    }`}
                  >
                    <WifiOff className="w-4 h-4" /> Sandbox
                  </button>
                  <button
                    onClick={() => setIsSandbox(false)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all ${
                      !isSandbox
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-cinema-elevated text-muted-foreground border border-transparent"
                    }`}
                  >
                    <Wifi className="w-4 h-4" /> Production
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* API Credentials */}
            <Card className="bg-cinema-surface border-cinema-border rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-[15px] font-semibold text-foreground">API Credentials</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-muted-foreground/70">API Key</Label>
                  <div className="relative">
                    <Input
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      type={showApiKey ? "text" : "password"}
                      placeholder="Your Tripay API Key"
                      className="h-10 rounded-xl text-sm bg-cinema-elevated border-cinema-border pr-10"
                    />
                    <button onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-muted-foreground/70">Private Key</Label>
                  <div className="relative">
                    <Input
                      value={privateKey}
                      onChange={(e) => setPrivateKey(e.target.value)}
                      type={showPrivateKey ? "text" : "password"}
                      placeholder="Your Tripay Private Key"
                      className="h-10 rounded-xl text-sm bg-cinema-elevated border-cinema-border pr-10"
                    />
                    <button onClick={() => setShowPrivateKey(!showPrivateKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPrivateKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-muted-foreground/70">Merchant Code</Label>
                  <Input
                    value={merchantCode}
                    onChange={(e) => setMerchantCode(e.target.value)}
                    placeholder="e.g. T0001"
                    className="h-10 rounded-xl text-sm bg-cinema-elevated border-cinema-border"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="bg-cinema-red hover:bg-cinema-red-hover text-white rounded-xl text-xs shadow-lg shadow-cinema-red/20"
              >
                {saveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
                Save Configuration
              </Button>
              <Button
                onClick={handleTest}
                disabled={isTesting}
                variant="outline"
                className="border-cinema-border rounded-xl text-xs"
              >
                {isTesting ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Wifi className="w-3.5 h-3.5 mr-1.5" />}
                Test Connection
              </Button>
              <a href="https://tripay.co.id/member/developer/api-keys" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-cinema-red hover:text-cinema-red-hover ml-auto">
                <ExternalLink className="w-3 h-3" /> Get Credentials
              </a>
            </div>

            {/* Test Result */}
            {testResult && (
              <Card className={`rounded-2xl overflow-hidden ${testResult.success ? "border-emerald-500/30" : "border-red-500/30"}`}>
                <CardContent className={`p-4 ${testResult.success ? "bg-emerald-500/5" : "bg-red-500/5"}`}>
                  <div className="flex items-start gap-2">
                    {testResult.success ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className={`text-sm font-medium ${testResult.success ? "text-emerald-400" : "text-red-400"}`}>
                        {testResult.success ? "Connection Successful" : "Connection Failed"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{testResult.message}</p>
                      {testResult.channels && (
                        <div className="mt-3 space-y-1">
                          <p className="text-[11px] text-muted-foreground">Active Channels:</p>
                          {testResult.channels.map((ch) => (
                            <div key={ch.code} className="flex items-center gap-2 text-xs text-muted-foreground">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span className="font-medium text-foreground">{ch.name}</span>
                              <span className="text-[10px]">({ch.group})</span>
                              <Badge className="text-[9px] bg-cinema-elevated text-muted-foreground border-cinema-border">{ch.fee}</Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </>
  );
}
