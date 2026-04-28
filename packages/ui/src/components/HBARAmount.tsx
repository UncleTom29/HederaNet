export interface HBARAmountProps {
  /** Amount in tinybars (1 HBAR = 100_000_000 tinybars). */
  tinybars: number | bigint;
  /** Optional USD price of 1 HBAR. */
  hbarUsdPrice?: number;
  showUsd?: boolean;
  decimals?: number;
  className?: string;
}

const TINYBAR_PER_HBAR = 100_000_000;

/** Converts tinybars to HBAR and optionally shows the USD equivalent. */
export function HBARAmount({
  tinybars,
  hbarUsdPrice,
  showUsd = true,
  decimals = 4,
  className,
}: HBARAmountProps) {
  const hbar = Number(tinybars) / TINYBAR_PER_HBAR;
  const usd = hbarUsdPrice !== undefined ? hbar * hbarUsdPrice : null;

  return (
    <span className={className}>
      <span className="font-semibold tabular-nums">
        {hbar.toFixed(decimals)} <span className="font-normal text-gray-500">ℏ</span>
      </span>
      {showUsd && usd !== null && (
        <span className="ml-1 text-sm text-gray-400">(${usd.toFixed(2)})</span>
      )}
    </span>
  );
}
