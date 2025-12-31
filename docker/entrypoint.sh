#!/bin/sh
set -e

# Set timezone if provided
if [ -n "$TZ" ]; then
    echo "Setting timezone to $TZ"
    cp /usr/share/zoneinfo/$TZ /etc/localtime
    echo "$TZ" > /etc/timezone
fi

# Remap UID/GID of the existing 'node' user
if [ -n "$USERMAP_UID" ] && [ -n "$USERMAP_GID" ]; then
    echo "Configuring runtime user: UID=$USERMAP_UID GID=$USERMAP_GID"

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
    [ -d /app/node_modules ] || true  # Skip if not present
fi

# If no USERMAP variables set, ensure default permissions
if [ -z "$USERMAP_UID" ]; then
    chown -R node:node /data
    chown node:node /app
    [ -d /app/.next ] && chown -R node:node /app/.next
fi

exec su-exec node "$@"



