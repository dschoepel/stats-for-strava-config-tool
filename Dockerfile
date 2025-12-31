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
RUN apk add --no-cache nginx supervisor tzdata su-exec shadow

WORKDIR /app

# Copy only necessary files from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/app ./app
COPY --from=builder /app/next.config.js ./

# Install production dependencies only
RUN npm ci --only=production

# Copy configs
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/supervisord.conf /etc/supervisord.conf
COPY docker/entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh

# Create persistent directories
RUN mkdir -p /data/configs /data/settings /data/backups

# Note: We don't chown /app here because the user UID/GID will be remapped at runtime via entrypoint.sh
# The entrypoint will fix permissions after UID/GID remapping

EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
