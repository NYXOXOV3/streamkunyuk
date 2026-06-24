"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[ErrorBoundary]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-cinema-bg flex flex-col items-center justify-center px-4 text-center">
      <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
        <Play className="w-8 h-8 text-destructive/60 ml-0.5" />
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-2">Something went wrong</h1>
      <p className="text-muted-foreground mb-6 max-w-md">
        An unexpected error occurred. Please try again.
      </p>
      <Button
        onClick={reset}
        className="bg-cinema-red hover:bg-cinema-red-hover text-white rounded-xl"
      >
        Try Again
      </Button>
    </div>
  );
}
