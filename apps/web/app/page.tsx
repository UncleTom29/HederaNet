import Link from "next/link";
import { Button } from "@hederanet/ui";
import {
  Wifi,
  Zap,
  Cpu,
  Shield,
  Globe,
  TrendingUp,
  ArrowRight,
} from "lucide-react";

const features = [
  {
    icon: <Wifi className="h-6 w-6" />,
    title: "Mesh Internet",
    description:
      "Deploy community-owned WiFi hotspots and earn HBAR for every subscriber session. Expand internet access worldwide.",
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: "Solar Microgrids",
    description:
      "List surplus solar energy on the peer-to-peer energy market. Smart contracts settle trades automatically on Hedera.",
  },
  {
    icon: <Cpu className="h-6 w-6" />,
    title: "Edge Compute",
    description:
      "Run decentralized compute jobs on distributed edge nodes. Earn rewards for processing IoT data and AI workloads.",
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: "Operator Staking",
    description:
      "Stake HBAR to earn Bronze, Silver, or Gold tier status. Higher tiers unlock boosted reward multipliers.",
  },
  {
    icon: <Globe className="h-6 w-6" />,
    title: "IoT Oracle",
    description:
      "Multi-sig oracle nodes validate real-world sensor data on-chain, enabling trustless energy and uptime reporting.",
  },
  {
    icon: <TrendingUp className="h-6 w-6" />,
    title: "Transparent Earnings",
    description:
      "All transactions and rewards are recorded on Hedera's public ledger. Track earnings in real-time.",
  },
];

const stats = [
  { label: "Active Hotspots", value: "1,240+" },
  { label: "Energy Traded", value: "48 MWh" },
  { label: "HBAR Staked", value: "2.1M ℏ" },
  { label: "Countries", value: "32" },
];

export default function HomePage() {
  return (
    <main className="flex flex-col min-h-screen">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-hedera-600 text-xl">
            <Wifi className="h-6 w-6" />
            HederaNet
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <Link href="/map" className="hover:text-hedera-600 transition-colors">Map</Link>
            <Link href="/operators" className="hover:text-hedera-600 transition-colors">Operators</Link>
            <Link href="/about" className="hover:text-hedera-600 transition-colors">About</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/map">
              <Button variant="secondary" size="sm">View Map</Button>
            </Link>
            <Link href="/dashboard">
              <Button size="sm" rightIcon={<ArrowRight size={14} />}>
                Operator Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-hedera-900 via-hedera-800 to-hedera-700 px-4 py-24 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-hedera-600/50 bg-hedera-800/60 px-3 py-1 text-sm text-hedera-200">
            <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            Live on Hedera Testnet
          </div>
          <h1 className="text-5xl font-extrabold leading-tight tracking-tight md:text-6xl">
            The DePIN Platform for a
            <span className="text-hedera-300"> Decentralized</span> World
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-hedera-200">
            Deploy mesh internet hotspots, solar microgrids, and edge compute nodes.
            Earn HBAR rewards. Settled instantly on Hedera's fast, low-fee blockchain.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/operators">
              <Button size="lg" variant="primary" rightIcon={<ArrowRight />}>
                Become an Operator
              </Button>
            </Link>
            <Link href="/map">
              <Button size="lg" variant="ghost" className="text-white border border-hedera-500 hover:bg-hedera-800">
                Explore the Network
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-gray-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <dl className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <dt className="text-sm font-medium text-gray-500">{stat.label}</dt>
                <dd className="mt-1 text-3xl font-bold text-hedera-700">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              Three pillars of decentralized infrastructure
            </h2>
            <p className="mt-3 text-lg text-gray-500">
              Operators earn real yield by deploying physical hardware connected to Hedera.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-hedera-50 text-hedera-600">
                  {f.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{f.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-hedera-700 py-16 px-4 text-center text-white">
        <h2 className="text-3xl font-bold">Ready to build the decentralized internet?</h2>
        <p className="mt-3 text-hedera-200">
          Deploy your first node in minutes. No server required.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/operators">
            <Button size="lg" variant="secondary">
              Start as Operator
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50 py-8 px-4 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} HederaNet. Built on{" "}
        <a href="https://hedera.com" target="_blank" rel="noopener noreferrer" className="text-hedera-500 hover:underline">
          Hedera
        </a>
        .
      </footer>
    </main>
  );
}
