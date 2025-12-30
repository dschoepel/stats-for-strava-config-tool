#!/bin/sh
set -e

# Set timezone if provided
if [ -n "$TZ" ]; then
    echo "Setting timezone to $TZ"
    cp /usr/share/zoneinfo/$TZ /etc/localtime
    echo "$TZ" > /etc/timezone
fi

# Remap UID/GID if provided
if [ -n "$USERMAP_UID" ] && [ -n "$USERMAP_GID" ]; then
    echo "Remapping appuser to UID=$USERMAP_UID GID=$USERMAP_GID"

    # Update group
    delgroup appgroup 2>/dev/null || true
    addgroup -g "$USERMAP_GID" appgroup

    # Update user
    deluser appuser 2>/dev/null || true
    adduser -D -u "$USERMAP_UID" -G appgroup appuser

    # Fix permissions
    chown -R appuser:appgroup /data
fi

exec su-exec appuser "$@"
