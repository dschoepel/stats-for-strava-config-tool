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

# Copy built app
COPY --from=builder /app ./

# Copy configs
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/supervisord.conf /etc/supervisord.conf
COPY docker/entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh

# Create default user (will be remapped at runtime)
RUN addgroup -g 1000 appgroup && \
    adduser -D -u 1000 -G appgroup appuser

# Create persistent directories
RUN mkdir -p /data/configs /data/settings /data/backups && \
    chown -R appuser:appgroup /data

EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
