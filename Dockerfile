FROM node:22-slim AS builder
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/external/package.json packages/external/
COPY packages/frontend/package.json packages/frontend/
COPY packages/backend/package.json packages/backend/
COPY tsconfig.base.json turbo.json .npmrc ./

RUN npm ci

COPY . .

RUN npx prisma generate --schema=packages/shared/prisma/schema.prisma

RUN npx turbo run build

RUN npm prune --omit=dev

FROM node:22-slim
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

COPY start.sh /start.sh
RUN chmod +x /start.sh

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/packages/backend/dist ./packages/backend/dist
COPY --from=builder /app/packages/backend/public ./packages/backend/public
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/packages/external ./packages/external
COPY --from=builder /app/packages/backend/package.json ./packages/backend/
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/packages/external/package.json ./packages/external/
COPY --from=builder /app/packages/shared/prisma/migrations ./packages/shared/prisma/migrations

EXPOSE 3001

CMD ["/start.sh"]
