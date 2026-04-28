import { z } from "zod";

const envSchema = z.object({
  // Hedera Network
  HEDERA_NETWORK: z.enum(["mainnet", "testnet", "previewnet"]).default("testnet"),
  HEDERA_OPERATOR_ID: z.string().min(1, "HEDERA_OPERATOR_ID is required"),
  HEDERA_OPERATOR_PRIVATE_KEY: z.string().min(1, "HEDERA_OPERATOR_PRIVATE_KEY is required"),
  HEDERA_MIRROR_NODE_URL: z
    .string()
    .url()
    .default("https://testnet.mirrornode.hedera.com"),

  // App URLs
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),

  // Database
  DATABASE_URL: z.string().url().startsWith("postgresql://"),

  // Redis
  REDIS_URL: z.string().url().startsWith("redis://"),

  // Auth
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  NEXTAUTH_SECRET: z.string().min(1, "NEXTAUTH_SECRET is required"),
  NEXTAUTH_URL: z.string().url().default("http://localhost:3000"),

  // Email (optional)
  SENDGRID_API_KEY: z.string().optional(),

  // IPFS
  IPFS_GATEWAY_URL: z
    .string()
    .url()
    .default("https://gateway.pinata.cloud"),

  // MQTT (Oracle Service)
  MQTT_BROKER_URL: z.string().default("mqtt://localhost:1883"),
  MQTT_USERNAME: z.string().optional(),
  MQTT_PASSWORD: z.string().optional(),

  // Prometheus
  METRICS_PORT: z.coerce.number().default(9090),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validates and returns typed environment variables.
 * Throws a descriptive error if validation fails.
 */
export function parseEnv(raw: NodeJS.ProcessEnv = process.env): Env {
  const result = envSchema.safeParse(raw);
  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  • ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`❌ Invalid environment variables:\n${formatted}`);
  }
  return result.data;
}

export { envSchema };
