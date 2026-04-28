import type { Config } from "tailwindcss";
import { sharedConfig } from "@hederanet/config/tailwind";

const config: Config = {
  ...sharedConfig,
  content: [
    "./app/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    ...(sharedConfig.theme ?? {}),
    extend: {
      ...(sharedConfig.theme?.extend ?? {}),
    },
  },
};

export default config;
