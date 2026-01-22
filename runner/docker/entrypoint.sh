#!/bin/sh
set -e

# Set timezone if provided
if [ -n "$TZ" ]; then
    echo "Setting timezone to $TZ"
    if [ -f "/usr/share/zoneinfo/$TZ" ]; then
        cp "/usr/share/zoneinfo/$TZ" /etc/localtime
        echo "$TZ" > /etc/timezone
    else
        echo "Warning: Timezone $TZ not found"
    fi
fi

# Set defaults if not provided
USERMAP_UID="${USERMAP_UID:-1000}"
USERMAP_GID="${USERMAP_GID:-1000}"

echo "Configuring runtime user: UID=$USERMAP_UID GID=$USERMAP_GID"

# Remap UID/GID of the existing 'node' user
if [ "$(id -g node)" != "$USERMAP_GID" ]; then
    echo "Updating node group to GID=$USERMAP_GID"
    delgroup node 2>/dev/null || true
    addgroup -g "$USERMAP_GID" node 2>/dev/null || true
fi

if [ "$(id -u node)" != "$USERMAP_UID" ]; then
    echo "Updating node user to UID=$USERMAP_UID"
    deluser node 2>/dev/null || true
    adduser -D -u "$USERMAP_UID" -G node -h /home/node node 2>/dev/null || true
fi

# Ensure log directory exists and has correct ownership
mkdir -p /var/log/strava-runner
chown -R node:node /var/log/strava-runner

# Fix ownership of app directory if writable
if [ -w /var/www ]; then
    chown -R node:node /var/www 2>/dev/null || true
fi

echo "Starting strava-runner..."

# Execute command as node user
exec su-exec node "$@"
