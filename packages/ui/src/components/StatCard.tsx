import { type ReactNode } from "react";
import { clsx } from "clsx";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";

export interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  change?: number;
  changeLabel?: string;
  trend?: number; // percentage, positive = up, negative = down
  icon?: ReactNode;
  tier?: string;
  className?: string;
}

/** Displays a key metric with title, optional trend indicator and icon. */
export function StatCard({ title, value, unit, trend, change, changeLabel, icon, tier, className }: StatCardProps) {
  const effectiveTrend = change ?? trend;
  const trendPositive = effectiveTrend !== undefined && effectiveTrend > 0;
  const trendNegative = effectiveTrend !== undefined && effectiveTrend < 0;
  const trendNeutral = effectiveTrend !== undefined && effectiveTrend === 0;

  return (
    <div
      className={clsx(
        "rounded-xl border border-gray-200 bg-white p-5 shadow-sm",
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        {icon && (
          <span className="rounded-lg bg-hedera-50 p-2 text-hedera-600">{icon}</span>
        )}
      </div>

      <div className="mt-2 flex items-end gap-1">
        <span className="text-3xl font-bold text-gray-900">{value}</span>
        {unit && <span className="mb-1 text-sm text-gray-500">{unit}</span>}
        {tier && (
          <span className="mb-1 ml-1 text-sm font-medium text-hedera-600">{tier}</span>
        )}
      </div>

      {effectiveTrend !== undefined && (
        <div className="mt-2 flex items-center gap-1 text-sm">
          {trendPositive && (
            <>
              <TrendingUp size={14} className="text-green-500" />
              <span className="text-green-600">+{effectiveTrend}%</span>
            </>
          )}
          {trendNegative && (
            <>
              <TrendingDown size={14} className="text-red-500" />
              <span className="text-red-600">{effectiveTrend}%</span>
            </>
          )}
          {trendNeutral && (
            <>
              <Minus size={14} className="text-gray-400" />
              <span className="text-gray-500">0%</span>
            </>
          )}
          {changeLabel && <span className="text-gray-400">{changeLabel}</span>}
          {!changeLabel && <span className="text-gray-400">vs last period</span>}
        </div>
      )}
    </div>
  );
}
