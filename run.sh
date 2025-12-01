#!/usr/bin/env bash
set -euo pipefail

MEDIA_DIR="${MEDIA_DIR:-$(pwd)/media}"
PRINT_DIR="${PRINT_DIR:-$(pwd)/prints}"
API_PORT="${PORT:-3001}"
UI_PORT="${UI_PORT:-3000}"
HOST_IP="${HOST_IP:-$(hostname -I 2>/dev/null | awk '{print $1}')}"
[ -z "$HOST_IP" ] && HOST_IP="localhost"

echo "Media dir: $MEDIA_DIR"
echo "Prints dir: $PRINT_DIR"
echo "API port:  $API_PORT"
echo "UI port:   $UI_PORT"
echo "Host IP:   $HOST_IP"

if [ ! -d node_modules ]; then
  echo "Installing npm dependencies..."
  npm install
fi

export MEDIA_DIR
export PRINT_DIR
export PORT="$API_PORT"
export VITE_API_URL="http://$HOST_IP:$API_PORT"

echo "Starting media server..."
npm run server >/tmp/streamlan-server.log 2>&1 &
SERVER_PID=$!
echo "  log: /tmp/streamlan-server.log"

echo "Starting web app..."
npm run dev -- --host 0.0.0.0 --port "$UI_PORT" >/tmp/streamlan-ui.log 2>&1 &
UI_PID=$!
echo "  log: /tmp/streamlan-ui.log"

echo ""
echo "Open: http://$HOST_IP:$UI_PORT"
echo "Press Ctrl+C to stop both."

trap "echo 'Stopping...'; kill $SERVER_PID $UI_PID 2>/dev/null" INT TERM
wait
