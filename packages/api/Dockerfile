# ARG for maintainable versioning
ARG NODE_VERSION=24
ARG DEBIAN_VERSION=bookworm-slim

# ---- Base Stage ----
# Defines a common Node.js + pnpm environment for building.
FROM node:${NODE_VERSION}-${DEBIAN_VERSION} AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# ---- Builder Stage ----
# Fetches dependencies and builds the application artifact.
FROM base AS build
WORKDIR /app

# Best Practice: Copy only package manifests first to leverage Docker's layer cache.
# The layer with installed dependencies will only be rebuilt if these files change.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install dependencies using a cached mount for speed.
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# Now copy the rest of the source code.
COPY . .

# Build and create a clean production-only package using pnpm deploy.
# It's more efficient to filter the build command as well.
RUN pnpm --filter=@watcher/api... run build
RUN pnpm deploy --filter=@watcher/api /prod/api

# ---- Production Stage ----
# Creates a minimal, secure image for running the service.
FROM debian:${DEBIAN_VERSION} AS api

# Best Practice: Add metadata labels to your image.
LABEL org.opencontainers.image.source=https://github.com/PeteFromGlasgow/the-watcher

WORKDIR /usr/src/app

# Best Practice: Install only essential dependencies and run as a non-root user.
# - 'dumb-init' is used as a lightweight init system to handle signals correctly.
# - A dedicated user ('node') is created to avoid running the container as root.
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init \
    && addgroup --system --gid 1001 node \
    && adduser --system --uid 1001 --ingroup node node \
    && rm -rf /var/lib/apt/lists/*

# Best Practice: Copy only necessary artifacts from previous stages to keep the image small.
# 1. The Node.js runtime from the 'base' stage.
COPY --from=base /usr/local/bin/node /usr/local/bin/
# 2. The built application from the 'build' stage. Set ownership during the copy.
COPY --from=build --chown=node:node /prod/api .

# Switch to the non-root user.
USER node

# Best Practice: Use 'dumb-init' to start your application.
# This ensures that signals like SIGTERM (from 'docker stop') are handled correctly,
# allowing for a graceful shutdown of your application.
CMD ["dumb-init", "node", "dist/server.js"]
