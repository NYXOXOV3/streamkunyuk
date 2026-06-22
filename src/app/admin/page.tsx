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
      </div>
    </>
  );
}