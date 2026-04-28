FROM node:20-alpine AS base
WORKDIR /app
RUN npm install -g pnpm@8.15.4

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/config/package.json packages/config/
COPY packages/db/package.json packages/db/
COPY services/relayer/package.json services/relayer/
RUN pnpm install --frozen-lockfile --filter @hederanet/relayer...

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY tsconfig.base.json ./
COPY packages/config packages/config
COPY packages/db packages/db
COPY services/relayer services/relayer
RUN pnpm --filter @hederanet/relayer build

FROM node:20-alpine AS runner
WORKDIR /app
RUN addgroup -S relayer && adduser -S relayer -G relayer
COPY --from=builder /app/services/relayer/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

USER relayer
EXPOSE 4001
CMD ["node", "dist/index.js"]
