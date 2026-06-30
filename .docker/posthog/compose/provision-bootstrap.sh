#!/bin/sh
set -eu

echo "Waiting for PostHog web (first boot can take 5–10 min)…"
TRIES=0
MAX=90
while [ "$TRIES" -lt "$MAX" ]; do
  if python3 -c "import urllib.request; urllib.request.urlopen('http://web:8000/_health')" 2>/dev/null; then
    echo "PostHog is responding."
    break
  fi
  TRIES=$((TRIES + 1))
  echo "Still waiting… ($TRIES/$MAX)"
  sleep 10
done

if [ "$TRIES" -eq "$MAX" ]; then
  echo "Timed out waiting for PostHog web. Check: docker compose logs web"
  exit 1
fi

echo "Bootstrapping PostHog org/project…"
OUTPUT=$(./manage.py shell < /scripts/bootstrap-instance.py 2>&1) || {
  echo "$OUTPUT"
  exit 1
}

echo "$OUTPUT"

MARKER="POSTHOG_PROVISION_JSON:"
JSON_LINE=$(echo "$OUTPUT" | grep "$MARKER" | tail -1 || true)
if [ -z "$JSON_LINE" ]; then
  echo "Bootstrap did not return JSON."
  exit 1
fi

JSON="${JSON_LINE#*POSTHOG_PROVISION_JSON:}"
printf '%s\n' "$JSON" > /posthog-meta/.bootstrap-raw.json
echo "Bootstrap complete."
