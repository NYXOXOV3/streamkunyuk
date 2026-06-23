import { createAdminClient } from "@/lib/supabase/admin";
import { EpisodeManagerClient } from "@/components/admin/EpisodeManagerClient";
import { AdminHeader } from "@/components/admin/AdminHeader";
import Link from "next/link";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Episode Manager Page
 *
 * Server Component that fetches the content title/type and passes
 * them to the client-side EpisodeManagerClient.
 *
 * Route: /admin/content/[id]/episodes
 */

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EpisodesPage({ params }: PageProps) {
  const { id } = await params;

  let content: { id: string; title: string; type: string } | null = null;
  let fetchError: string | null = null;

  try {
    const supabase = await createAdminClient();
    const { data, error } = await supabase
      .from("contents")
      .select("id, title, type")
      .eq("id", id)
      .single();

    if (error) throw error;
    content = data;
  } catch (e) {
    fetchError = (e as Error).message;
  }

  // Content not found
  if (!content && !fetchError) {
    return (
      <div className="flex-1 flex flex-col">
        <AdminHeader title="Content Not Found" />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
          <div className="w-16 h-16 rounded-full bg-cinema-elevated flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-muted-foreground/40" />
          </div>
          <div className="text-center">
            <p className="text-sm text-foreground font-medium">
              Content not found
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              The content item you&apos;re looking for doesn&apos;t exist or has been
              removed.
            </p>
          </div>
          <Button asChild variant="outline" className="border-cinema-border text-sm mt-2 rounded-xl">
            <Link href="/admin/content">
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Back to Content
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // Error fetching content
  if (fetchError) {
    return (
      <div className="flex-1 flex flex-col">
        <AdminHeader title="Error" />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-destructive/60" />
          </div>
          <div className="text-center">
            <p className="text-sm text-foreground font-medium">
              Failed to load content
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              {fetchError}
            </p>
          </div>
          <Button asChild variant="outline" className="border-cinema-border text-sm mt-2 rounded-xl">
            <Link href="/admin/content">
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Back to Content
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <EpisodeManagerClient
      contentId={content!.id}
      contentTitle={content!.title}
      contentType={content!.type as "movie" | "series" | "anime" | "donghua" | "microdrama"}
    />
  );
}