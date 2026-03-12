# ARG for maintainable versioning
ARG ALPINE_VERSION=3.21

# ---- Base Stage ----
# Defines a common Node.js + pnpm environment for building.
# Using a specific version like '22-alpine3.20' is more reproducible than just '22-alpine'.
FROM node:24-alpine${ALPINE_VERSION} AS base
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
RUN pnpm --filter=@watcher/cli... run build
RUN pnpm deploy --filter=@watcher/cli /prod/cli

# ---- Production Stage ----
# Creates a minimal, secure image for running the service.
FROM alpine:${ALPINE_VERSION} AS cli

# Best Practice: Add metadata labels to your image.
LABEL org.opencontainers.image.source=https://github.com/PeteFromGlasgow/the-watcher

WORKDIR /usr/src/app

# Best Practice: Install only essential dependencies and run as a non-root user.
# - 'dumb-init' is used as a lightweight init system to handle signals correctly.
# - A dedicated user ('node') is created to avoid running the container as root.
RUN apk add --no-cache dumb-init \
    && addgroup -g 1001 -S node \
    && adduser -u 1001 -S node -G node

# Best Practice: Copy only necessary artifacts from previous stages to keep the image small.
# 1. The Node.js runtime from the 'base' stage.
COPY --from=base /usr/local/bin/node /usr/local/bin/
# 2. The built application from the 'build' stage. Set ownership during the copy.
COPY --from=build --chown=node:node /prod/cli .

# Switch to the non-root user.
USER node

# Best Practice: Use 'dumb-init' to start your application.
# This ensures that signals like SIGTERM (from 'docker stop') are handled correctly,
# allowing for a graceful shutdown of your application.
ENTRYPOINT ["dumb-init", "node", "dist/cli.js"]
