"use client";

/**
 * HomeSkeleton
 *
 * Full-page loading skeleton shown while the Home Page
 * Server Component fetches data.
 */

import { Skeleton } from "@/components/ui/skeleton";

export function HomeSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero skeleton */}
      <div className="relative w-full h-[65vh] sm:h-[70vh] min-h-[420px] max-h-[720px] bg-cinema-surface">
        <Skeleton className="absolute inset-0" />
      </div>

      {/* Carousel skeletons */}
      <div className="max-w-8xl mx-auto space-y-6 py-8">
        {[...Array(4)].map((_, i) => (
          <section key={i} className="px-6 md:px-10 lg:px-0">
            <Skeleton className="h-6 w-40 mb-4" />
            <div className="flex gap-3 overflow-hidden">
              {[...Array(7)].map((_, j) => (
                <div
                  key={j}
                  className="shrink-0 w-[200px] space-y-2"
                >
                  <Skeleton className="aspect-video rounded-md" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}