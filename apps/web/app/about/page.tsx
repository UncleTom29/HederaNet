import type { Metadata } from "next";
import Link from "next/link";
import { Github, ExternalLink } from "lucide-react";

export const metadata: Metadata = { title: "About" };

const team = [
  { name: "Core Contributors", role: "Open-source community" },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-4 py-20">
        <h1 className="text-4xl font-extrabold text-gray-900">About HederaNet</h1>
        <p className="mt-4 text-lg text-gray-600 leading-relaxed">
          HederaNet is an open-source DePIN (Decentralized Physical Infrastructure Network)
          platform built on the Hedera blockchain. Our mission is to incentivize the deployment
          of real-world connectivity, energy, and compute infrastructure through transparent,
          community-governed smart contracts.
        </p>

        <h2 className="mt-12 text-2xl font-bold text-gray-900">Architecture</h2>
        <ul className="mt-4 space-y-3 text-gray-600">
          <li><strong>Mesh Internet</strong> — LoRa/WiFi hotspots with per-session billing on Hedera Consensus Service (HCS)</li>
          <li><strong>Solar Microgrids</strong> — P2P energy trading via the EnergyMarket.sol smart contract with escrow</li>
          <li><strong>Edge Compute</strong> — Distributed job marketplace rewarded through the oracle network</li>
          <li><strong>Oracle Network</strong> — Multi-sig IoT data validation submitted to HCS for on-chain proof</li>
        </ul>

        <h2 className="mt-12 text-2xl font-bold text-gray-900">Technology Stack</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-gray-600">
          {[
            ["Blockchain", "Hedera (HCS + EVM)"],
            ["Smart Contracts", "Solidity 0.8.20 + OpenZeppelin 5"],
            ["Frontend", "Next.js 14, React 18, Tailwind CSS"],
            ["Backend", "Node.js, Prisma, PostgreSQL"],
            ["Queue", "Redis + BullMQ"],
            ["IoT Protocol", "MQTT (Eclipse Mosquitto)"],
            ["Wallet", "HashPack, Blade"],
            ["Monorepo", "pnpm workspaces + Turborepo"],
          ].map(([tech, val]) => (
            <div key={tech} className="rounded-lg bg-gray-50 p-3">
              <dt className="font-semibold text-gray-700">{tech}</dt>
              <dd className="text-gray-500">{val}</dd>
            </div>
          ))}
        </div>

        <h2 className="mt-12 text-2xl font-bold text-gray-900">Open Source</h2>
        <p className="mt-3 text-gray-600">
          HederaNet is fully open source under the MIT license. Contributions welcome.
        </p>
        <div className="mt-4 flex gap-4">
          <a
            href="https://github.com/UncleTom29/HederaNet"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-hedera-600 hover:underline"
          >
            <Github className="h-4 w-4" />
            GitHub Repository
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        <div className="mt-12 border-t border-gray-200 pt-8 text-sm text-gray-400 text-center">
          Built with ❤️ on{" "}
          <a href="https://hedera.com" target="_blank" rel="noopener noreferrer" className="text-hedera-500">
            Hedera
          </a>
          . Not financial advice.
        </div>
      </div>
    </div>
  );
}
