FROM node:20-alpine

# Install Docker CLI only (no daemon), timezone data, and user management tools
RUN apk add --no-cache \
    docker-cli \
    tzdata \
    shadow \
    su-exec

# Set working directory
WORKDIR /var/www

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy application files
COPY server.js ./
COPY docker/entrypoint.sh /entrypoint.sh

# Make scripts executable
RUN chmod +x /entrypoint.sh

# Create log directory
RUN mkdir -p /var/log/stats-cmd

# Expose port
EXPOSE 8081

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:8081/health || exit 1

# Entry point for user mapping
ENTRYPOINT ["/entrypoint.sh"]

# Start the server
CMD ["node", "server.js"]
