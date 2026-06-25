"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { adminFetch } from "@/lib/admin/client-helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, Save, Plus, Pencil, Crown, X, Check } from "lucide-react";

interface Plan {
  id: string;
  display_name: string;
  description: string | null;
  price: number;
  duration_days: number;
  quality: string;
  max_devices: number;
  is_active: boolean;
  sort_order: number;
  features: string[];
}

export default function SubscriptionSettingsPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Plan | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    display_name: "", description: "", price: "", duration_days: "30",
    quality: "1080p", max_devices: "1", features: "",
  });

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["admin-subscription-plans"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/subscription-plans");
      const json = await res.json();
      return (json.data ?? []) as Plan[];
    },
  });

  function resetForm() {
    setForm({ display_name: "", description: "", price: "", duration_days: "30", quality: "1080p", max_devices: "1", features: "" });
    setEditing(null);
  }

  function openEdit(plan: Plan) {
    setEditing(plan);
    setForm({
      display_name: plan.display_name,
      description: plan.description || "",
      price: String(plan.price),
      duration_days: String(plan.duration_days),
      quality: plan.quality,
      max_devices: String(plan.max_devices),
      features: plan.features.join(", "),
    });
    setShowForm(true);
  }

  const saveMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await adminFetch("/api/admin/subscription-plans", {
        method: "POST", body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-subscription-plans"] });
      setShowForm(false);
      resetForm();
      toast.success(editing ? "Plan updated" : "Plan created");
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      await adminFetch("/api/admin/subscription-plans", {
        method: "PATCH", body: JSON.stringify({ id, is_active }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-subscription-plans"] });
    },
  });

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    saveMutation.mutate({ ...form, id: editing?.id, features: form.features.split(",").map((f) => f.trim()).filter(Boolean) });
  }

  return (
    <>
      <AdminHeader title="Subscription Settings" />
      <div className="flex-1 p-8 space-y-6 overflow-y-auto">
        <p className="text-[13px] text-muted-foreground/70 leading-relaxed max-w-2xl">
          Manage subscription plans, pricing, duration, and features. Changes take effect immediately.
        </p>
        <Separator className="bg-cinema-border" />
        <div className="space-y-4 max-w-2xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Subscription Plans</h3>
            <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}
              className="bg-cinema-red hover:bg-cinema-red-hover text-white rounded-xl text-xs">
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Plan
            </Button>
          </div>
          {isLoading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-cinema-elevated rounded-xl animate-pulse" />)}</div>
          ) : plans.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No plans yet.</p>
          ) : (
            plans.map((plan) => (
              <Card key={plan.id} className={`bg-cinema-surface border rounded-2xl ${plan.is_active ? "border-cinema-border" : "border-cinema-border/50 opacity-60"}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Crown className="w-4 h-4 text-cinema-gold" />
                        <h4 className="font-semibold text-foreground">{plan.display_name}</h4>
                        <Badge className={`text-[9px] ${plan.is_active ? "bg-emerald-500/10 text-emerald-400" : "bg-muted text-muted-foreground"}`}>
                          {plan.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      {plan.description && <p className="text-xs text-muted-foreground mt-1">{plan.description}</p>}
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground text-sm">Rp{plan.price.toLocaleString()}</span>
                        <span>/{plan.duration_days} days</span>
                        <span>{plan.quality}</span>
                        <span>{plan.max_devices} device{plan.max_devices > 1 ? "s" : ""}</span>
                      </div>
                      {plan.features.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {plan.features.map((f) => (
                            <Badge key={f} variant="outline" className="text-[9px] border-cinema-border text-muted-foreground">{f}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(plan)} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => toggleMutation.mutate({ id: plan.id, is_active: !plan.is_active })} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        {plan.is_active ? <X className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
        {showForm && (
          <Card className="bg-cinema-surface border-cinema-border rounded-2xl max-w-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-[15px] font-semibold text-foreground">{editing ? "Edit Plan" : "New Plan"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[11px]">Display Name</Label>
                    <Input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                      placeholder="Premium Monthly" required className="h-9 rounded-xl text-xs bg-cinema-elevated border-cinema-border" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px]">Price (Rp)</Label>
                    <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
                      placeholder="59900" required className="h-9 rounded-xl text-xs bg-cinema-elevated border-cinema-border" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px]">Duration (days)</Label>
                    <Input type="number" value={form.duration_days} onChange={(e) => setForm({ ...form, duration_days: e.target.value })}
                      placeholder="30" className="h-9 rounded-xl text-xs bg-cinema-elevated border-cinema-border" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px]">Quality</Label>
                    <select value={form.quality} onChange={(e) => setForm({ ...form, quality: e.target.value })}
                      className="h-9 rounded-xl text-xs bg-cinema-elevated border-cinema-border text-foreground px-3 w-full">
                      <option>480p</option><option>720p</option><option>1080p</option><option>4K</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px]">Max Devices</Label>
                    <Input type="number" value={form.max_devices} onChange={(e) => setForm({ ...form, max_devices: e.target.value })}
                      placeholder="1" className="h-9 rounded-xl text-xs bg-cinema-elevated border-cinema-border" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px]">Description</Label>
                  <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Brief description..." className="h-16 rounded-xl text-xs bg-cinema-elevated border-cinema-border resize-none" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px]">Features (comma separated)</Label>
                  <Textarea value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })}
                    placeholder="1080p HD, 2 devices, Ad-free" className="h-16 rounded-xl text-xs bg-cinema-elevated border-cinema-border resize-none" />
                </div>
                <div className="flex items-center gap-2">
                  <Button type="submit" disabled={saveMutation.isPending}
                    className="bg-cinema-red hover:bg-cinema-red-hover text-white rounded-xl text-xs">
                    {saveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1" />}
                    {editing ? "Update Plan" : "Create Plan"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => { setShowForm(false); resetForm(); }}
                    className="border-cinema-border rounded-xl text-xs">Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
