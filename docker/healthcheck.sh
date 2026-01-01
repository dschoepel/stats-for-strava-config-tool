#!/bin/sh
# Exit on any error except for specific checks we handle
set -e

# supervisorctl needs to know where the config file is
SUPERVISORCTL="supervisorctl -c /etc/supervisord.conf"

# Check if supervisord is running
if ! $SUPERVISORCTL status > /dev/null 2>&1; then
    echo "ERROR: supervisord is not responding"
    exit 1
fi

# Check if nginx is running via supervisord
if ! $SUPERVISORCTL status nginx | grep -q "RUNNING"; then
    echo "ERROR: nginx is not running"
    $SUPERVISORCTL status nginx
    exit 1
fi

# Check if nextjs is running via supervisord
if ! $SUPERVISORCTL status nextjs | grep -q "RUNNING"; then
    echo "ERROR: nextjs is not running"
    $SUPERVISORCTL status nextjs
    exit 1
fi

# Check if nginx is responding to HTTP requests (try root path)
if ! wget --quiet --tries=1 --timeout=5 --spider http://localhost:80/ 2>/dev/null; then
    echo "ERROR: nginx is not responding on port 80"
    exit 1
fi

# Check if Next.js is responding directly
if ! wget --quiet --tries=1 --timeout=5 --spider http://localhost:3000/ 2>/dev/null; then
    echo "ERROR: Next.js is not responding on port 3000"
    exit 1
fi

echo "OK: All services are healthy"
exit 0
