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
    <div className="min-h-screen">
      {/* Hero skeleton */}
      <div className="relative w-full h-[65vh] sm:h-[70vh] min-h-[420px] max-h-[720px] bg-cinema-surface">
        <Skeleton className="absolute inset-0" />
      </div>

      {/* Carousel skeletons */}
      <div className="max-w-8xl mx-auto space-y-8 py-10">
        {[...Array(4)].map((_, i) => (
          <section key={i} className="px-5 md:px-8 lg:px-0">
            <Skeleton className="h-7 w-44 mb-5 rounded-md" />
            <div className="flex gap-3 overflow-hidden">
              {[...Array(7)].map((_, j) => (
                <div
                  key={j}
                  className="shrink-0 w-[170px] space-y-2"
                >
                  <Skeleton className="aspect-[2/3] rounded-xl" />
                  <Skeleton className="h-4 w-3/4 rounded-md" />
                  <Skeleton className="h-3 w-1/2 rounded-md" />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}