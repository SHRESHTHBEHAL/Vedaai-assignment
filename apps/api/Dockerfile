FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY tsconfig.json ./
COPY packages/shared/ ./packages/shared/
COPY apps/api/tsconfig.json ./apps/api/
COPY apps/api/src/ ./apps/api/src/

RUN npm run build 2>/dev/null || true

FROM node:22-alpine AS runner
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

EXPOSE 4000

CMD ["node", "dist/apps/api/src/server.js"]
