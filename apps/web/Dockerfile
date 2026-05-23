FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY tsconfig.json next.config.ts tailwind.config.ts postcss.config.js ./
COPY packages/shared/ ./packages/shared/
COPY apps/web/ ./apps/web/

RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app

COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public

EXPOSE 3000

CMD ["npx", "next", "start", "apps/web", "-p", "3000"]
