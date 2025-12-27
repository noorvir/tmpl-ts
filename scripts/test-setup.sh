#!/bin/bash
# Test script for setup.ts
# Run this from the tmpl-ts directory

set -e

TEST_DIR="/tmp/tmpl-ts-test-$$"
SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== Template Setup Test Script ==="
echo "Source: $SCRIPT_DIR"
echo "Test dir: $TEST_DIR"
echo ""

# Test combinations
declare -a TESTS=(
  "web:auth"
  "web:no-auth"
  "web,mobile:auth"
  "web,mobile:no-auth"
  "web,mobile,desktop,chrome:auth"
  "web,mobile,desktop,chrome:no-auth"
)

PASSED=0
FAILED=0

for test in "${TESTS[@]}"; do
  IFS=':' read -r apps auth <<< "$test"
  
  echo "----------------------------------------"
  echo "Testing: apps=$apps, auth=$auth"
  echo "----------------------------------------"
  
  # Clean up
  rm -rf "$TEST_DIR"
  mkdir -p "$TEST_DIR"
  
  # Copy files (excluding node_modules, .git, etc.)
  rsync -a \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='out' \
    --exclude='dist' \
    --exclude='.cache' \
    --exclude='.turbo' \
    "$SCRIPT_DIR/" "$TEST_DIR/"
  
  cd "$TEST_DIR"
  
  # Install dependencies
  echo "Installing dependencies..."
  bun install --silent
  
  # Run setup
  echo "Running setup..."
  if [ "$auth" = "auth" ]; then
    bun scripts/setup.ts --name testapp --apps "$apps" --auth --keep-script
  else
    bun scripts/setup.ts --name testapp --apps "$apps" --no-auth --keep-script
  fi
  
  # Reinstall after setup
  echo "Reinstalling dependencies..."
  bun install --silent
  
  # Run typecheck
  echo "Running typecheck..."
  if bun run typecheck 2>&1; then
    echo "✅ PASSED: apps=$apps, auth=$auth"
    ((PASSED++))
  else
    echo "❌ FAILED: apps=$apps, auth=$auth"
    ((FAILED++))
  fi
  
  echo ""
done

# Clean up
rm -rf "$TEST_DIR"

echo "========================================"
echo "Results: $PASSED passed, $FAILED failed"
echo "========================================"

if [ $FAILED -gt 0 ]; then
  exit 1
fi

