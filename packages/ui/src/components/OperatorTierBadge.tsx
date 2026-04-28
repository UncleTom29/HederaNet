import { clsx } from "clsx";
import { Award } from "lucide-react";

export type OperatorTier = "BRONZE" | "SILVER" | "GOLD";

export interface OperatorTierBadgeProps {
  tier: OperatorTier;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const tierConfig: Record<
  OperatorTier,
  { label: string; color: string; iconColor: string }
> = {
  BRONZE: {
    label: "Bronze",
    color: "bg-amber-100 text-amber-800 border-amber-200",
    iconColor: "text-amber-600",
  },
  SILVER: {
    label: "Silver",
    color: "bg-slate-100 text-slate-700 border-slate-200",
    iconColor: "text-slate-500",
  },
  GOLD: {
    label: "Gold",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    iconColor: "text-yellow-500",
  },
};

const sizeClasses = {
  sm: "px-2 py-0.5 text-xs gap-1",
  md: "px-2.5 py-1 text-sm gap-1.5",
  lg: "px-3 py-1.5 text-base gap-2",
};

const iconSizes = { sm: 12, md: 14, lg: 18 };

/** Operator tier badge with Award icon — Bronze / Silver / Gold. */
export function OperatorTierBadge({
  tier,
  showLabel = true,
  size = "md",
  className,
}: OperatorTierBadgeProps) {
  const config = tierConfig[tier];

  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border font-medium",
        config.color,
        sizeClasses[size],
        className,
      )}
    >
      <Award size={iconSizes[size]} className={config.iconColor} />
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}
