# ---------- Stage 1: Builder ----------
FROM node:22-slim AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --production

# ---------- Stage 2: Runtime ----------
FROM node:22-slim

ENV TZ=UTC

WORKDIR /app

# Install cron + tzdata
RUN apt-get update && \
    apt-get install -y cron tzdata && \
    rm -rf /var/lib/apt/lists/*

# Set timezone
RUN ln -snf /usr/share/zoneinfo/UTC /etc/localtime && echo UTC > /etc/timezone

# Copy node modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy application code
COPY src ./src
COPY student_private.pem .
COPY student_public.pem .
COPY instructor_public.pem .
COPY scripts ./scripts
COPY cron ./cron

# Create volume directories
RUN mkdir -p /data /cron

# Set permissions
RUN chmod 755 /data /cron

# Setup cron
RUN chmod 0644 /app/cron/2fa-cron && crontab /app/cron/2fa-cron

EXPOSE 8080

# Start cron + API
CMD cron && node src/server.js
