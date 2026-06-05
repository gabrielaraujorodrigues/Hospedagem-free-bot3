FROM node:24-alpine

# Install pnpm and git
RUN npm install -g pnpm@10 && apk add --no-cache git python3 make g++ ffmpeg

WORKDIR /app

# Copy workspace config
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy lib packages
COPY lib/ ./lib/

# Copy artifacts
COPY artifacts/api-server/ ./artifacts/api-server/
COPY artifacts/bot-panel/ ./artifacts/bot-panel/

# Copy bot
COPY bots/ ./bots/

# Install workspace deps
RUN pnpm install --frozen-lockfile

# Install bot deps
RUN cd bots/jordan-bot && npm install --legacy-peer-deps --ignore-scripts

# Build frontend
RUN pnpm --filter @workspace/bot-panel run build

# Build API server
WORKDIR /app/artifacts/api-server
RUN pnpm run build

WORKDIR /app

EXPOSE 8080

ENV NODE_ENV=production
ENV PORT=8080

CMD ["node", "--enable-source-maps", "artifacts/api-server/dist/index.mjs"]
