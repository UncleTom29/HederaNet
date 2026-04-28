import { clsx } from "clsx";

export interface SkeletonProps {
  className?: string;
  /** Renders as a circle (for avatars). */
  circle?: boolean;
  width?: string;
  height?: string;
}

/** Animated skeleton loader placeholder. */
export function Skeleton({ className, circle = false, width, height }: SkeletonProps) {
  return (
    <div
      className={clsx(
        "animate-pulse bg-gray-200",
        circle ? "rounded-full" : "rounded-md",
        className,
      )}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

/** Multi-line text skeleton. */
export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={clsx("h-4", i === lines - 1 ? "w-3/4" : "w-full")} />
      ))}
    </div>
  );
}
