#!/bin/sh
set -e

echo "========================================"
echo "Dream Library - Permission Validation"
echo "========================================"
echo ""

# Validate write permissions (fail-fast approach)
validate_write_permission() {
  local dir=$1
  local test_file="${dir}/.write_test_$$"

  if [ ! -d "$dir" ]; then
    echo "❌ ERROR: Directory $dir does not exist"
    return 1
  fi

  if touch "$test_file" 2>/dev/null; then
    rm -f "$test_file"
    echo "✅ $dir - writable"
    return 0
  else
    echo "❌ ERROR: $dir - not writable"
    echo ""
    echo "Fix with one of these methods:"
    echo ""
    echo "Method 1 (Synology ACL - Recommended):"
    echo "  sudo synoacltool -add $(pwd)/$dir user::106808:allow:rwxpdDaARWc--:fd--"
    echo ""
    echo "Method 2 (POSIX permissions):"
    echo "  sudo chown -R 106808:106808 $(pwd)/$dir"
    echo ""
    return 1
  fi
}

# Validate directories
echo "Validating mounted volumes..."
echo ""

VALIDATION_FAILED=0

validate_write_permission "/app/data" || VALIDATION_FAILED=1
validate_write_permission "/books" || VALIDATION_FAILED=1

echo ""

if [ $VALIDATION_FAILED -eq 1 ]; then
  echo "❌ Permission validation failed"
  echo "Container cannot start without write permissions"
  exit 1
fi

echo "========================================"
echo "✅ All validations passed"
echo "========================================"
echo ""

# Execute the main command as nextjs user
exec su-exec nextjs:nodejs "$@"
