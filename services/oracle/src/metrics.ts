import {
  register,
  Counter,
  Gauge,
  collectDefaultMetrics,
} from "prom-client";

collectDefaultMetrics({ register });

export const mqttConnections = new Counter({
  name: "oracle_mqtt_connections_total",
  help: "Total number of MQTT broker connections",
  registers: [register],
});

export const mqttMessagesReceived = new Counter({
  name: "oracle_mqtt_messages_received_total",
  help: "Total MQTT messages received",
  labelNames: ["topic"] as const,
  registers: [register],
});

export const oracleReadingsProcessed = new Counter({
  name: "oracle_readings_processed_total",
  help: "Oracle readings successfully processed",
  labelNames: ["type"] as const,
  registers: [register],
});

export const oracleReadingsFailed = new Counter({
  name: "oracle_readings_failed_total",
  help: "Oracle readings that failed processing",
  labelNames: ["type"] as const,
  registers: [register],
});

export const queueDepth = new Gauge({
  name: "oracle_queue_depth",
  help: "Current number of jobs in the oracle queue",
  registers: [register],
});

export { register };
