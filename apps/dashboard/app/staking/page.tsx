import type { Metadata } from "next";
import { OperatorTierBadge } from "@hederanet/ui";

export const metadata: Metadata = { title: "Staking" };

const tiers = [
  { tier: "BRONZE" as const, stake: 100, multiplier: "1.0×", desc: "Entry level. Deploy hotspots and list energy." },
  { tier: "SILVER" as const, stake: 500, multiplier: "1.5×", desc: "Boosted rewards across all infrastructure types." },
  { tier: "GOLD" as const, stake: 2000, multiplier: "2.5×", desc: "Maximum rewards. Eligible for oracle node operation." },
];

export default function StakingPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Staking</h1>
      <p className="text-sm text-gray-500 mb-6">
        Stake HBAR to unlock higher reward tiers and earn multiplied rewards.
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        {tiers.map((t) => (
          <div key={t.tier} className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="flex items-center gap-2 mb-3">
              <OperatorTierBadge tier={t.tier} />
              <span className="text-sm font-semibold text-gray-700">{t.multiplier}</span>
            </div>
            <p className="text-3xl font-extrabold text-hedera-700 mb-1">{t.stake} ℏ</p>
            <p className="text-sm text-gray-500">{t.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6">
        <p className="text-sm text-gray-500">
          Connect your wallet to stake HBAR and select your tier.
        </p>
      </div>
    </div>
  );
}
