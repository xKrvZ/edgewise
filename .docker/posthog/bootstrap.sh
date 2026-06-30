#!/usr/bin/env bash
# Bootstraps the PostHog hobby stack under .docker/posthog/
# Usage (from repo root): .docker/posthog/bootstrap.sh

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
POSTHOG_DIR="$REPO_ROOT/.docker/posthog"
CLONE_DIR="$POSTHOG_DIR/posthog"
SHARE_DIR="$POSTHOG_DIR/share"

echo "PostHog bootstrap -> $POSTHOG_DIR"

if [ ! -d "$CLONE_DIR" ]; then
  echo "Cloning PostHog (shallow)..."
  git clone --filter=blob:none --depth 1 https://github.com/PostHog/posthog.git "$CLONE_DIR"
else
  echo "PostHog clone already present, refreshing compose files only."
fi

cp "$CLONE_DIR/docker-compose.base.yml" "$POSTHOG_DIR/docker-compose.base.yml"
cp "$CLONE_DIR/docker-compose.hobby.yml" "$POSTHOG_DIR/docker-compose.hobby.yml"
cp "$CLONE_DIR/.env.services" "$POSTHOG_DIR/.env.services"

if [ ! -f "$SHARE_DIR/GeoLite2-City.mmdb" ]; then
  echo "Downloading GeoLite2-City.mmdb for PostHog..."
  mkdir -p "$SHARE_DIR"
  if command -v brotli >/dev/null 2>&1; then
    curl -fsSL 'https://mmdbcdn.posthog.net/' | brotli --decompress >"$SHARE_DIR/GeoLite2-City.mmdb"
  else
    echo "Install brotli (e.g. apt install brotli) or run bootstrap.ps1 on Windows."
    exit 1
  fi
  echo "{\"date\": \"$(date +%Y-%m-%d)\"}" >"$SHARE_DIR/GeoLite2-City.json"
fi

if [ ! -f "$POSTHOG_DIR/.env" ]; then
  cp "$POSTHOG_DIR/.env.example" "$POSTHOG_DIR/.env"
  echo "Created $POSTHOG_DIR/.env from .env.example"
else
  echo "Keeping existing $POSTHOG_DIR/.env"
fi

# Shell scripts bind-mounted into Linux containers must use LF (CRLF breaks shebang exec on Linux/Windows Docker).
if [ -d "$POSTHOG_DIR/compose" ]; then
  find "$POSTHOG_DIR/compose" -type f -print0 | while IFS= read -r -d '' file; do
    sed -i 's/\r$//' "$file"
  done
  echo "Normalized LF line endings in $POSTHOG_DIR/compose"
fi

echo ""
echo "Bootstrap complete. Next step:"
echo "  docker compose -f .docker/posthog/docker-compose.hobby.yml -f docker-compose.posthog.yml --env-file .docker/posthog/.env up -d"
