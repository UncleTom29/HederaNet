import type { Metadata } from "next";
import { StatCard } from "@hederanet/ui";
import { Wifi, Zap, DollarSign, Shield } from "lucide-react";

export const metadata: Metadata = { title: "Dashboard Overview" };

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Overview</h1>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Active Hotspots"
          value="3"
          icon={<Wifi className="h-5 w-5" />}
          change={1}
          changeLabel="this month"
        />
        <StatCard
          title="Energy Listed"
          value="24 kWh"
          icon={<Zap className="h-5 w-5" />}
          change={-2}
          changeLabel="kWh vs last week"
        />
        <StatCard
          title="Earnings (7d)"
          value="142.5 ℏ"
          icon={<DollarSign className="h-5 w-5" />}
          change={18}
          changeLabel="vs prior week"
        />
        <StatCard
          title="Staked HBAR"
          value="500 ℏ"
          icon={<Shield className="h-5 w-5" />}
          tier="Silver"
        />
      </div>

      <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Recent Activity</h2>
        <p className="text-sm text-gray-500">Connect your wallet to view recent transactions.</p>
      </div>
    </div>
  );
}
