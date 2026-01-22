#!/bin/sh
set -e

# Simple HTTP health check
if wget --quiet --tries=1 --timeout=5 --spider http://localhost:8080/health 2>/dev/null; then
    echo "OK: strava-runner is healthy"
    exit 0
else
    echo "ERROR: strava-runner not responding on port 8080"
    exit 1
fi
