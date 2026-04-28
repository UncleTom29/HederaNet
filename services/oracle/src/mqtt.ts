import mqtt, { MqttClient } from "mqtt";
import { oracleQueue } from "./queue.js";
import { mqttConnections, mqttMessagesReceived } from "./metrics.js";

const MQTT_URL = process.env.MQTT_BROKER_URL ?? "mqtt://localhost:1883";
const MQTT_USERNAME = process.env.MQTT_USERNAME;
const MQTT_PASSWORD = process.env.MQTT_PASSWORD;

// Topic patterns:
//   hederanet/energy/{deviceId}/reading  — energy delivery readings
//   hederanet/network/{hotspotId}/uptime — uptime pings
//   hederanet/compute/{nodeId}/job       — compute job completions

export function startMqttSubscriber(): MqttClient {
  const options: mqtt.IClientOptions = {
    reconnectPeriod: 5_000,
    connectTimeout: 30_000,
  };
  if (MQTT_USERNAME) options.username = MQTT_USERNAME;
  if (MQTT_PASSWORD) options.password = MQTT_PASSWORD;

  const client = mqtt.connect(MQTT_URL, options);

  client.on("connect", () => {
    console.log("[MQTT] Connected to broker:", MQTT_URL);
    mqttConnections.inc();
    client.subscribe([
      "hederanet/energy/+/reading",
      "hederanet/network/+/uptime",
      "hederanet/compute/+/job",
    ], (err) => {
      if (err) console.error("[MQTT] Subscribe error:", err);
      else console.log("[MQTT] Subscribed to hederanet/# topics");
    });
  });

  client.on("message", async (topic, payload) => {
    mqttMessagesReceived.inc({ topic: topicCategory(topic) });
    try {
      const data = JSON.parse(payload.toString()) as Record<string, unknown>;
      await oracleQueue.add("process-reading", { topic, data, receivedAt: Date.now() });
    } catch (err) {
      console.error("[MQTT] Failed to enqueue message:", topic, err);
    }
  });

  client.on("error", (err) => {
    console.error("[MQTT] Error:", err.message);
  });

  client.on("reconnect", () => {
    console.log("[MQTT] Reconnecting...");
  });

  return client;
}

function topicCategory(topic: string): string {
  if (topic.includes("/energy/")) return "energy";
  if (topic.includes("/network/")) return "network";
  if (topic.includes("/compute/")) return "compute";
  return "unknown";
}
