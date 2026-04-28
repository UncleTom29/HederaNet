import type { Metadata } from "next";
import Link from "next/link";
import { Button, Badge } from "@hederanet/ui";
import { ArrowRight, Zap, Wifi, Server } from "lucide-react";

export const metadata: Metadata = { title: "Operators" };

export default function OperatorsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-16">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900">Become an Operator</h1>
          <p className="mt-3 text-lg text-gray-500">
            Deploy physical infrastructure and earn HBAR rewards. Three tiers, unlimited potential.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {[
            {
              tier: "Bronze",
              stake: "100 ℏ",
              multiplier: "1.0×",
              color: "bg-amber-50 border-amber-200",
              badgeVariant: "warning" as const,
              perks: ["Hotspot registration", "Energy listings", "Base rewards"],
            },
            {
              tier: "Silver",
              stake: "500 ℏ",
              multiplier: "1.5×",
              color: "bg-gray-50 border-gray-300",
              badgeVariant: "info" as const,
              perks: ["All Bronze perks", "1.5× reward multiplier", "Priority dispute resolution"],
            },
            {
              tier: "Gold",
              stake: "2,000 ℏ",
              multiplier: "2.5×",
              color: "bg-yellow-50 border-yellow-300",
              badgeVariant: "success" as const,
              perks: ["All Silver perks", "2.5× reward multiplier", "Oracle node eligibility"],
            },
          ].map((t) => (
            <div key={t.tier} className={`rounded-xl border p-6 ${t.color}`}>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">{t.tier}</h2>
                <Badge variant={t.badgeVariant} label={t.multiplier} />
              </div>
              <p className="mb-4 text-2xl font-extrabold text-hedera-700">{t.stake}</p>
              <ul className="space-y-2 text-sm text-gray-600">
                {t.perks.map((p) => (
                  <li key={p} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-hedera-500" />
                    {p}
                  </li>
                ))}
              </ul>
              <Link href="/dashboard" className="mt-6 block">
                <Button className="w-full" variant="primary" rightIcon={<ArrowRight size={14} />}>
                  Stake to {t.tier}
                </Button>
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-3 text-center">
          {[
            { icon: <Wifi className="mx-auto h-8 w-8 text-hedera-500" />, label: "WiFi Hotspot", desc: "Deploy a LoRa or WiFi node to earn bandwidth rewards." },
            { icon: <Zap className="mx-auto h-8 w-8 text-solar-500" />, label: "Solar Microgrid", desc: "Sell surplus solar power on the energy marketplace." },
            { icon: <Server className="mx-auto h-8 w-8 text-gray-500" />, label: "Edge Compute", desc: "Provide compute resources for IoT and AI workloads." },
          ].map((item) => (
            <div key={item.label} className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
              {item.icon}
              <h3 className="mt-3 font-semibold text-gray-900">{item.label}</h3>
              <p className="mt-1 text-sm text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
