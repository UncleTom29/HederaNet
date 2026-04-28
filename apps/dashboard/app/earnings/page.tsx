import type { Metadata } from "next";

export const metadata: Metadata = { title: "Earnings" };

export default function EarningsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Earnings</h1>
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <p className="text-sm text-gray-500">
          Your reward history will appear here once you connect your wallet.
        </p>
      </div>
    </div>
  );
}
