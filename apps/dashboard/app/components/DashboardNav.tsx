"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Wifi, Zap, DollarSign, Shield } from "lucide-react";
import { clsx } from "clsx";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/hotspots", label: "Hotspots", icon: Wifi },
  { href: "/energy", label: "Energy", icon: Zap },
  { href: "/earnings", label: "Earnings", icon: DollarSign },
  { href: "/staking", label: "Staking", icon: Shield },
];

export default function DashboardNav() {
  const pathname = usePathname();
  return (
    <aside className="w-56 border-r border-gray-200 bg-white flex flex-col">
      <div className="flex h-16 items-center px-6 border-b border-gray-200">
        <Link href="/" className="text-lg font-bold text-hedera-600">HederaNet</Link>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              href === "/dashboard"
                ? pathname === href
                  ? "bg-hedera-50 text-hedera-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                : pathname === href || pathname.startsWith(href + "/")
                  ? "bg-hedera-50 text-hedera-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
