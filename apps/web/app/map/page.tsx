import type { Metadata } from "next";
import { Wifi, MapPin, Activity } from "lucide-react";

export const metadata: Metadata = { title: "Network Map" };

export default function MapPage() {
  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4">
        <div className="flex items-center gap-2 font-semibold text-gray-900">
          <MapPin className="h-5 w-5 text-hedera-600" />
          Network Map
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-green-400" /> Online
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-gray-300" /> Offline
          </span>
        </div>
      </header>
      <div className="relative flex-1 bg-gray-100">
        {/* Map placeholder — integrate Mapbox/Leaflet in production */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-gray-400">
          <Wifi className="h-16 w-16" />
          <p className="text-lg font-medium">Interactive map loads here</p>
          <p className="text-sm">
            Connect a Mapbox token via <code className="font-mono">NEXT_PUBLIC_MAPBOX_TOKEN</code>
          </p>
        </div>
      </div>
      <div className="border-t border-gray-200 bg-white px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
        <Activity className="h-4 w-4" />
        Hotspot data refreshes every 30 seconds via the HederaNet API
      </div>
    </div>
  );
}
