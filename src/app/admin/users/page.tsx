"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, ShieldCheck, User, Pencil, Trash2, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

// ---------- Helper: get auth header ----------
async function getAuthHeaders(): Promise<HeadersInit> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session?.access_token ?? ""}`,
  };
}

// ---------- Types ----------
interface UserRow {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  created_at: string;
  subscription_status: string | null;
  subscription_tier: string | null;
  subscription_end: string | null;
}

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  // --- Edit dialog state ---
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [editIsAdmin, setEditIsAdmin] = useState(false);

  // --- Delete dialog state ---
  const [deleteUser, setDeleteUser] = useState<UserRow | null>(null);

  // ---------- Query ----------
  const {
    data: users = [],
    isLoading,
    error,
  } = useQuery({
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

  // ---------- Edit mutation ----------
  const editMutation = useMutation({
    mutationFn: async (payload: {
      id: string;
      display_name?: string;
      avatar_url?: string;
      is_admin?: boolean;
    }) => {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/admin/users?id=${payload.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          display_name: payload.display_name,
          avatar_url: payload.avatar_url,
          is_admin: payload.is_admin,
        }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users-list"] });
      toast.success("User updated successfully");
      setEditUser(null);
    },
    onError: (e) => toast.error(`Failed to update: ${e.message}`),
  });

  // ---------- Delete mutation ----------
  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/admin/users?id=${userId}`, {
        method: "DELETE",
        headers,
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users-list"] });
      toast.success("User deleted successfully");
      setDeleteUser(null);
    },
    onError: (e) => toast.error(`Failed to delete: ${e.message}`),
  });

  // ---------- Handlers ----------
  function openEdit(user: UserRow) {
    setEditUser(user);
    setEditName(user.display_name ?? "");
    setEditAvatar(user.avatar_url ?? "");
    setEditIsAdmin(user.is_admin);
  }

  function handleEditSave() {
    if (!editUser) return;
    editMutation.mutate({
      id: editUser.id,
      display_name: editName.trim() || null,
      avatar_url: editAvatar.trim() || null,
      is_admin: editIsAdmin,
    });
  }

  function handleDeleteConfirm() {
    if (!deleteUser) return;
    deleteMutation.mutate(deleteUser.id);
  }

  return (
    <>
      <AdminHeader title="User Management" />

      <div className="flex-1 p-8 space-y-4 overflow-y-auto">
        {/* Actions bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users..."
                className="h-10 rounded-xl pl-9 w-64 bg-cinema-elevated border-cinema-border text-sm"
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
        <Card className="bg-cinema-surface border-cinema-border rounded-2xl overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-cinema-border hover:bg-transparent">
                  <TableHead className="text-[11px] text-muted-foreground/60 uppercase tracking-[0.05em]">
                    User
                  </TableHead>
                  <TableHead className="text-[11px] text-muted-foreground/60 uppercase tracking-[0.05em] w-28">
                    Role
                  </TableHead>
                  <TableHead className="text-[11px] text-muted-foreground/60 uppercase tracking-[0.05em] w-40">
                    Subscription
                  </TableHead>
                  <TableHead className="text-[11px] text-muted-foreground/60 uppercase tracking-[0.05em] w-32">
                    Joined
                  </TableHead>
                  <TableHead className="text-[11px] text-muted-foreground/60 uppercase tracking-[0.05em] w-28 text-right">
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
                          <Skeleton className="w-8 h-8 rounded-full rounded-lg" />
                          <div className="space-y-1.5">
                            <Skeleton className="h-4 w-28 rounded-lg" />
                            <Skeleton className="h-3 w-20 rounded-lg" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-14 rounded-lg" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-20 rounded-lg" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24 rounded-lg" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-20 rounded-lg ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : users.length === 0 ? (
                  <TableRow className="border-cinema-border">
                    <TableCell
                      colSpan={5}
                      className="text-center py-12"
                    >
                      <p className="text-sm text-muted-foreground">
                        No users found
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow
                      key={user.id}
                      className="border-cinema-border hover:bg-white/[0.02]"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {user.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt=""
                              className="w-9 h-9 rounded-full object-cover bg-cinema-elevated"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-cinema-elevated flex items-center justify-center">
                              <User className="w-4 h-4 text-muted-foreground" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate max-w-[200px]">
                              {user.display_name || "Unnamed User"}
                            </p>
                            <p className="text-[11px] text-muted-foreground font-mono truncate max-w-[200px]">
                              {user.id.slice(0, 12)}...
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.is_admin ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] bg-amber-500/15 text-amber-400 border-amber-500/30 rounded-lg"
                          >
                            <ShieldCheck className="w-3 h-3 mr-1" />
                            Admin
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-[10px] border-cinema-border text-muted-foreground rounded-lg"
                          >
                            User
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.subscription_status === "active" ? (
                          <div className="flex flex-col gap-0.5">
                            <Badge
                              variant="outline"
                              className="text-[10px] w-fit border-emerald-600/50 text-emerald-400 rounded-lg"
                            >
                              Active
                            </Badge>
                            <span className="text-[11px] text-muted-foreground">
                              {user.subscription_tier || "Standard"}
                            </span>
                          </div>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-[10px] border-cinema-border text-muted-foreground rounded-lg"
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
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(user)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-white/[0.06] rounded-lg"
                            title="Edit user"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteUser(user)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                            title="Delete user"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Count */}
        {!isLoading && (
          <p className="text-[11px] text-muted-foreground/50 text-right">
            {users.length} user{users.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* ===================== EDIT USER DIALOG ===================== */}
      <Dialog
        open={!!editUser}
        onOpenChange={(open) => !open && setEditUser(null)}
      >
        <DialogContent className="bg-cinema-surface border-cinema-border rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Edit User</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Update user details. Leave fields empty to clear them.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Display Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Display Name
              </label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter display name"
                className="h-10 rounded-xl bg-cinema-elevated border-cinema-border text-sm"
              />
            </div>

            {/* Avatar URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Avatar URL
              </label>
              <Input
                value={editAvatar}
                onChange={(e) => setEditAvatar(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="h-10 rounded-xl bg-cinema-elevated border-cinema-border text-sm"
              />
            </div>

            {/* Is Admin toggle */}
            <div className="flex items-center justify-between rounded-xl bg-cinema-elevated border border-cinema-border px-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Admin Role
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Grant full admin access to this user
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={editIsAdmin}
                onClick={() => setEditIsAdmin(!editIsAdmin)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-cinema-red focus-visible:ring-offset-2 focus-visible:ring-offset-cinema-surface ${
                  editIsAdmin ? "bg-cinema-red" : "bg-muted-foreground/30"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    editIsAdmin ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* User ID (read-only) */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                User ID
              </label>
              <div className="h-10 rounded-xl bg-cinema-bg border border-cinema-border px-3 flex items-center">
                <span className="text-xs font-mono text-muted-foreground truncate">
                  {editUser?.id}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setEditUser(null)}
              className="rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/[0.06]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditSave}
              disabled={editMutation.isPending}
              className="rounded-xl bg-cinema-red hover:bg-cinema-red/90 text-white"
            >
              {editMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===================== DELETE USER DIALOG ===================== */}
      <Dialog
        open={!!deleteUser}
        onOpenChange={(open) => !open && setDeleteUser(null)}
      >
        <DialogContent className="bg-cinema-surface border-cinema-border rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Delete User</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              This action cannot be undone. The user&apos;s profile and
              authentication will be permanently removed.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <div className="flex items-center gap-3 rounded-xl bg-red-500/5 border border-red-500/20 px-4 py-3">
              <div className="w-10 h-10 rounded-full bg-red-500/15 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {deleteUser?.display_name || "Unnamed User"}
                </p>
                <p className="text-[11px] text-muted-foreground font-mono truncate">
                  {deleteUser?.id}
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setDeleteUser(null)}
              className="rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/[0.06]"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
              className="rounded-xl"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-1.5" />
              )}
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}