#!/bin/sh
set -e

# Fix ownership for mounted data directory
if [ -d /app/data ]; then
  echo "Fixing ownership for /app/data..."
  chown -R nextjs:nodejs /app/data 2>&1 || echo "Warning: Could not fix /app/data ownership (non-critical)"
fi

# Fix ownership for mounted books directory (for existing files created by root)
if [ -d /books ]; then
  echo "Fixing ownership for /books..."
  echo "This may take a while for large directories..."

  # Try to fix ownership, but don't fail if it errors
  if chown -R nextjs:nodejs /books 2>&1; then
    echo "✅ Successfully fixed /books ownership"
  else
    echo "⚠️  Warning: Could not fix all /books ownership (will attempt to continue)"
    echo "   Manual fix: sudo chown -R 1001:1001 /volume1/docker/dream-library/books"
  fi
fi

# Execute the main command as nextjs user
exec su-exec nextjs:nodejs "$@"
