import type { Metadata } from "next";
import { Button } from "@hederanet/ui";
import { Plus } from "lucide-react";

export const metadata: Metadata = { title: "Energy Market" };

export default function EnergyPage() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Energy Market</h1>
        <Button variant="primary" leftIcon={<Plus size={16} />}>
          Create Listing
        </Button>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <p className="text-sm text-gray-500">
          List surplus solar energy for peer-to-peer trading. Connect your wallet to get started.
        </p>
      </div>
    </div>
  );
}
