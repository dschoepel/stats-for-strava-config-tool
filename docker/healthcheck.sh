#!/bin/sh
# Exit on any error except for specific checks we handle
set -e

# supervisorctl needs to know where the config file is
SUPERVISORCTL="supervisorctl -c /etc/supervisord.conf"

# Check if supervisord socket exists
if [ ! -S /tmp/supervisor.sock ]; then
    echo "ERROR: supervisord socket not found at /tmp/supervisor.sock"
    echo "Supervisord may not be running yet"
    exit 1
fi

# Check if supervisord is running with retry
for i in 1 2 3; do
    if $SUPERVISORCTL status > /dev/null 2>&1; then
        break
    fi
    if [ $i -eq 3 ]; then
        echo "ERROR: supervisord is not responding after 3 attempts"
        echo "Socket exists but supervisord not responding"
        exit 1
    fi
    sleep 1
done

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
for i in 1 2 3; do
    if wget --quiet --tries=1 --timeout=5 --spider http://localhost:80/ 2>/dev/null; then
        break
    fi
    if [ $i -eq 3 ]; then
        echo "ERROR: nginx is not responding on port 80"
        echo "Checking if nginx process is listening..."
        netstat -tlnp 2>/dev/null | grep :80 || echo "No process listening on port 80"
        exit 1
    fi
    sleep 2
done

# Check if Next.js is responding directly
if ! wget --quiet --tries=1 --timeout=5 --spider http://localhost:3000/ 2>/dev/null; then
    echo "ERROR: Next.js is not responding on port 3000"
    exit 1
fi

echo "OK: All services are healthy"
exit 0
