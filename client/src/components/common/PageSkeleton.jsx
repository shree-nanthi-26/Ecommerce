import React from "react";

/**
 * Accessible PageSkeleton fallback displayed during route transitions & lazy-loading.
 */
export default function PageSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading page content"
      className="max-w-[1500px] mx-auto px-6 py-10 min-h-[60vh] animate-pulse space-y-8"
    >
      <span className="sr-only">Loading page content, please wait...</span>

      {/* Hero skeleton */}
      <div
        className="w-full h-48 md:h-72 rounded-3xl skeleton-shimmer"
      />

      {/* Header bar skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-64 rounded-xl skeleton-shimmer" />
        <div className="h-8 w-32 rounded-xl skeleton-shimmer" />
      </div>

      {/* Grid of skeleton cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="rounded-3xl p-4 border space-y-4"
            style={{
              background: "var(--color-surface)",
              borderColor: "var(--color-border)",
            }}
          >
            <div className="w-full h-48 rounded-2xl skeleton-shimmer" />
            <div className="h-5 w-3/4 rounded-lg skeleton-shimmer" />
            <div className="h-4 w-1/2 rounded-lg skeleton-shimmer" />
            <div className="flex items-center justify-between pt-2">
              <div className="h-6 w-24 rounded-lg skeleton-shimmer" />
              <div className="h-9 w-24 rounded-xl skeleton-shimmer" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
