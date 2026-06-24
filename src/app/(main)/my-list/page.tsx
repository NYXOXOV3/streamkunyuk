"use client";

import { Suspense, useState, useEffect } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/stores/authStore";
import { ContentCard } from "@/components/home/ContentCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Bookmark, Film } from "lucide-react";
import type { Content } from "@/lib/supabase/types";

function MyListContent() {
  const { userId } = useAuthStore();
  const [contents, setContents] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setIsLoading(false); return; }
    const supabase = createClient();
    (async () => {
      try {
        const { data } = await supabase
          .from("favorites")
          .select("content:contents(*)")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });
        const items = ((data as unknown as Record<string, unknown>[]) ?? [])
          .map((r: Record<string, unknown>) => r.content as Content)
          .filter(Boolean);
        setContents(items);
      } catch { /* ignore */ }
      setIsLoading(false);
    })();
  }, [userId]);

  return (
    <div className="min-h-screen bg-cinema-bg max-w-[1400px] mx-auto px-5 py-10">
      <h1 className="text-2xl font-bold text-foreground mb-1 flex items-center gap-2">
        <Bookmark className="w-6 h-6 text-cinema-red" /> My List
      </h1>
      <p className="text-sm text-muted-foreground mb-8">Content you&apos;ve saved for later</p>

      {isLoading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 sm:gap-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[2/3] w-full rounded-xl bg-cinema-elevated" />
              <Skeleton className="h-4 w-3/4 rounded" />
            </div>
          ))}
        </div>
      ) : contents.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-full bg-cinema-elevated flex items-center justify-center mx-auto mb-4">
            <Film className="w-8 h-8 text-muted-foreground/50" />
          </div>
          <p className="text-foreground font-medium mb-1">Your list is empty</p>
          <p className="text-sm text-muted-foreground">Save content to your list to watch later</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 sm:gap-4">
          {contents.map((c, i) => <ContentCard key={c.id} content={c} index={i} />)}
        </div>
      )}
    </div>
  );
}

export default function MyListPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cinema-bg" />}>
      <AuthGuard>
        <MyListContent />
      </AuthGuard>
    </Suspense>
  );
}
