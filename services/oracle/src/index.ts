import express from "express";
import { startMqttSubscriber } from "./mqtt.js";
import { startWorker } from "./queue.js";
import { register } from "./metrics.js";

const PORT = parseInt(process.env.PORT ?? "4000", 10);

async function main() {
  console.log("[Oracle] Starting HederaNet Oracle Service...");

  // Start MQTT subscriber
  const mqttClient = startMqttSubscriber();

  // Start BullMQ worker
  const worker = startWorker();

  // Start metrics + health HTTP server
  const app = express();

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", uptime: process.uptime() });
  });

  app.get("/metrics", async (_req, res) => {
    res.setHeader("Content-Type", register.contentType);
    res.send(await register.metrics());
  });

  app.listen(PORT, () => {
    console.log(`[Oracle] HTTP server listening on :${PORT}`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log("[Oracle] Shutting down...");
    mqttClient.end();
    await worker.close();
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

main().catch((err) => {
  console.error("[Oracle] Fatal error:", err);
  process.exit(1);
});
