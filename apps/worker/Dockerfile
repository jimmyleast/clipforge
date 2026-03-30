FROM node:20-slim

# Install FFmpeg
RUN apt-get update && \
    apt-get install -y ffmpeg wget && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/ packages/
COPY apps/worker/ apps/worker/

RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile
RUN pnpm --filter worker build

CMD ["pnpm", "--filter", "worker", "start"]
