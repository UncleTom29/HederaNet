import { clsx } from "clsx";

export interface UptimeBarProps {
  /** Array of 90 daily uptime values (0–100). Most recent last. */
  data: number[];
  className?: string;
}

function getColor(uptime: number): string {
  if (uptime >= 99) return "bg-green-500";
  if (uptime >= 95) return "bg-green-400";
  if (uptime >= 80) return "bg-yellow-400";
  if (uptime >= 50) return "bg-orange-400";
  return "bg-red-500";
}

/** 90-day uptime visualisation — one bar per day, coloured by % uptime. */
export function UptimeBar({ data, className }: UptimeBarProps) {
  // Ensure exactly 90 entries
  const entries = Array.from({ length: 90 }, (_, i) => data[i] ?? 0);
  const average = entries.reduce((a, b) => a + b, 0) / entries.length;

  return (
    <div className={clsx("space-y-1", className)}>
      <div className="flex items-end gap-px h-8">
        {entries.map((value, i) => (
          <div
            key={i}
            title={`Day ${i + 1}: ${value.toFixed(1)}%`}
            className={clsx("w-full rounded-sm", getColor(value))}
            style={{ height: `${Math.max(4, value)}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between text-xs text-gray-400">
        <span>90 days ago</span>
        <span>{average.toFixed(2)}% avg</span>
        <span>Today</span>
      </div>
    </div>
  );
}
