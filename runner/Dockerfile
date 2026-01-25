FROM node:20-alpine

# Install timezone data and user management tools
# Note: PHP is NOT needed - the runner is a pure validator/proxy.
# Command execution happens in the strava-command-helper container.
RUN apk add --no-cache \
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
COPY docker/healthcheck.sh /healthcheck.sh

# Make scripts executable
RUN chmod +x /entrypoint.sh /healthcheck.sh

# Create log directory
RUN mkdir -p /var/log/stats-cmd-runner

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD ["/healthcheck.sh"]

# Entry point for user mapping
ENTRYPOINT ["/entrypoint.sh"]

# Start the server
CMD ["node", "server.js"]
