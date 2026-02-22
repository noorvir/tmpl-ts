#!/usr/bin/env bash
# Chrome debug instance manager for the frontend-dev skill.
# Usage: chrome.sh <command> [options]
#
# Commands:
#   start [--headful]   Launch Chrome (headless by default)
#   stop                Save tabs and kill Chrome
#   switch              Toggle between headless <-> headful (preserves tabs)
#   status              Check if Chrome is running and list open tabs

set -euo pipefail

PORT=9225
DATA_DIR="$HOME/.chrome-debug-ai"
PROFILE="Default"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
TABS_FILE="$DATA_DIR/.saved-tabs.json"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# --- helpers ---

is_running() {
  curl -sf "http://127.0.0.1:$PORT/json/version" >/dev/null 2>&1
}

wait_for_chrome() {
  local max_wait=10
  local waited=0
  while ! is_running && [ $waited -lt $max_wait ]; do
    sleep 1
    waited=$((waited + 1))
  done
  is_running
}

get_mode() {
  # Detect if current instance is headless or headful
  if pgrep -f "headless.*remote-debugging-port=$PORT" >/dev/null 2>&1; then
    echo "headless"
  elif is_running; then
    echo "headful"
  else
    echo "none"
  fi
}

launch_chrome() {
  local mode="${1:-headless}"

  if [ "$mode" = "headless" ]; then
    "$CHROME" \
      --headless=new \
      --window-size=1280,800 \
      --remote-debugging-port="$PORT" \
      --user-data-dir="$DATA_DIR" \
      --profile-directory="$PROFILE" \
      --no-first-run \
      &>/dev/null &
  else
    "$CHROME" \
      --remote-debugging-port="$PORT" \
      --user-data-dir="$DATA_DIR" \
      --profile-directory="$PROFILE" \
      --no-first-run \
      &>/dev/null &
  fi

  if wait_for_chrome; then
    echo "Chrome started ($mode) on port $PORT"
    return 0
  else
    echo "ERROR: Chrome failed to start" >&2
    return 1
  fi
}

kill_chrome() {
  pkill -f "remote-debugging-port=$PORT" 2>/dev/null || true
  # Wait for process to die
  local waited=0
  while pgrep -f "remote-debugging-port=$PORT" >/dev/null 2>&1 && [ $waited -lt 5 ]; do
    sleep 1
    waited=$((waited + 1))
  done
}

save_tabs() {
  if is_running; then
    node "$SCRIPT_DIR/tabs.js" save "$PORT" "$TABS_FILE" 2>/dev/null
  fi
}

restore_tabs() {
  if is_running && [ -f "$TABS_FILE" ]; then
    node "$SCRIPT_DIR/tabs.js" restore "$PORT" "$TABS_FILE" 2>/dev/null
  fi
}

# --- commands ---

cmd_start() {
  local mode="headless"
  if [ "${1:-}" = "--headful" ]; then
    mode="headful"
  fi

  if is_running; then
    local current_mode
    current_mode=$(get_mode)
    echo "Chrome already running ($current_mode) on port $PORT"
    return 0
  fi

  launch_chrome "$mode"
  restore_tabs
}

cmd_stop() {
  if ! is_running; then
    echo "Chrome not running"
    return 0
  fi

  save_tabs
  kill_chrome
  echo "Chrome stopped (tabs saved)"
}

cmd_switch() {
  local current_mode
  current_mode=$(get_mode)

  if [ "$current_mode" = "none" ]; then
    echo "Chrome not running. Use 'start' first."
    return 1
  fi

  # Save tabs before killing
  save_tabs

  # Determine target mode
  local target_mode
  if [ "$current_mode" = "headless" ]; then
    target_mode="headful"
  else
    target_mode="headless"
  fi

  kill_chrome
  launch_chrome "$target_mode"
  restore_tabs
  echo "Switched: $current_mode -> $target_mode"
}

cmd_status() {
  if ! is_running; then
    echo "Chrome not running on port $PORT"
    return 0
  fi

  local mode
  mode=$(get_mode)
  echo "Chrome running ($mode) on port $PORT"
  echo ""

  # List tabs
  node "$SCRIPT_DIR/tabs.js" list "$PORT" 2>/dev/null || echo "(could not list tabs)"
}

# --- main ---

case "${1:-}" in
  start)  shift; cmd_start "$@" ;;
  stop)   cmd_stop ;;
  switch) cmd_switch ;;
  status) cmd_status ;;
  *)
    echo "Usage: chrome.sh <start [--headful]|stop|switch|status>"
    exit 1
    ;;
esac
