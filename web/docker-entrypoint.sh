#!/bin/sh
set -e

# Fix ownership for mounted data directory
if [ -d /app/data ]; then
  echo "Fixing ownership for /app/data..."
  chown -R nextjs:nodejs /app/data
fi

# Execute the main command as nextjs user
exec su-exec nextjs:nodejs "$@"
