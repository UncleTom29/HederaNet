import { Queue, Worker, type Job } from "bullmq";
import IORedis from "ioredis";
import { prisma } from "@hederanet/db";
import { getHederaService } from "@hederanet/db";
import { oracleReadingsProcessed, oracleReadingsFailed } from "./metrics.js";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

const connection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });

export const oracleQueue = new Queue("oracle-readings", { connection });

interface ReadingJob {
  topic: string;
  data: Record<string, unknown>;
  receivedAt: number;
}

export function startWorker(): Worker {
  const worker = new Worker<ReadingJob>(
    "oracle-readings",
    async (job: Job<ReadingJob>) => {
      const { topic, data } = job.data;

      if (topic.includes("/energy/")) {
        await processEnergyReading(topic, data);
      } else if (topic.includes("/network/")) {
        await processUptimeReading(topic, data);
      } else if (topic.includes("/compute/")) {
        await processComputeJob(topic, data);
      }
    },
    {
      connection,
      concurrency: 5,
    }
  );

  worker.on("completed", (job) => {
    oracleReadingsProcessed.inc({ type: topicToType(job.data.topic) });
    console.log(`[Worker] Job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    oracleReadingsFailed.inc({ type: job ? topicToType(job.data.topic) : "unknown" });
    console.error(`[Worker] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}

async function processEnergyReading(topic: string, data: Record<string, unknown>) {
  const parts = topic.split("/");
  const deviceId = parts[2] ?? "unknown";
  const kwh = Number(data["kwh"] ?? 0);

  const reading = await prisma.oracleReading.create({
    data: {
      type: "ENERGY_DELIVERY",
      deviceId,
      value: kwh,
      metadata: data as never, // Prisma Json: data is a validated MQTT payload object
      confirmedCount: 1,
    },
  });

  const hedera = getHederaService();
  const hcsTopicId = process.env["HCS_ENERGY_TOPIC_ID"];
  if (hcsTopicId) {
    await hedera.submitToHCS(hcsTopicId, JSON.stringify({
      type: "ENERGY_READING",
      readingId: reading.id,
      deviceId,
      kwh,
      timestamp: new Date().toISOString(),
    }));
  }
}

async function processUptimeReading(topic: string, data: Record<string, unknown>) {
  const parts = topic.split("/");
  const hotspotId = parts[2] ?? "unknown";
  const uptime = Number(data["uptime"] ?? 0);

  const reading = await prisma.oracleReading.create({
    data: {
      type: "NETWORK_UPTIME",
      deviceId: hotspotId,
      hotspotId,
      value: uptime,
      metadata: data as never, // Prisma Json: data is a validated MQTT payload object
      confirmedCount: 1,
    },
  });

  // Update hotspot uptime
  await prisma.hotspot.updateMany({
    where: { id: hotspotId },
    data: {
      isOnline: uptime > 0,
      lastSeenAt: new Date(),
      uptimePercent: uptime,
    },
  });

  const hedera = getHederaService();
  const hcsTopicId = process.env["HCS_NETWORK_TOPIC_ID"];
  if (hcsTopicId) {
    await hedera.submitToHCS(hcsTopicId, JSON.stringify({
      type: "UPTIME_READING",
      readingId: reading.id,
      hotspotId,
      uptime,
      timestamp: new Date().toISOString(),
    }));
  }
}

async function processComputeJob(topic: string, data: Record<string, unknown>) {
  const parts = topic.split("/");
  const nodeId = parts[2] ?? "unknown";

  await prisma.oracleReading.create({
    data: {
      type: "COMPUTE_JOB",
      deviceId: nodeId,
      value: 1,
      metadata: data as never, // Prisma Json: data is a validated MQTT payload object
      confirmedCount: 1,
    },
  });
}

function topicToType(topic: string): string {
  if (topic.includes("/energy/")) return "energy";
  if (topic.includes("/network/")) return "network";
  if (topic.includes("/compute/")) return "compute";
  return "unknown";
}
