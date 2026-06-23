"use client";

import { useState, useTransition } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import type { ApiTestStatus } from "@/lib/supabase/types";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Radio,
  Shield,
  Eye,
  EyeOff,
  Save,
  Wifi,
  WifiOff,
} from "lucide-react";

// ---------------------------------------------------------------------------
// API helpers (fetch-based, no server actions)
// ---------------------------------------------------------------------------

async function fetchApiProviders() {
  const res = await fetch("/api/admin/api-providers");
  if (!res.ok) throw new Error("Failed to fetch providers");
  return res.json();
}

async function apiSaveConfig(data: Record<string, unknown>) {
  const res = await fetch("/api/admin/api-providers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

async function apiTestConnection(providerName: string) {
  const res = await fetch("/api/admin/api-providers/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ providerName }),
  });
  return res.json();
}

// ---------------------------------------------------------------------------
// Provider Configuration Form
// ---------------------------------------------------------------------------

function ProviderConfigCard({
  providerName,
  defaultBaseUrl,
  providerType,
  needsSecretKey = false,
}: {
  providerName: string;
  defaultBaseUrl: string;
  providerType: "metadata" | "microdrama" | "video_source";
  needsSecretKey?: boolean;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [baseUrl, setBaseUrl] = useState(defaultBaseUrl);
  const [apiKey, setApiKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<ApiTestStatus | null>(null);
  const [testMessage, setTestMessage] = useState("");

  const { data: providerInfo } = useQuery({
    queryKey: ["api-providers"],
    queryFn: fetchApiProviders,
    select: (data) =>
      data.data?.find((p: { provider_name: string }) => p.provider_name === providerName),
  });

  async function handleSave() {
    setIsSaving(true);
    try {
      const result = await apiSaveConfig({
        provider_name: providerName,
        provider_type: providerType,
        base_url: baseUrl,
        api_key: apiKey,
        secret_key: needsSecretKey ? secretKey : undefined,
        is_active: true,
        description: "",
      });

      if (result.success) {
        toast({ title: "Saved", description: `${providerName} configuration saved.` });
        queryClient.invalidateQueries({ queryKey: ["api-providers"] });
      } else {
        toast({ title: "Error", description: result.error ?? "Failed to save", variant: "destructive" });
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function handleTest() {
    setIsTesting(true);
    setTestStatus("pending");
    setTestMessage("Testing connection...");
    try {
      const result = await apiTestConnection(providerName);
      setTestStatus(result.status);
      setTestMessage(result.message);

      if (result.success) {
        toast({ title: "Connected!", description: result.message });
      } else {
        toast({ title: "Connection Failed", description: result.message, variant: "destructive" });
      }

      queryClient.invalidateQueries({ queryKey: ["api-providers"] });
    } finally {
      setIsTesting(false);
    }
  }

  const statusColors: Record<ApiTestStatus, string> = {
    success: "text-emerald-400",
    fail: "text-destructive",
    pending: "text-cinema-gold",
    untested: "text-muted-foreground",
  };

  return (
    <Card className="bg-cinema-surface border-cinema-border rounded-2xl hover:shadow-lg hover:shadow-black/20 transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-[15px] font-semibold text-foreground">
              {providerName}
            </CardTitle>
            <Badge
              variant="outline"
              className="rounded-lg text-[10px] border-cinema-border text-muted-foreground"
            >
              {providerType}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {providerInfo?.has_api_key && (
              <Badge
                variant="outline"
                className="rounded-lg text-[10px] border-emerald-600/50 text-emerald-400"
              >
                <Shield className="w-3 h-3 mr-1" />
                Key Set
              </Badge>
            )}
            {testStatus && (
              <span className={`text-xs font-medium ${statusColors[testStatus]}`}>
                {testStatus === "success" && <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />}
                {testStatus === "fail" && <XCircle className="w-3.5 h-3.5 inline mr-1" />}
                {testStatus === "pending" && <Radio className="w-3.5 h-3.5 inline mr-1 animate-pulse" />}
                {testStatus === "untested" && <WifiOff className="w-3.5 h-3.5 inline mr-1" />}
                {testStatus}
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Base URL */}
        <div className="space-y-1.5">
          <Label className="text-[11px] text-muted-foreground/70">Base URL</Label>
          <Input
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://api.example.com/v1"
            className="h-10 rounded-xl text-sm bg-cinema-elevated border-cinema-border"
          />
        </div>

        {/* API Key */}
        <div className="space-y-1.5">
          <Label className="text-[11px] text-muted-foreground/70">API Key</Label>
          <div className="relative">
            <Input
              type={showApiKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={providerInfo?.has_api_key ? "•••••••• (key is set, leave blank to keep)" : "Enter API key"}
              className="h-10 rounded-xl text-sm pr-11 bg-cinema-elevated border-cinema-border"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Secret Key (optional) */}
        {needsSecretKey && (
          <div className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground/70">
              Secret Key <span className="text-muted-foreground/60">(optional)</span>
            </Label>
            <div className="relative">
              <Input
                type={showSecretKey ? "text" : "password"}
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder="Enter secret key"
                className="h-10 rounded-xl text-sm pr-11 bg-cinema-elevated border-cinema-border"
              />
              <button
                type="button"
                onClick={() => setShowSecretKey(!showSecretKey)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showSecretKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground/60">
              Encrypted with AES-256-GCM before storage. Never sent to the client.
            </p>
          </div>
        )}

        {testMessage && testStatus !== "pending" && (
          <div
            className={`text-xs px-3 py-2 rounded-xl ${
              testStatus === "success"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-destructive/10 text-destructive border border-destructive/20"
            }`}
          >
            {testMessage}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-1">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="h-10 rounded-xl shadow-lg shadow-cinema-red/20 bg-cinema-red hover:bg-cinema-red-hover text-white text-xs"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
            Save
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleTest}
            disabled={isTesting || isSaving}
            className="h-10 rounded-xl border-cinema-border text-foreground text-xs hover:bg-accent"
          >
            {isTesting ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Wifi className="w-3.5 h-3.5 mr-1.5" />}
            Test Connection
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function ApiConfigPage() {
  return (
    <>
      <AdminHeader title="API Configuration" />

      <div className="flex-1 p-8 space-y-6 overflow-y-auto">
        <p className="text-[13px] text-muted-foreground/70 leading-relaxed max-w-2xl">
          Manage API credentials for external services. All keys are encrypted
          with AES-256-GCM before storage. Secrets are never sent to the client
          browser.
        </p>

        <Separator className="bg-cinema-border" />

        {/* Metadata Providers */}
        <div>
          <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em] mb-4">
            Metadata Provider
          </h2>
          <ProviderConfigCard
            providerName="tmdb"
            defaultBaseUrl="https://api.themoviedb.org/3"
            providerType="metadata"
          />
        </div>

        {/* Micro-drama Providers */}
        <div>
          <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em] mb-4">
            Micro-Drama Providers
          </h2>
          <div className="space-y-5">
            <ProviderConfigCard
              providerName="melolo"
              defaultBaseUrl="https://api.melolo.com/v1"
              providerType="microdrama"
            />
            <ProviderConfigCard
              providerName="dramabox"
              defaultBaseUrl="https://api.dramabox.com/v1"
              providerType="microdrama"
            />
            <ProviderConfigCard
              providerName="flickshort"
              defaultBaseUrl="https://api.flickshort.com/v1"
              providerType="microdrama"
            />
          </div>
        </div>
      </div>
    </>
  );
}