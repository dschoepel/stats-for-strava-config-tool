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

# Add node user to the docker group for socket access
# Determine the GID of the docker socket
if [ -S /var/run/docker.sock ]; then
    DOCKER_SOCK_GID=$(stat -c '%g' /var/run/docker.sock)
    echo "Docker socket GID: $DOCKER_SOCK_GID"

    # Create docker group with the socket's GID if it doesn't exist
    if ! getent group "$DOCKER_SOCK_GID" >/dev/null 2>&1; then
        addgroup -g "$DOCKER_SOCK_GID" docker 2>/dev/null || true
    fi

    # Add node user to the docker group
    DOCKER_GROUP_NAME=$(getent group "$DOCKER_SOCK_GID" | cut -d: -f1)
    addgroup node "$DOCKER_GROUP_NAME" 2>/dev/null || true
    echo "Added node user to group: $DOCKER_GROUP_NAME (GID=$DOCKER_SOCK_GID)"
fi

# Ensure log directory exists and has correct ownership
mkdir -p /var/log/strava-helper
chown -R node:node /var/log/strava-helper

echo "Starting strava-command-helper..."

# Execute command as node user
exec su-exec node "$@"
