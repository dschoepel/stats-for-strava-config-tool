#!/bin/sh
set -e

# Check if supervisord is running
if ! supervisorctl status > /dev/null 2>&1; then
    echo "ERROR: supervisord is not responding"
    exit 1
fi

# Check if nginx is running via supervisord
if ! supervisorctl status nginx | grep -q "RUNNING"; then
    echo "ERROR: nginx is not running"
    exit 1
fi

# Check if nextjs is running via supervisord
if ! supervisorctl status nextjs | grep -q "RUNNING"; then
    echo "ERROR: nextjs is not running"
    exit 1
fi

# Check if nginx is responding to HTTP requests
if ! wget --quiet --tries=1 --spider http://localhost:80/_next/static/ 2>/dev/null && \
   ! wget --quiet --tries=1 --spider http://localhost:80/ 2>/dev/null; then
    echo "ERROR: nginx is not responding to HTTP requests"
    exit 1
fi

# Check if Next.js is responding
if ! wget --quiet --tries=1 --spider http://localhost:3000/ 2>/dev/null; then
    echo "ERROR: Next.js is not responding"
    exit 1
fi

echo "OK: All services are healthy"
exit 0
