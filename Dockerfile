# --- Build Stage ---
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install --production=false

COPY . .
RUN npm run build

# --- Runtime Stage ---
FROM node:20-alpine

# Install nginx + supervisor
RUN apk add --no-cache nginx supervisor

WORKDIR /app

# Copy only required build artifacts and metadata
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/app ./app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/next.config.js ./

# Install only production dependencies in the runtime image
RUN npm install --production
# Copy configs
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/supervisord.conf /etc/supervisord.conf

# Create persistent data directories
RUN mkdir -p /data/configs /data/settings /data/backups

EXPOSE 80

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
