# --- Build Stage ---
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install --production=false

COPY . .
RUN npm run build

# --- Runtime Stage ---
FROM node:20-alpine

# Install required packages
RUN apk add --no-cache nginx supervisor tzdata su-exec shadow wget busybox-extras

WORKDIR /app

# Copy only necessary files from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/app ./app
COPY --from=builder /app/next.config.js ./

# Install production dependencies only
RUN npm ci --only=production
RUN npm install -g npm@10

# Set ownership for the app directory (node user needs to read files and write to specific dirs)
RUN chown -R node:node /app

# Copy configs
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/supervisord.conf /etc/supervisord.conf
COPY docker/healthcheck.sh /healthcheck.sh
COPY docker/entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh /healthcheck.sh

# Create persistent directories
RUN mkdir -p /data/config /data/logs

# Note: We don't chown /app here because the user UID/GID will be remapped at runtime via entrypoint.sh
# The entrypoint will fix permissions after UID/GID remapping

EXPOSE 80 3000

# Health check - verify supervisord and all services are running
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD ["/healthcheck.sh"]

ENTRYPOINT ["/entrypoint.sh"]
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
