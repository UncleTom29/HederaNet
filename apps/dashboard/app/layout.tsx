import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@hederanet/ui";
import { WalletProvider } from "@hederanet/sdk";
import DashboardNav from "./components/DashboardNav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Operator Dashboard | HederaNet", template: "%s | HederaNet" },
  description: "Manage your HederaNet infrastructure and earnings.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-gray-50`}>
        <WalletProvider>
          <ToastProvider>
            <div className="flex min-h-screen">
              <DashboardNav />
              <main className="flex-1 p-8">{children}</main>
            </div>
          </ToastProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
