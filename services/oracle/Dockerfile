FROM node:20-alpine AS base
WORKDIR /app
RUN npm install -g pnpm@8.15.4

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/config/package.json packages/config/
COPY packages/db/package.json packages/db/
COPY services/oracle/package.json services/oracle/
RUN pnpm install --frozen-lockfile --filter @hederanet/oracle...

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/config/node_modules packages/config/node_modules
COPY --from=deps /app/packages/db/node_modules packages/db/node_modules
COPY tsconfig.base.json ./
COPY packages/config packages/config
COPY packages/db packages/db
COPY services/oracle services/oracle
RUN pnpm --filter @hederanet/oracle build

FROM node:20-alpine AS runner
WORKDIR /app
RUN addgroup -S oracle && adduser -S oracle -G oracle
COPY --from=builder /app/services/oracle/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/db/node_modules ./packages/db/node_modules

USER oracle
EXPOSE 4000
CMD ["node", "dist/index.js"]
