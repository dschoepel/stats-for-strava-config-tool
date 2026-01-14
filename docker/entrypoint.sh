#!/bin/sh
set -e

# Set timezone if provided
if [ -n "$TZ" ]; then
    echo "Setting timezone to $TZ"
    cp /usr/share/zoneinfo/$TZ /etc/localtime
    echo "$TZ" > /etc/timezone
fi

# Set defaults if not provided
USERMAP_UID="${USERMAP_UID:-1000}"
USERMAP_GID="${USERMAP_GID:-1000}"

echo "Configuring runtime user: UID=$USERMAP_UID GID=$USERMAP_GID"

# Remap UID/GID of the existing 'node' user
# Update group ID
if [ "$(id -g node)" != "$USERMAP_GID" ]; then
    echo "Updating node group to GID=$USERMAP_GID"
    delgroup node 2>/dev/null || true
    addgroup -g "$USERMAP_GID" node
fi

# Update user ID
if [ "$(id -u node)" != "$USERMAP_UID" ]; then
    echo "Updating node user to UID=$USERMAP_UID"
    deluser node 2>/dev/null || true
    adduser -D -u "$USERMAP_UID" -G node node
fi

# Fix permissions - only for directories that need write access
chown -R node:node /data
chown node:node /app
# Only specific subdirectories need write access
[ -d /app/.next ] && chown -R node:node /app/.next
# Ensure .env file is writable by node user (for password hash updates)
[ -f /app/.env ] && chown node:node /app/.env

echo "Logs will be written to /data/logs/"

# Execute supervisord as root (it will run child processes as node user)
exec "$@"



