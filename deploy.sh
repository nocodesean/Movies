#!/usr/bin/env bash
# Deployment helper for the Pi. Replace the CHANGEME values for your setup.
set -euo pipefail

# === REQUIRED: set these for your Pi ===
REPO_DIR="/media/sean/061639D91639CB07/Movies"  # path to your project on the Pi
BRANCH="master"                                 # e.g., main or master
SERVICE_NAME="streamlan.service"                # systemd user service name

# === OPTIONAL: pin node/npm ===
# Uncomment and adjust if you use nvm or a specific Node version.
# export NVM_DIR="$HOME/.nvm"
# source "$NVM_DIR/nvm.sh"
# nvm use 18

cd "$REPO_DIR"

echo "[deploy] pulling $BRANCH in $REPO_DIR"
git fetch origin
REMOTE_REF=$(git rev-parse "origin/$BRANCH")
LOCAL_REF=$(git rev-parse HEAD)

if [ "$LOCAL_REF" = "$REMOTE_REF" ]; then
  echo "[deploy] already up to date; skipping"
  exit 0
fi

git reset --hard "$REMOTE_REF"

echo "[deploy] changes detected; updating service"
echo "[deploy] stopping service: $SERVICE_NAME"
systemctl --user stop "$SERVICE_NAME" || true

echo "[deploy] removing node_modules to avoid stale native binaries"
rm -rf node_modules

echo "[deploy] installing dependencies"
if command -v npm >/dev/null 2>&1; then
  npm ci
else
  echo "npm not found on PATH; install Node/npm or update deploy.sh" >&2
  exit 1
fi

echo "[deploy] restarting $SERVICE_NAME"
systemctl --user restart "$SERVICE_NAME"

echo "[deploy] done"
