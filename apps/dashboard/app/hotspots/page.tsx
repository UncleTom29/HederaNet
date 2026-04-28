import type { Metadata } from "next";
import { Button } from "@hederanet/ui";
import { Plus } from "lucide-react";

export const metadata: Metadata = { title: "Hotspots" };

export default function HotspotsPage() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Hotspots</h1>
        <Button variant="primary" leftIcon={<Plus size={16} />}>
          Add Hotspot
        </Button>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <p className="text-sm text-gray-500">
          Connect your wallet to view and manage your hotspots.
        </p>
      </div>
    </div>
  );
}
