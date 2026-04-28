import { clsx } from "clsx";

export type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "purple";

export interface BadgeProps {
  variant?: BadgeVariant;
  label: string;
  pulse?: boolean;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-gray-100 text-gray-700",
  success: "bg-green-100 text-green-700",
  warning: "bg-yellow-100 text-yellow-700",
  danger: "bg-red-100 text-red-700",
  info: "bg-blue-100 text-blue-700",
  purple: "bg-purple-100 text-purple-700",
};

const pulseColors: Record<BadgeVariant, string> = {
  default: "bg-gray-400",
  success: "bg-green-500",
  warning: "bg-yellow-500",
  danger: "bg-red-500",
  info: "bg-blue-500",
  purple: "bg-purple-500",
};

/** Status badge with optional animated pulse dot. */
export function Badge({ variant = "default", label, pulse = false, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantStyles[variant],
        className,
      )}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span
            className={clsx(
              "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
              pulseColors[variant],
            )}
          />
          <span className={clsx("relative inline-flex h-2 w-2 rounded-full", pulseColors[variant])} />
        </span>
      )}
      {label}
    </span>
  );
}
