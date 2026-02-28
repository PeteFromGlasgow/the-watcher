# ARG for maintainable versioning
ARG NODE_VERSION=24
ARG DEBIAN_VERSION=bookworm

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

# Copy only package manifests first to leverage Docker's layer cache.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install dependencies using a cached mount for speed.
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# Now copy the rest of the source code.
COPY . .

# Create a clean production-only package using pnpm deploy.
RUN pnpm deploy --filter={./packages/db} /prod/db

# ---- Production Stage ----
# Creates a minimal, secure image for running the migrations.
FROM debian:${DEBIAN_VERSION}-slim AS db-migrations

# Best Practice: Add metadata labels to your image.
LABEL org.opencontainers.image.source=https://github.com/PeteFromGlasgow/in-the-black

WORKDIR /usr/src/app

# Best Practice: Install only essential dependencies and run as a non-root user.
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init libstdc++6 \
    && rm -rf /var/lib/apt/lists/* \
    && addgroup --gid 1001 node \
    && adduser --disabled-password --gecos '' --uid 1001 --gid 1001 node

# 1. The Node.js runtime from the 'base' stage.
COPY --from=base /usr/local/bin/node /usr/local/bin/
# 2. The built application from the 'build' stage. Set ownership during the copy.
COPY --from=build --chown=node:node /prod/db .

# Switch to the non-root user.
USER node

# Use 'dumb-init' to start your application.
CMD ["dumb-init", "node_modules/.bin/knex", "migrate:latest"]
