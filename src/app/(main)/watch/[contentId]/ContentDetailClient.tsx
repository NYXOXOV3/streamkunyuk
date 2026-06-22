"use client";

/**
 * ContentDetailClient
 *
 * Client component for the content detail page.
 * Currently handles the expandable synopsis.
 * Can be extended with: favorite toggle, share, report, etc.
 */

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const SYNOPSIS_COLLAPSE_LENGTH = 300;

export default function ContentDetailClient({
  synopsis,
}: {
  synopsis: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const isLong = synopsis.length > SYNOPSIS_COLLAPSE_LENGTH;

  return (
    <div>
      <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
        {!isLong || expanded
          ? synopsis
          : synopsis.slice(0, SYNOPSIS_COLLAPSE_LENGTH) + "..."}
      </p>

      {isLong && (
        <Button
          variant="ghost"
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-cinema-muted hover:text-foreground mt-2 -ml-2 h-7 px-2 gap-1"
        >
          {expanded ? (
            <>
              Show Less <ChevronUp className="w-3.5 h-3.5" />
            </>
          ) : (
            <>
              Read More <ChevronDown className="w-3.5 h-3.5" />
            </>
          )}
        </Button>
      )}
    </div>
  );
}