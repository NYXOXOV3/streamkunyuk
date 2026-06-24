"use client";

import { Suspense, useState, useEffect } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/stores/authStore";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Clock, Film, Play } from "lucide-react";
import type { Content, Episode } from "@/lib/supabase/types";

interface HistoryItem {
  id: string;
  content_id: string;
  episode_id: string | null;
  progress_seconds: number;
  duration_seconds: number;
  completed: boolean;
  last_watched_at: string;
  content: Content | null;
  episode: Episode | null;
}

function HistoryContent() {
  const { userId } = useAuthStore();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    supabase
      .from("watch_history")
      .select("*, content:contents(*), episode:episodes(*)")
      .eq("user_id", userId)
      .order("last_watched_at", { ascending: false })
      .limit(50)
      .then(({ data }: { data: unknown }) => {
        setItems((data ?? []) as unknown as HistoryItem[]);
      })
      .finally(() => setIsLoading(false));
  }, [userId]);

  return <HistoryView items={items} isLoading={isLoading} />;
}

function HistoryView({ items, isLoading }: { items: HistoryItem[]; isLoading: boolean }) {
  function formatTime(seconds: number): string {
    if (!seconds || seconds < 0) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  return (
    <div className="min-h-screen bg-cinema-bg max-w-4xl mx-auto px-5 py-10">
      <h1 className="text-2xl font-bold text-foreground mb-1 flex items-center gap-2">
        <Clock className="w-6 h-6 text-cinema-red" /> Watch History
      </h1>
      <p className="text-sm text-muted-foreground mb-8">Content you&apos;ve watched</p>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl bg-cinema-elevated" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-full bg-cinema-elevated flex items-center justify-center mx-auto mb-4">
            <Film className="w-8 h-8 text-muted-foreground/50" />
          </div>
          <p className="text-foreground font-medium mb-1">No watch history</p>
          <p className="text-sm text-muted-foreground">Start watching to see your history here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const c = item.content;
            if (!c) return null;
            const imageUrl = c.poster_url || c.backdrop_url;
            const progress = item.duration_seconds > 0 ? Math.min((item.progress_seconds / item.duration_seconds) * 100, 100) : 0;
            const href = item.episode_id ? `/watch/${c.id}/${item.episode_id}` : `/watch/${c.id}`;

            return (
              <Link key={item.id} href={href} className="flex items-center gap-4 p-3 rounded-xl bg-cinema-surface border border-cinema-border hover:border-white/10 transition-colors group">
                <div className="w-16 h-20 shrink-0 rounded-lg overflow-hidden bg-cinema-elevated">
                  {imageUrl ? (
                    <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Play className="w-5 h-5 text-muted-foreground/30" /></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{c.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.episode && <span>E{item.episode.episode_number}{item.episode.title ? `: ${item.episode.title}` : ""}</span>}
                  </p>
                  <div className="mt-1.5 h-1 bg-cinema-elevated rounded-full overflow-hidden">
                    <div className="h-full bg-cinema-red rounded-full" style={{ width: `${progress}%` }} />
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-muted-foreground">{formatTime(item.progress_seconds)} / {formatTime(item.duration_seconds)}</p>
                  <p className="text-[10px] text-muted-foreground/50 mt-0.5">{new Date(item.last_watched_at).toLocaleDateString()}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function HistoryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cinema-bg flex items-center justify-center"><Skeleton className="h-10 w-40 rounded-xl" /></div>}>
      <AuthGuard>
        <HistoryContent />
      </AuthGuard>
    </Suspense>
  );
}
