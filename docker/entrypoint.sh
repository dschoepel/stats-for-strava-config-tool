#!/bin/sh
set -e

# Set timezone if provided
if [ -n "$TZ" ]; then
    echo "Setting timezone to $TZ"
    cp /usr/share/zoneinfo/$TZ /etc/localtime
    echo "$TZ" > /etc/timezone
fi

APP_USER="appuser"
APP_GROUP="appgroup"

# Remap UID/GID if provided
if [ -n "$USERMAP_UID" ] && [ -n "$USERMAP_GID" ]; then
    echo "Configuring runtime user: UID=$USERMAP_UID GID=$USERMAP_GID"

    # Create or reuse group
    if getent group "$USERMAP_GID" >/dev/null 2>&1; then
        APP_GROUP=$(getent group "$USERMAP_GID" | cut -d: -f1)
        echo "Using existing group: $APP_GROUP"
    else
        addgroup -g "$USERMAP_GID" "$APP_GROUP"
    fi

    # Create or reuse user
    if id -u "$USERMAP_UID" >/dev/null 2>&1; then
        APP_USER=$(getent passwd "$USERMAP_UID" | cut -d: -f1)
        echo "Using existing user: $APP_USER"
    else
        adduser -D -u "$USERMAP_UID" -G "$APP_GROUP" "$APP_USER"
    fi

    # Fix permissions
    echo "Fixing permissions on /data"
    chown -R "$USERMAP_UID":"$USERMAP_GID" /data
fi

# Exec the main process as the mapped user
exec su-exec "$APP_USER" "$@"


