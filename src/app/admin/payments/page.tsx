"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { adminFetch } from "@/lib/admin/client-helpers";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Loader2, Search, CreditCard, CheckCircle2, XCircle, Clock,
  AlertCircle, ExternalLink, User, ChevronLeft, ChevronRight,
} from "lucide-react";

interface PaymentTransaction {
  id: string;
  user_id: string;
  plan_id: string | null;
  gateway_name: string;
  gateway_reference: string | null;
  merchant_ref: string;
  amount: number;
  fee_merchant: number;
  fee_customer: number;
  amount_received: number;
  status: "UNPAID" | "PAID" | "EXPIRED" | "FAILED" | "REFUND";
  payment_method: string | null;
  payment_name: string | null;
  pay_code: string | null;
  checkout_url: string | null;
  paid_at: string | null;
  expired_at: string | null;
  created_at: string;
  profiles?: { display_name: string | null; email?: string };
  subscription_plans?: { display_name: string };
}

const STATUS_CONFIG: Record<string, { label: string; class: string; icon: typeof Clock }> = {
  UNPAID: { label: "Unpaid", class: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30", icon: Clock },
  PAID: { label: "Paid", class: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30", icon: CheckCircle2 },
  EXPIRED: { label: "Expired", class: "bg-red-500/10 text-red-400 border-red-500/30", icon: XCircle },
  FAILED: { label: "Failed", class: "bg-red-500/10 text-red-400 border-red-500/30", icon: AlertCircle },
  REFUND: { label: "Refunded", class: "bg-purple-500/10 text-purple-400 border-purple-500/30", icon: AlertCircle },
};

function formatCurrency(n: number): string {
  return `Rp${n.toLocaleString("id-ID")}`;
}

function formatDate(str: string | null): string {
  if (!str) return "—";
  return new Date(str).toLocaleDateString("id-ID", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function PaymentsPage() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading } = useQuery({
    queryKey: ["admin-payments", page, filterStatus],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (filterStatus) params.set("status", filterStatus);
      if (search.trim()) params.set("search", search.trim());
      const res = await adminFetch(`/api/admin/payments?${params}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json as { data: PaymentTransaction[]; total: number; totalPages: number };
    },
  });

  const statuses = ["", "UNPAID", "PAID", "EXPIRED", "FAILED", "REFUND"];

  return (
    <>
      <AdminHeader title="Payment History" />

      <div className="flex-1 p-8 space-y-6 overflow-y-auto">
        <p className="text-[13px] text-muted-foreground/70 leading-relaxed max-w-2xl">
          View all subscription payment transactions and their status.
        </p>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by reference or email..."
              className="h-9 pl-9 rounded-xl text-xs bg-cinema-elevated border-cinema-border"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {statuses.map((s) => {
              const cfg = s ? STATUS_CONFIG[s] : { label: "All" };
              return (
                <button
                  key={s || "all"}
                  onClick={() => { setFilterStatus(s); setPage(1); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    filterStatus === s
                      ? "bg-cinema-red text-white"
                      : "bg-cinema-elevated text-muted-foreground hover:text-foreground border border-cinema-border"
                  }`}
                >
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl bg-cinema-elevated" />
            ))}
          </div>
        ) : !data?.data.length ? (
          <div className="text-center py-20">
            <CreditCard className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No payment transactions found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.data.map((tx) => {
              const sConfig = STATUS_CONFIG[tx.status] || STATUS_CONFIG.UNPAID;
              const StatusIcon = sConfig.icon;

              return (
                <Card key={tx.id} className="bg-cinema-surface border-cinema-border rounded-xl overflow-hidden hover:border-white/10 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                      {/* Left: Status + Amount */}
                      <div className="flex items-center gap-3 lg:w-48 shrink-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.status === "PAID" ? "bg-emerald-500/10" : "bg-cinema-elevated"}`}>
                          <StatusIcon className={`w-5 h-5 ${tx.status === "PAID" ? "text-emerald-400" : "text-muted-foreground"}`} />
                        </div>
                        <div>
                          <Badge className={`text-[10px] ${sConfig.class}`}>
                            {sConfig.label}
                          </Badge>
                          <p className="text-sm font-semibold text-foreground mt-0.5">{formatCurrency(tx.amount)}</p>
                        </div>
                      </div>

                      {/* Middle: Details */}
                      <div className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 text-xs">
                        <div>
                          <span className="text-muted-foreground/50">Reference</span>
                          <p className="text-foreground font-mono text-[11px] truncate">{tx.merchant_ref}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground/50">Payment</span>
                          <p className="text-foreground truncate">{tx.payment_name || tx.payment_method || "—"}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground/50">User</span>
                          <p className="text-foreground truncate">{tx.profiles?.display_name || "—"}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground/50">Plan</span>
                          <p className="text-foreground truncate">{tx.subscription_plans?.display_name || "—"}</p>
                        </div>
                        <div className="col-span-2 sm:col-span-4 flex items-center gap-4 text-[10px] text-muted-foreground/60 mt-1">
                          <span>Created: {formatDate(tx.created_at)}</span>
                          {tx.paid_at && <span>Paid: {formatDate(tx.paid_at)}</span>}
                          {tx.expired_at && <span>Expires: {formatDate(tx.expired_at)}</span>}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 shrink-0 lg:ml-4">
                        {tx.checkout_url && (
                          <a href={tx.checkout_url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-cinema-red hover:text-cinema-red-hover">
                            <ExternalLink className="w-3 h-3" /> Checkout
                          </a>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}
              className="border-cinema-border rounded-xl text-xs">
              <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Previous
            </Button>
            <span className="text-xs text-muted-foreground">
              Page {page} of {data.totalPages} ({data.total} total)
            </span>
            <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}
              className="border-cinema-border rounded-xl text-xs">
              Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
