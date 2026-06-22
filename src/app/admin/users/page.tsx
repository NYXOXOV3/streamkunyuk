"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Eye, ShieldCheck, User } from "lucide-react";

interface UserSubscription {
  id: string;
  status: string;
  current_period_end: string | null;
  subscription_tier: {
    display_name: string;
  } | null;
}

interface UserRow {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  created_at: string;
  subscriptions: UserSubscription[];
}

export default function UsersPage() {
  const [search, setSearch] = useState("");

  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ["admin-users-list", search],
    queryFn: async () => {
      const sp = new URLSearchParams();
      if (search) sp.set("search", search);
      const res = await fetch(`/api/admin/users?${sp}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return (json.data ?? []) as UserRow[];
    },
    staleTime: 1000 * 60 * 2,
  });

  return (
    <>
      <AdminHeader title="User Management" />

      <div className="flex-1 p-6 space-y-4 overflow-y-auto">
        {/* Actions bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users..."
                className="h-9 pl-9 w-56 bg-cinema-elevated border-cinema-border text-sm"
              />
            </div>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3 text-sm text-destructive">
            Failed to load users: {(error as Error).message}
          </div>
        )}

        {/* Table */}
        <Card className="bg-cinema-surface border-cinema-border">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-cinema-border hover:bg-transparent">
                  <TableHead className="text-xs text-muted-foreground">
                    User
                  </TableHead>
                  <TableHead className="text-xs text-muted-foreground w-28">
                    Role
                  </TableHead>
                  <TableHead className="text-xs text-muted-foreground w-40">
                    Subscription
                  </TableHead>
                  <TableHead className="text-xs text-muted-foreground w-32">
                    Joined
                  </TableHead>
                  <TableHead className="text-xs text-muted-foreground w-24 text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i} className="border-cinema-border">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Skeleton className="w-8 h-8 rounded-full" />
                          <div className="space-y-1.5">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-3 w-20" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-14" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-16 ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : users.length === 0 ? (
                  <TableRow className="border-cinema-border">
                    <TableCell colSpan={5} className="text-center py-12">
                      <p className="text-sm text-muted-foreground">
                        No users found
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => {
                    const activeSub = user.subscriptions?.find(
                      (s) => s.status === "active",
                    );

                    return (
                      <TableRow
                        key={user.id}
                        className="border-cinema-border hover:bg-accent/50"
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {user.avatar_url ? (
                              <img
                                src={user.avatar_url}
                                alt=""
                                className="w-8 h-8 rounded-full object-cover bg-cinema-elevated"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-cinema-elevated flex items-center justify-center">
                                <User className="w-4 h-4 text-muted-foreground" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate max-w-[200px]">
                                {user.display_name || "Unnamed User"}
                              </p>
                              <p className="text-[11px] text-muted-foreground font-mono truncate max-w-[200px]">
                                {user.id.slice(0, 12)}…
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.is_admin ? (
                            <Badge
                              variant="outline"
                              className="text-[10px] bg-amber-500/15 text-amber-400 border-amber-500/30"
                            >
                              <ShieldCheck className="w-3 h-3 mr-1" />
                              Admin
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-[10px] border-cinema-border text-muted-foreground"
                            >
                              User
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {activeSub ? (
                            <div className="flex flex-col gap-0.5">
                              <Badge
                                variant="outline"
                                className="text-[10px] w-fit border-emerald-600/50 text-emerald-400"
                              >
                                Active
                              </Badge>
                              <span className="text-[11px] text-muted-foreground">
                                {activeSub.subscription_tier?.display_name ||
                                  "Standard"}
                              </span>
                            </div>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-[10px] border-cinema-border text-muted-foreground"
                            >
                              Free
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(user.created_at).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            },
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled
                            className="border-cinema-border text-xs h-7"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Count */}
        {!isLoading && (
          <p className="text-xs text-muted-foreground text-right">
            {users.length} user{users.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>
    </>
  );
}