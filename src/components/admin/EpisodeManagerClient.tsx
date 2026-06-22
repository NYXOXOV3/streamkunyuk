"use client";

/**
 * EpisodeManagerClient
 *
 * Full episode management UI for a single content item.
 * Features:
 *   - Episode list table with lock/trial badges and inline toggle switches
 *   - Add / Edit episode dialog with external URL video input (no file upload)
 *   - Bulk actions: Unlock All, Lock All, Set First 3 as Free Trial
 *   - React Query for data fetching + optimistic-aware mutations
 *   - Loading skeletons, empty state, delete confirmation
 */

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  getEpisodes,
  createEpisode,
  updateEpisode,
  deleteEpisode,
  updateEpisodeLock,
  bulkUpdateEpisodeLocks,
} from "@/lib/admin/content-actions";
import type { Episode, ContentType } from "@/lib/supabase/types";
import {
  Plus,
  Pencil,
  Trash2,
  Lock,
  Unlock,
  Gift,
  Video,
  Loader2,
  ExternalLink,
  Link2,
  AlertCircle,
  Save,
  ListVideo,
  ShieldCheck,
  ShieldX,
  ArrowLeft,
  Clock,
  Image,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const QUERY_KEY = (contentId: string) => ["episodes", contentId] as const;

function formatRuntime(seconds: number | null): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function truncateUrl(url: string, maxLen = 40): string {
  if (url.length <= maxLen) return url;
  return url.slice(0, maxLen) + "…";
}

function extractSubtitleUrl(
  subtitles: Record<string, string>[] | null,
): string {
  if (!subtitles || subtitles.length === 0) return "";
  return subtitles[0].url || "";
}

// ---------------------------------------------------------------------------
// Episode Form Dialog (Add / Edit)
// ---------------------------------------------------------------------------

interface EpisodeFormState {
  episode_number: string;
  title: string;
  synopsis: string;
  thumbnail_url: string;
  video_url: string;
  video_url_backup: string;
  subtitle_url: string;
  is_locked: boolean;
  is_free_trial: boolean;
}

const EMPTY_FORM: EpisodeFormState = {
  episode_number: "",
  title: "",
  synopsis: "",
  thumbnail_url: "",
  video_url: "",
  video_url_backup: "",
  subtitle_url: "",
  is_locked: false,
  is_free_trial: false,
};

function episodeToForm(episode: Episode): EpisodeFormState {
  return {
    episode_number: String(episode.episode_number),
    title: episode.title || "",
    synopsis: episode.synopsis || "",
    thumbnail_url: episode.thumbnail_url || "",
    video_url: episode.video_url || "",
    video_url_backup: episode.video_url_backup || "",
    subtitle_url: extractSubtitleUrl(episode.subtitles_url),
    is_locked: episode.is_locked,
    is_free_trial: episode.is_free_trial,
  };
}

function EpisodeFormDialog({
  open,
  onOpenChange,
  episode,
  contentId,
  isSaving,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  episode: Episode | null; // null = adding, non-null = editing
  contentId: string;
  isSaving: boolean;
  onSave: (data: Record<string, unknown>) => void;
}) {
  const [form, setForm] = useState<EpisodeFormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  // Populate form when episode changes or dialog opens
  const handleOpen = useCallback(
    (isOpen: boolean) => {
      if (isOpen) {
        setForm(episode ? episodeToForm(episode) : { ...EMPTY_FORM });
        setError(null);
      }
      onOpenChange(isOpen);
    },
    [episode, onOpenChange],
  );

  function updateField<K extends keyof EpisodeFormState>(
    key: K,
    value: EpisodeFormState[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (error) setError(null);
  }

  function handleSubmit() {
    // Client-side validation
    const epNum = parseInt(form.episode_number, 10);
    if (!epNum || epNum < 1) {
      setError("Episode number must be at least 1");
      return;
    }
    if (!form.video_url.trim()) {
      setError("Video URL is required");
      return;
    }
    if (
      !form.video_url.startsWith("http://") &&
      !form.video_url.startsWith("https://")
    ) {
      setError("Video URL must start with http:// or https://");
      return;
    }

    onSave({
      episode_number: epNum,
      title: form.title || undefined,
      synopsis: form.synopsis || undefined,
      thumbnail_url: form.thumbnail_url || undefined,
      video_url: form.video_url.trim(),
      video_url_backup: form.video_url_backup || undefined,
      subtitle_url: form.subtitle_url || undefined,
      is_locked: form.is_locked,
      is_free_trial: form.is_free_trial,
    });
  }

  const isEditing = episode !== null;

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="bg-cinema-surface border-cinema-border max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {isEditing
              ? `Edit Episode ${episode!.episode_number}`
              : "Add New Episode"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isEditing
              ? "Update episode details, video source, and access control."
              : "Fill in the episode details. Video URL is required."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Error display */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2 text-sm text-destructive flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Episode Number */}
          <div className="space-y-1.5">
            <Label htmlFor="ep-number" className="text-sm text-foreground">
              Episode Number <span className="text-destructive">*</span>
            </Label>
            <Input
              id="ep-number"
              type="number"
              min={1}
              value={form.episode_number}
              onChange={(e) => updateField("episode_number", e.target.value)}
              placeholder="e.g. 1"
              className="h-9 bg-cinema-elevated border-cinema-border text-sm"
            />
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="ep-title" className="text-sm text-foreground">
              Title
            </Label>
            <Input
              id="ep-title"
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="e.g. The Beginning"
              className="h-9 bg-cinema-elevated border-cinema-border text-sm"
            />
          </div>

          {/* Synopsis */}
          <div className="space-y-1.5">
            <Label htmlFor="ep-synopsis" className="text-sm text-foreground">
              Synopsis
            </Label>
            <Textarea
              id="ep-synopsis"
              value={form.synopsis}
              onChange={(e) => updateField("synopsis", e.target.value)}
              placeholder="Brief episode description..."
              rows={3}
              className="bg-cinema-elevated border-cinema-border text-sm resize-none"
            />
          </div>

          {/* Thumbnail URL */}
          <div className="space-y-1.5">
            <Label htmlFor="ep-thumb" className="text-sm text-foreground">
              Thumbnail URL
            </Label>
            <div className="relative">
              <Image className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                id="ep-thumb"
                value={form.thumbnail_url}
                onChange={(e) => updateField("thumbnail_url", e.target.value)}
                placeholder="https://example.com/thumb.jpg"
                className="h-9 pl-8 bg-cinema-elevated border-cinema-border text-sm"
              />
            </div>
          </div>

          <Separator className="bg-cinema-border" />

          {/* Video URL — CRITICAL: External URL only, NO file upload */}
          <div className="space-y-1.5">
            <Label htmlFor="ep-video" className="text-sm text-foreground">
              Video URL <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Video className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                id="ep-video"
                value={form.video_url}
                onChange={(e) => updateField("video_url", e.target.value)}
                placeholder="https://cdn.example.com/episode1.m3u8"
                className="h-9 pl-8 bg-cinema-elevated border-cinema-border text-sm font-mono"
              />
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Paste HLS (.m3u8) or MP4 link from external host (e.g., Bunny.net,
              Cloudflare Stream). Do not upload video files directly.
            </p>
          </div>

          {/* Backup Video URL */}
          <div className="space-y-1.5">
            <Label
              htmlFor="ep-video-backup"
              className="text-sm text-foreground"
            >
              Backup Video URL
              <span className="text-muted-foreground font-normal ml-1">
                (optional)
              </span>
            </Label>
            <div className="relative">
              <Video className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                id="ep-video-backup"
                value={form.video_url_backup}
                onChange={(e) =>
                  updateField("video_url_backup", e.target.value)
                }
                placeholder="https://backup-cdn.example.com/episode1.m3u8"
                className="h-9 pl-8 bg-cinema-elevated border-cinema-border text-sm font-mono"
              />
            </div>
          </div>

          {/* Subtitle URL */}
          <div className="space-y-1.5">
            <Label htmlFor="ep-subs" className="text-sm text-foreground">
              Subtitle URL
              <span className="text-muted-foreground font-normal ml-1">
                (optional)
              </span>
            </Label>
            <div className="relative">
              <Link2 className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                id="ep-subs"
                value={form.subtitle_url}
                onChange={(e) => updateField("subtitle_url", e.target.value)}
                placeholder="https://example.com/subs/ep1.vtt"
                className="h-9 pl-8 bg-cinema-elevated border-cinema-border text-sm font-mono"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Supports .vtt and .srt subtitle files.
            </p>
          </div>

          <Separator className="bg-cinema-border" />

          {/* Access Control Toggles */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">
              Access Control
            </p>

            <div className="flex items-center justify-between rounded-lg bg-cinema-elevated px-3 py-2.5">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-foreground">
                    Requires Subscription
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Episode is locked for non-subscribers
                  </p>
                </div>
              </div>
              <Switch
                checked={form.is_locked}
                onCheckedChange={(checked) => updateField("is_locked", checked)}
                className="data-[state=checked]:bg-cinema-red"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg bg-cinema-elevated px-3 py-2.5">
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-cinema-gold" />
                <div>
                  <p className="text-sm text-foreground">
                    Free Trial
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Available to non-subscribers as a preview
                  </p>
                </div>
              </div>
              <Switch
                checked={form.is_free_trial}
                onCheckedChange={(checked) =>
                  updateField("is_free_trial", checked)
                }
                className="data-[state=checked]:bg-cinema-gold"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => handleOpen(false)}
            className="border-cinema-border text-sm"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSaving}
            className="bg-cinema-red hover:bg-cinema-red-hover text-white text-sm"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-1.5" />
            )}
            {isEditing ? "Update Episode" : "Add Episode"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Episode Row
// ---------------------------------------------------------------------------

function EpisodeRow({
  episode,
  isUpdatingLock,
  onToggleLock,
  onToggleFreeTrial,
  onEdit,
  onDelete,
}: {
  episode: Episode;
  isUpdatingLock: boolean;
  onToggleLock: (val: boolean) => void;
  onToggleFreeTrial: (val: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const hasVideo = !!episode.video_url;

  return (
    <TableRow className="border-cinema-border hover:bg-accent/50 group">
      {/* Episode Number */}
      <TableCell className="w-16">
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-cinema-elevated text-sm font-semibold text-foreground">
          {episode.episode_number}
        </span>
      </TableCell>

      {/* Thumbnail */}
      <TableCell className="w-14">
        {episode.thumbnail_url ? (
          <img
            src={episode.thumbnail_url}
            alt=""
            className="w-10 h-7 object-cover rounded border border-cinema-border"
          />
        ) : (
          <div className="w-10 h-7 rounded bg-cinema-elevated border border-cinema-border flex items-center justify-center">
            <Image className="w-3.5 h-3.5 text-muted-foreground/40" />
          </div>
        )}
      </TableCell>

      {/* Title */}
      <TableCell className="max-w-[200px]">
        <p className="text-sm font-medium text-foreground truncate">
          {episode.title || `Episode ${episode.episode_number}`}
        </p>
        {episode.synopsis && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {episode.synopsis}
          </p>
        )}
      </TableCell>

      {/* Video URL */}
      <TableCell className="max-w-[180px]">
        {hasVideo ? (
          <a
            href={episode.video_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="truncate font-mono max-w-[140px]">
              {truncateUrl(episode.video_url, 30)}
            </span>
            <ExternalLink className="w-3 h-3 shrink-0 opacity-50" />
          </a>
        ) : (
          <span className="text-xs text-destructive">No URL</span>
        )}
      </TableCell>

      {/* Runtime */}
      <TableCell className="w-16 text-center">
        <span className="text-xs text-muted-foreground flex items-center justify-center gap-1">
          <Clock className="w-3 h-3" />
          {formatRuntime(episode.runtime_seconds)}
        </span>
      </TableCell>

      {/* Status Badges */}
      <TableCell className="w-28">
        <div className="flex items-center gap-1.5 flex-wrap">
          {episode.is_locked ? (
            <Badge
              variant="outline"
              className="text-[10px] border-red-500/40 text-red-400 bg-red-500/10 gap-1"
            >
              <Lock className="w-2.5 h-2.5" />
              Locked
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="text-[10px] border-emerald-500/40 text-emerald-400 bg-emerald-500/10 gap-1"
            >
              <Unlock className="w-2.5 h-2.5" />
              Open
            </Badge>
          )}
          {episode.is_free_trial && (
            <Badge
              variant="outline"
              className="text-[10px] border-amber-500/40 text-cinema-gold bg-amber-500/10 gap-1"
            >
              <Gift className="w-2.5 h-2.5" />
              Trial
            </Badge>
          )}
        </div>
      </TableCell>

      {/* Toggle Switches */}
      <TableCell className="w-48">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={episode.is_locked}
              onCheckedChange={onToggleLock}
              disabled={isUpdatingLock}
              className="data-[state=checked]:bg-cinema-red"
            />
            <span className="text-[11px] text-muted-foreground whitespace-nowrap">
              Lock
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={episode.is_free_trial}
              onCheckedChange={onToggleFreeTrial}
              disabled={isUpdatingLock}
              className="data-[state=checked]:bg-cinema-gold"
            />
            <span className="text-[11px] text-muted-foreground whitespace-nowrap">
              Trial
            </span>
          </div>
        </div>
      </TableCell>

      {/* Actions */}
      <TableCell className="w-20 text-right">
        <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------

function EpisodeTableSkeleton() {
  return (
    <Card className="bg-cinema-surface border-cinema-border">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-cinema-border hover:bg-transparent">
              <TableHead className="text-xs text-muted-foreground w-16">
                #
              </TableHead>
              <TableHead className="text-xs text-muted-foreground w-14" />
              <TableHead className="text-xs text-muted-foreground">
                Title
              </TableHead>
              <TableHead className="text-xs text-muted-foreground">
                Video
              </TableHead>
              <TableHead className="text-xs text-muted-foreground w-16 text-center">
                Runtime
              </TableHead>
              <TableHead className="text-xs text-muted-foreground w-28">
                Status
              </TableHead>
              <TableHead className="text-xs text-muted-foreground w-48">
                Controls
              </TableHead>
              <TableHead className="text-xs text-muted-foreground w-20 text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(6)].map((_, i) => (
              <TableRow key={i} className="border-cinema-border">
                <TableCell>
                  <Skeleton className="h-8 w-8 rounded-full mx-auto" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-7 w-10 rounded" />
                </TableCell>
                <TableCell className="space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-3 w-28" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-3 w-8 mx-auto" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-16" />
                </TableCell>
                <TableCell>
                  <div className="flex gap-4">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1 justify-end">
                    <Skeleton className="h-7 w-7" />
                    <Skeleton className="h-7 w-7" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main EpisodeManagerClient
// ---------------------------------------------------------------------------

export function EpisodeManagerClient({
  contentId,
  contentTitle,
  contentType,
}: {
  contentId: string;
  contentTitle: string;
  contentType: ContentType;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ---- State ----
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEpisode, setEditingEpisode] = useState<Episode | null>(null);
  const [deletingEpisode, setDeletingEpisode] = useState<Episode | null>(null);
  const [updatingLockId, setUpdatingLockId] = useState<string | null>(null);

  // ---- Query: Fetch episodes ----
  const {
    data: episodes = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: QUERY_KEY(contentId),
    queryFn: async () => {
      const result = await getEpisodes(contentId);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    staleTime: 1000 * 60 * 2, // 2 min stale time for admin edits
    retry: 1,
  });

  // ---- Mutation: Create / Update episode ----
  const saveMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      if (editingEpisode) {
        const result = await updateEpisode(editingEpisode.id, data);
        if (!result.success) throw new Error(result.error ?? "Update failed");
      } else {
        const result = await createEpisode(contentId, data);
        if (!result.success) throw new Error(result.error ?? "Create failed");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY(contentId) });
      setDialogOpen(false);
      setEditingEpisode(null);
      toast({
        title: editingEpisode ? "Episode updated" : "Episode added",
        description: editingEpisode
          ? `Episode ${editingEpisode.episode_number} has been updated.`
          : "New episode has been added to this content.",
      });
    },
    onError: (err) => {
      toast({
        title: "Save failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // ---- Mutation: Delete episode ----
  const deleteMutation = useMutation({
    mutationFn: async (episodeId: string) => {
      const result = await deleteEpisode(episodeId);
      if (!result.success) throw new Error(result.error ?? "Delete failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY(contentId) });
      setDeletingEpisode(null);
      toast({
        title: "Episode deleted",
        description: "The episode has been permanently removed.",
      });
    },
    onError: (err) => {
      toast({
        title: "Delete failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // ---- Mutation: Toggle individual episode lock ----
  const toggleLockMutation = useMutation({
    mutationFn: async ({
      episodeId,
      updates,
    }: {
      episodeId: string;
      updates: { is_locked?: boolean; is_free_trial?: boolean };
    }) => {
      const result = await updateEpisodeLock(episodeId, updates);
      if (!result.success) throw new Error(result.error ?? "Toggle failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY(contentId) });
      setUpdatingLockId(null);
    },
    onError: (err) => {
      setUpdatingLockId(null);
      toast({
        title: "Toggle failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // ---- Mutation: Bulk update episode locks ----
  const bulkMutation = useMutation({
    mutationFn: async (updates: {
      is_locked?: boolean;
      is_free_trial?: boolean;
      episodeIds?: string[];
    }) => {
      const result = await bulkUpdateEpisodeLocks(contentId, updates);
      if (!result.success) throw new Error(result.error ?? "Bulk update failed");
      return result.updated;
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY(contentId) });
      toast({
        title: "Bulk update applied",
        description: `${updated} episode${updated !== 1 ? "s" : ""} updated.`,
      });
    },
    onError: (err) => {
      toast({
        title: "Bulk update failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // ---- Handlers ----
  function handleOpenAdd() {
    setEditingEpisode(null);
    setDialogOpen(true);
  }

  function handleOpenEdit(episode: Episode) {
    setEditingEpisode(episode);
    setDialogOpen(true);
  }

  function handleSave(data: Record<string, unknown>) {
    saveMutation.mutate(data);
  }

  function handleToggleLock(episode: Episode, value: boolean) {
    setUpdatingLockId(episode.id);
    toggleLockMutation.mutate({
      episodeId: episode.id,
      updates: { is_locked: value },
    });
  }

  function handleToggleFreeTrial(episode: Episode, value: boolean) {
    setUpdatingLockId(episode.id);
    toggleLockMutation.mutate({
      episodeId: episode.id,
      updates: { is_free_trial: value },
    });
  }

  function handleBulkUnlockAll() {
    if (episodes.length === 0) return;
    bulkMutation.mutate({ is_locked: false });
  }

  function handleBulkLockAll() {
    if (episodes.length === 0) return;
    bulkMutation.mutate({ is_locked: true });
  }

  function handleBulkSetFirst3FreeTrial() {
    if (episodes.length === 0) return;
    // Get first 3 episode IDs (sorted by episode_number already from query)
    const first3Ids = episodes.slice(0, 3).map((ep) => ep.id);
    // Set all as NOT free trial first, then set first 3 as free trial
    bulkMutation.mutate({
      is_free_trial: false,
    });
    // After that succeeds, set first 3 as free trial
    // We do it in a single call by first clearing all, then setting first 3
    // Actually, let's do it smarter: set all to false, then the first 3 to true
    bulkUpdateEpisodeLocks(contentId, { is_free_trial: false }).then(
      (clearResult) => {
        if (clearResult.success && first3Ids.length > 0) {
          bulkUpdateEpisodeLocks(contentId, {
            is_free_trial: true,
            episodeIds: first3Ids,
          }).then((setResult) => {
            queryClient.invalidateQueries({
              queryKey: QUERY_KEY(contentId),
            });
            toast({
              title: "Free trial applied",
              description: `First ${first3Ids.length} episodes set as free trial.`,
            });
          });
        }
      },
    );
  }

  const hasEpisodes = episodes.length > 0;
  const isBulkActionLoading = bulkMutation.isPending;

  return (
    <>
      <AdminHeader title={`Episodes — ${contentTitle}`} />

      <div className="flex-1 p-6 space-y-4 overflow-y-auto">
        {/* Back link + Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground h-7 px-2">
            <Link href="/admin/content">
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Content
            </Link>
          </Button>
          <span className="text-muted-foreground/40">/</span>
          <span className="text-foreground font-medium truncate max-w-[200px]">
            {contentTitle}
          </span>
          <Badge
            variant="outline"
            className="text-[10px] capitalize border-cinema-border text-muted-foreground ml-1"
          >
            {contentType}
          </Badge>
        </div>

        {/* Bulk Actions Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground mr-1">
              <ListVideo className="w-4 h-4 inline mr-1" />
              {isLoading ? (
                <Skeleton className="h-4 w-24 inline-block align-middle" />
              ) : (
                <span className="text-foreground font-medium">
                  {episodes.length}
                </span>
              )}{" "}
              episode{episodes.length !== 1 ? "s" : ""}
            </span>

            <Separator
              orientation="vertical"
              className="h-5 bg-cinema-border hidden sm:block"
            />

            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkUnlockAll}
              disabled={isBulkActionLoading || !hasEpisodes}
              className="border-cinema-border text-xs h-8"
            >
              {isBulkActionLoading ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <Unlock className="w-3.5 h-3.5 mr-1.5" />
              )}
              Unlock All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkLockAll}
              disabled={isBulkActionLoading || !hasEpisodes}
              className="border-cinema-border text-xs h-8"
            >
              {isBulkActionLoading ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <Lock className="w-3.5 h-3.5 mr-1.5" />
              )}
              Lock All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkSetFirst3FreeTrial}
              disabled={isBulkActionLoading || !hasEpisodes}
              className="border-cinema-border text-xs h-8 text-cinema-gold hover:text-cinema-gold hover:border-cinema-gold/50"
            >
              {isBulkActionLoading ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <Gift className="w-3.5 h-3.5 mr-1.5" />
              )}
              First 3 Free Trial
            </Button>
          </div>

          <Button
            onClick={handleOpenAdd}
            className="bg-cinema-red hover:bg-cinema-red-hover text-white text-xs h-8"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add Episode
          </Button>
        </div>

        {/* Error State */}
        {isError && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3 text-sm text-destructive flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Failed to load episodes</p>
              <p className="text-xs mt-0.5 opacity-80">
                Check your connection and try again.
              </p>
            </div>
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading && <EpisodeTableSkeleton />}

        {/* Empty State */}
        {!isLoading && !isError && !hasEpisodes && (
          <Card className="bg-cinema-surface border-cinema-border">
            <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-16 h-16 rounded-full bg-cinema-elevated flex items-center justify-center">
                <ListVideo className="w-7 h-7 text-muted-foreground/40" />
              </div>
              <div className="text-center">
                <p className="text-sm text-foreground font-medium">
                  No episodes yet
                </p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  Add your first episode to start building the content. Each
                  episode requires an external video URL (HLS or MP4).
                </p>
              </div>
              <Button
                onClick={handleOpenAdd}
                className="bg-cinema-red hover:bg-cinema-red-hover text-white text-sm mt-2"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Add First Episode
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Episode Table */}
        {!isLoading && hasEpisodes && (
          <Card className="bg-cinema-surface border-cinema-border">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-cinema-border hover:bg-transparent">
                    <TableHead className="text-xs text-muted-foreground w-16 text-center">
                      #
                    </TableHead>
                    <TableHead className="text-xs text-muted-foreground w-14">
                      Thumb
                    </TableHead>
                    <TableHead className="text-xs text-muted-foreground">
                      Title
                    </TableHead>
                    <TableHead className="text-xs text-muted-foreground">
                      Video Source
                    </TableHead>
                    <TableHead className="text-xs text-muted-foreground w-16 text-center">
                      Runtime
                    </TableHead>
                    <TableHead className="text-xs text-muted-foreground w-28">
                      Status
                    </TableHead>
                    <TableHead className="text-xs text-muted-foreground w-48">
                      Paywall
                    </TableHead>
                    <TableHead className="text-xs text-muted-foreground w-20 text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {episodes.map((episode) => (
                    <EpisodeRow
                      key={episode.id}
                      episode={episode}
                      isUpdatingLock={updatingLockId === episode.id}
                      onToggleLock={(val) =>
                        handleToggleLock(episode, val)
                      }
                      onToggleFreeTrial={(val) =>
                        handleToggleFreeTrial(episode, val)
                      }
                      onEdit={() => handleOpenEdit(episode)}
                      onDelete={() => setDeletingEpisode(episode)}
                    />
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add / Edit Dialog */}
      <EpisodeFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        episode={editingEpisode}
        contentId={contentId}
        isSaving={saveMutation.isPending}
        onSave={handleSave}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingEpisode}
        onOpenChange={(open) => !open && setDeletingEpisode(null)}
      >
        <AlertDialogContent className="bg-cinema-surface border-cinema-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              Delete Episode {deletingEpisode?.episode_number}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This will permanently remove{" "}
              <span className="text-foreground font-medium">
                {deletingEpisode?.title ||
                  `Episode ${deletingEpisode?.episode_number}`}
              </span>{" "}
              from this content. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="border-cinema-border text-sm"
              onClick={() => setDeletingEpisode(null)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-white text-sm"
              onClick={() => {
                if (deletingEpisode) {
                  deleteMutation.mutate(deletingEpisode.id);
                }
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}