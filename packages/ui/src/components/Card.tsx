import { type HTMLAttributes, type ReactNode } from "react";
import { clsx } from "clsx";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  header?: ReactNode;
  footer?: ReactNode;
  hoverable?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingClasses = {
  none: "",
  sm: "p-3",
  md: "p-5",
  lg: "p-7",
};

/** Card container with optional header, body, and footer slots. */
export function Card({
  header,
  footer,
  hoverable = false,
  padding = "md",
  children,
  className,
  ...props
}: CardProps) {
  return (
    <div
      className={clsx(
        "rounded-xl border border-gray-200 bg-white shadow-sm",
        hoverable && "transition-shadow duration-200 hover:shadow-md cursor-pointer",
        className,
      )}
      {...props}
    >
      {header && (
        <div className="border-b border-gray-100 px-5 py-3 font-semibold text-gray-800">
          {header}
        </div>
      )}
      <div className={clsx(paddingClasses[padding])}>{children}</div>
      {footer && (
        <div className="border-t border-gray-100 px-5 py-3 text-sm text-gray-500">
          {footer}
        </div>
      )}
    </div>
  );
}
