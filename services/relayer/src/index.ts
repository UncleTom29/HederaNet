/**
 * Relayer Service — submits pending on-chain transactions to Hedera EVM
 * and updates their status in the database.
 *
 * Polls the DB for PENDING transactions every 15 seconds, submits them
 * via the HederaService, and marks them CONFIRMED or FAILED.
 */
import express from "express";
import { prisma, getHederaService } from "@hederanet/db";

const PORT = parseInt(process.env.PORT ?? "4001", 10);
const POLL_INTERVAL_MS = 15_000;

async function processPendingTransactions() {
  const pending = await prisma.transaction.findMany({
    where: { status: "PENDING" },
    take: 50,
    orderBy: { createdAt: "asc" },
  });

  if (pending.length === 0) return;

  console.log(`[Relayer] Processing ${pending.length} pending transaction(s)`);
  const hedera = getHederaService();

  for (const tx of pending) {
    if (!tx.txId) continue;
    try {
      const record = await hedera.getTransactionRecord(tx.txId);
      if (!record) continue;

      await prisma.transaction.update({
        where: { id: tx.id },
        data: { status: "CONFIRMED", confirmedAt: new Date() },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[Relayer] Failed to confirm tx ${tx.txId}:`, message);
      await prisma.transaction.update({
        where: { id: tx.id },
        data: { status: "FAILED", errorMessage: message },
      });
    }
  }
}

async function main() {
  console.log("[Relayer] Starting HederaNet Relayer Service...");

  const app = express();

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", uptime: process.uptime() });
  });

  app.listen(PORT, () => {
    console.log(`[Relayer] HTTP server listening on :${PORT}`);
  });

  // Poll immediately on start, then on interval
  await processPendingTransactions().catch(console.error);
  const interval = setInterval(() => {
    processPendingTransactions().catch(console.error);
  }, POLL_INTERVAL_MS);

  const shutdown = async () => {
    console.log("[Relayer] Shutting down...");
    clearInterval(interval);
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

main().catch((err) => {
  console.error("[Relayer] Fatal error:", err);
  process.exit(1);
});
