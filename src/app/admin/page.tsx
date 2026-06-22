"use client";

import { useQuery } from "@tanstack/react-query";
import { AdminHeader } from "@/components/admin/AdminHeader";
// Fetch-based, no server actions
async function fetchDashboardStats() {
  const res = await fetch("/api/admin/stats");
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
    <Card className="bg-cinema-surface border-cinema-border">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="w-5 h-5 text-cinema-muted" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-foreground">{value.toLocaleString()}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
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

      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
        <Card className="bg-cinema-surface border-cinema-border">
          <CardHeader>
            <CardTitle className="text-base text-foreground">
              Content by Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="h-6 bg-muted rounded-md animate-pulse"
                    style={{ width: `${80 - i * 12}%` }}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {stats?.contentByType.map(({ type, count }) => {
                  const max = Math.max(
                    ...(stats?.contentByType.map((c) => c.count) ?? [1]),
                  );
                  const pct = Math.round((count / max) * 100);

                  return (
                    <div key={type} className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground w-24 capitalize shrink-0">
                        {type}
                      </span>
                      <div className="flex-1 h-6 bg-cinema-elevated rounded-md overflow-hidden">
                        <div
                          className="h-full bg-cinema-red/70 rounded-md transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-foreground w-8 text-right">
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
        <Card className="bg-cinema-surface border-cinema-border">
          <CardHeader>
            <CardTitle className="text-base text-foreground">
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
                      <TableHead className="text-muted-foreground">Title</TableHead>
                      <TableHead className="text-muted-foreground w-28">Type</TableHead>
                      <TableHead className="text-muted-foreground w-28">Status</TableHead>
                      <TableHead className="text-muted-foreground w-32 text-right">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.recentImports.map((item: { id: string; title: string; type: string; status: string; created_at: string }) => (
                      <TableRow key={item.id} className="border-cinema-border">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Content by Status */}
          <Card className="bg-cinema-surface border-cinema-border">
            <CardHeader>
              <CardTitle className="text-base text-foreground">
                Content by Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="h-6 bg-muted rounded-md animate-pulse"
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
                        <span className="text-sm text-muted-foreground w-24 capitalize shrink-0">
                          {status}
                        </span>
                        <div className="flex-1 h-6 bg-cinema-elevated rounded-md overflow-hidden">
                          <div
                            className={`h-full ${barColor} rounded-md transition-all duration-500`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-foreground w-8 text-right">
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
          <Card className="bg-cinema-surface border-cinema-border">
            <CardHeader>
              <CardTitle className="text-base text-foreground">
                Subscriptions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="h-6 bg-muted rounded-md animate-pulse"
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
                        <span className="text-sm text-muted-foreground w-24 capitalize shrink-0">
                          {status.replace("_", " ")}
                        </span>
                        <div className="flex-1 h-6 bg-cinema-elevated rounded-md overflow-hidden">
                          <div
                            className={`h-full ${barColor} rounded-md transition-all duration-500`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-foreground w-8 text-right">
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