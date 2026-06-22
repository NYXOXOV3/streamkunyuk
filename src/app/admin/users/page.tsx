"use client";

import { AdminHeader } from "@/components/admin/AdminHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function UsersPage() {
  return (
    <>
      <AdminHeader title="User Management" />
      <div className="flex-1 p-6 overflow-y-auto">
        <Card className="bg-cinema-surface border-cinema-border">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <Users className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              User management coming in Phase 2 continuation.
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              View, search, and manage user accounts and subscriptions.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}