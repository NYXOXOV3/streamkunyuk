"use client";

import { useQuery } from "@tanstack/react-query";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { adminFetch } from "@/lib/admin/client-helpers";
// Fetch-based, no server actions
async function fetchDashboardStats() {
  const res = await adminFetch("/api/admin/stats");
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, CreditCard, Film, Clock } from "lucide-react";

function StatCard({
  title,
  value,
  icon: Icon,
  description,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description: string;
}) {
  return (
    <Card className="bg-cinema-surface border-cinema-border rounded-2xl hover:shadow-lg hover:shadow-black/20 transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-[12px] font-medium text-muted-foreground/70 uppercase tracking-[0.05em]">
          {title}
        </CardTitle>
        <Icon className="w-5 h-5 text-muted-foreground/40" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-foreground tracking-tight">{value.toLocaleString()}</div>
        <p className="text-[11px] text-muted-foreground/60 mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: fetchDashboardStats,
    refetchInterval: 30000,
  });

  return (
    <>
      <AdminHeader title="Dashboard" />

      <div className="flex-1 p-8 space-y-8 overflow-y-auto">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            title="Total Users"
            value={isLoading ? "..." : (stats?.totalUsers ?? 0)}
            icon={Users}
            description="Registered accounts"
          />
          <StatCard
            title="Active Subscribers"
            value={isLoading ? "..." : (stats?.activeSubscribers ?? 0)}
            icon={CreditCard}
            description="Paying subscribers"
          />
          <StatCard
            title="Total Content"
            value={isLoading ? "..." : (stats?.totalContent ?? 0)}
            icon={Film}
            description="Movies, series, anime, donghua, micro-dramas"
          />
          <StatCard
            title="Watch Hours"
            value={isLoading ? "..." : (stats?.totalWatchHours ?? 0)}
            icon={Clock}
            description="Total hours streamed"
          />
        </div>

        {/* Content by Type */}
        <Card className="bg-cinema-surface border-cinema-border rounded-2xl hover:shadow-lg hover:shadow-black/20 transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-[13px] font-semibold text-foreground">
              Content by Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="h-2 bg-muted rounded-full animate-pulse"
                    style={{ width: `${80 - i * 12}%` }}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {stats?.contentByType.map(({ type, count }: { type: string; count: number }) => {
                  const max = Math.max(
                    ...((stats?.contentByType ?? []).map((c: { type: string; count: number }) => c.count) ?? [1]),
                  );
                  const pct = Math.round((count / max) * 100);

                  return (
                    <div key={type} className="flex items-center gap-3">
                      <span className="text-[12px] text-muted-foreground w-24 capitalize shrink-0">
                        {type}
                      </span>
                      <div className="flex-1 h-2 bg-cinema-elevated rounded-full overflow-hidden">
                        <div
                          className="h-full bg-cinema-red/70 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[12px] font-semibold text-foreground w-8 text-right">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Imports Table */}
        <Card className="bg-cinema-surface border-cinema-border rounded-2xl hover:shadow-lg hover:shadow-black/20 transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-[13px] font-semibold text-foreground">
              Recent Imports
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="h-10 bg-muted rounded-md animate-pulse"
                  />
                ))}
              </div>
            ) : !stats?.recentImports?.length ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No content yet
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-cinema-border hover:bg-transparent">
                      <TableHead className="text-[11px] text-muted-foreground/60 uppercase tracking-[0.05em]">Title</TableHead>
                      <TableHead className="text-[11px] text-muted-foreground/60 uppercase tracking-[0.05em] w-28">Type</TableHead>
                      <TableHead className="text-[11px] text-muted-foreground/60 uppercase tracking-[0.05em] w-28">Status</TableHead>
                      <TableHead className="text-[11px] text-muted-foreground/60 uppercase tracking-[0.05em] w-32 text-right">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.recentImports.map((item: { id: string; title: string; type: string; status: string; created_at: string }) => (
                      <TableRow key={item.id} className="border-cinema-border hover:bg-white/[0.02]">
                        <TableCell className="font-medium text-foreground">
                          {item.title}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize text-xs">
                            {item.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              item.status === "published"
                                ? "bg-green-500/15 text-green-400 border-green-500/30"
                                : item.status === "draft"
                                  ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/30"
                                  : "bg-muted text-muted-foreground border-muted"
                            }
                          >
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {new Date(item.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Content by Status & Subscriptions by Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Content by Status */}
          <Card className="bg-cinema-surface border-cinema-border rounded-2xl hover:shadow-lg hover:shadow-black/20 transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-[13px] font-semibold text-foreground">
                Content by Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="h-2 bg-muted rounded-full animate-pulse"
                      style={{ width: `${80 - i * 20}%` }}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {stats?.contentByStatus.map(({ status, count }: { status: string; count: number }) => {
                    const max = Math.max(
                      ...(stats?.contentByStatus.map((c: { status: string; count: number }) => c.count) ?? [1]),
                    );
                    const pct = Math.round((count / max) * 100);
                    const barColor =
                      status === "published"
                        ? "bg-green-500/70"
                        : status === "draft"
                          ? "bg-yellow-500/70"
                          : "bg-muted-foreground/50";

                    return (
                      <div key={status} className="flex items-center gap-3">
                        <span className="text-[12px] text-muted-foreground w-24 capitalize shrink-0">
                          {status}
                        </span>
                        <div className="flex-1 h-2 bg-cinema-elevated rounded-full overflow-hidden">
                          <div
                            className={`h-full ${barColor} rounded-full transition-all duration-500`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[12px] font-semibold text-foreground w-8 text-right">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Subscriptions by Status */}
          <Card className="bg-cinema-surface border-cinema-border rounded-2xl hover:shadow-lg hover:shadow-black/20 transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-[13px] font-semibold text-foreground">
                Subscriptions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="h-2 bg-muted rounded-full animate-pulse"
                      style={{ width: `${80 - i * 12}%` }}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {stats?.subscriptionsByStatus.map(({ status, count }: { status: string; count: number }) => {
                    const max = Math.max(
                      ...(stats?.subscriptionsByStatus.map((s: { status: string; count: number }) => s.count) ?? [1]),
                    );
                    const pct = Math.round((count / max) * 100);
                    const barColor =
                      status === "active"
                        ? "bg-cinema-red/70"
                        : status === "trialing"
                          ? "bg-blue-400/70"
                          : status === "inactive"
                            ? "bg-yellow-500/70"
                            : status === "past_due"
                              ? "bg-orange-500/70"
                              : "bg-muted-foreground/50";

                    return (
                      <div key={status} className="flex items-center gap-3">
                        <span className="text-[12px] text-muted-foreground w-24 capitalize shrink-0">
                          {status.replace("_", " ")}
                        </span>
                        <div className="flex-1 h-2 bg-cinema-elevated rounded-full overflow-hidden">
                          <div
                            className={`h-full ${barColor} rounded-full transition-all duration-500`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[12px] font-semibold text-foreground w-8 text-right">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}