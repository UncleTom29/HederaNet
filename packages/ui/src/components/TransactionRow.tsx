import { clsx } from "clsx";
import {
  Zap,
  Wifi,
  Cpu,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";

export type TxType =
  | "SUBSCRIPTION_PAYMENT"
  | "ENERGY_PURCHASE"
  | "ENERGY_SALE"
  | "STAKING_REWARD"
  | "UNSTAKE"
  | "STAKE"
  | "PLATFORM_FEE"
  | "REFUND";

export type TxStatus = "PENDING" | "SUCCESS" | "FAILED";

export interface TransactionRowProps {
  txType: TxType;
  description: string;
  amount: number; // in HBAR — positive = credit, negative = debit
  status: TxStatus;
  timestamp: Date | string;
  txHash?: string;
  className?: string;
}

const typeIcons: Record<TxType, React.ReactNode> = {
  SUBSCRIPTION_PAYMENT: <Wifi size={16} />,
  ENERGY_PURCHASE: <Zap size={16} />,
  ENERGY_SALE: <Zap size={16} />,
  STAKING_REWARD: <ArrowDownLeft size={16} />,
  UNSTAKE: <ArrowUpRight size={16} />,
  STAKE: <ArrowDownLeft size={16} />,
  PLATFORM_FEE: <Cpu size={16} />,
  REFUND: <ArrowDownLeft size={16} />,
};

const statusIcons: Record<TxStatus, React.ReactNode> = {
  PENDING: <Clock size={14} className="text-yellow-500" />,
  SUCCESS: <CheckCircle size={14} className="text-green-500" />,
  FAILED: <XCircle size={14} className="text-red-500" />,
};

function formatTime(ts: Date | string): string {
  const d = typeof ts === "string" ? new Date(ts) : ts;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Single row for a transaction in the activity feed. */
export function TransactionRow({
  txType,
  description,
  amount,
  status,
  timestamp,
  txHash,
  className,
}: TransactionRowProps) {
  const isCredit = amount >= 0;

  return (
    <div
      className={clsx(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-gray-50 transition-colors",
        className,
      )}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-hedera-50 text-hedera-600">
        {typeIcons[txType]}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-800">{description}</p>
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          {statusIcons[status]}
          <span>{formatTime(timestamp)}</span>
          {txHash && (
            <a
              href={`https://hashscan.io/testnet/transaction/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-hedera-500 hover:underline"
            >
              {txHash.slice(0, 8)}…
            </a>
          )}
        </div>
      </div>

      <span
        className={clsx(
          "shrink-0 text-sm font-semibold tabular-nums",
          isCredit ? "text-green-600" : "text-red-600",
        )}
      >
        {isCredit ? "+" : ""}
        {amount.toFixed(4)} ℏ
      </span>
    </div>
  );
}
