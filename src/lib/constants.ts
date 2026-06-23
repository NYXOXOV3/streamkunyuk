// ---------------------------------------------------------------------------
// Shared Constants
// ---------------------------------------------------------------------------

import type { ContentType } from "@/lib/supabase/types";

/** Display labels for content types */
export const TYPE_LABELS: Record<ContentType, string> = {
  movie: "Movie",
  series: "Series",
  anime: "Anime",
  donghua: "Donghua",
  microdrama: "Micro-Drama",
};