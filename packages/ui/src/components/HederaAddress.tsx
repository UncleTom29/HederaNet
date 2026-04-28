"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import { clsx } from "clsx";

export interface HederaAddressProps {
  accountId: string;
  /** Characters to show on each side of the truncation. Default 6. */
  truncateChars?: number;
  showCopy?: boolean;
  showExplorer?: boolean;
  network?: "mainnet" | "testnet";
  className?: string;
}

function truncate(address: string, chars: number): string {
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars)}…${address.slice(-chars)}`;
}

/** Displays a truncated Hedera account ID with copy and explorer link buttons. */
export function HederaAddress({
  accountId,
  truncateChars = 6,
  showCopy = true,
  showExplorer = true,
  network = "testnet",
  className,
}: HederaAddressProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(accountId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const explorerUrl = `https://hashscan.io/${network}/account/${accountId}`;

  return (
    <span className={clsx("inline-flex items-center gap-1 font-mono text-sm", className)}>
      <span title={accountId}>{truncate(accountId, truncateChars)}</span>

      {showCopy && (
        <button
          onClick={handleCopy}
          className="rounded p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Copy address"
        >
          {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
        </button>
      )}

      {showExplorer && (
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded p-0.5 text-gray-400 hover:text-hedera-600 transition-colors"
          aria-label="View on HashScan"
        >
          <ExternalLink size={13} />
        </a>
      )}
    </span>
  );
}
