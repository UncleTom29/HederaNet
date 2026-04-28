import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@hederanet/ui";
import { WalletProvider } from "@hederanet/sdk";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "HederaNet — DePIN on Hedera",
    template: "%s | HederaNet",
  },
  description:
    "Decentralized physical infrastructure for mesh internet, solar microgrids, and edge compute on Hedera blockchain.",
  openGraph: {
    type: "website",
    siteName: "HederaNet",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-gray-50 font-sans antialiased">
        <WalletProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
