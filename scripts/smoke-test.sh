#!/usr/bin/env bash
set -euo pipefail

# Smoke test for local Node API endpoints
# Usage: API_BASE=http://localhost:3333 ./scripts/smoke-test.sh

API_BASE=${API_BASE:-http://localhost:3333}
echo "Using API base: $API_BASE"

echo "\n== GET /api/weather =="
curl -sS -D - "$API_BASE/api/weather" | sed -n '1,120p'

echo "\n== GET /api/market =="
curl -sS -D - "$API_BASE/api/market" | sed -n '1,120p'

echo "\n== GET /api/notifications =="
curl -sS -D - "$API_BASE/api/notifications" | sed -n '1,120p'

echo "\n== forum_posts.json BEFORE =="
if [ -f data/forum_posts.json ]; then
  sed -n '1,200p' data/forum_posts.json || true
else
  echo "(no forum_posts.json found)"
fi

TS=$(date +%s)
POST_BODY=$(jq -n --arg id "$TS" --arg author "smoketester" --arg text "smoke test $TS" --arg time "now" '{id:($id|tonumber), author:$author, text:$text, time:$time}')

echo "\n== POST /api/forum =="
curl -sS -X POST "$API_BASE/api/forum" -H 'Content-Type: application/json' -d "$POST_BODY" -D - | sed -n '1,120p'

sleep 0.2

echo "\n== forum_posts.json AFTER =="
if [ -f data/forum_posts.json ]; then
  sed -n '1,200p' data/forum_posts.json || true
else
  echo "(no forum_posts.json found)"
fi

echo "\nSmoke test complete"
