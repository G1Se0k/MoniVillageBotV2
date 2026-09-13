FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig.base.json tsconfig.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/bot/package.json ./packages/bot/
RUN npm ci

COPY packages/shared ./packages/shared
COPY packages/bot ./packages/bot
RUN npx tsc --build packages/bot


FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/bot/package.json ./packages/bot/
RUN npm ci --omit=dev --workspace=@moni/bot --include-workspace-root

COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/bot/dist ./packages/bot/dist

CMD ["node", "packages/bot/dist/index.js"]
