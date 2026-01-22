FROM node:20-alpine

# Install PHP CLI, timezone data, and user management tools
RUN apk add --no-cache \
    php83-cli \
    php83-json \
    php83-mbstring \
    php83-openssl \
    php83-phar \
    php83-tokenizer \
    php83-xml \
    php83-ctype \
    php83-iconv \
    php83-simplexml \
    php83-dom \
    tzdata \
    shadow \
    su-exec

# Symlink php83 to php for convenience
RUN ln -sf /usr/bin/php83 /usr/bin/php

# Set working directory
WORKDIR /var/www

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy application files
COPY server.js ./
COPY docker/entrypoint.sh /entrypoint.sh
COPY docker/healthcheck.sh /healthcheck.sh

# Make scripts executable
RUN chmod +x /entrypoint.sh /healthcheck.sh

# Create log directory
RUN mkdir -p /var/log/strava-runner

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD ["/healthcheck.sh"]

# Entry point for user mapping
ENTRYPOINT ["/entrypoint.sh"]

# Start the server
CMD ["node", "server.js"]
