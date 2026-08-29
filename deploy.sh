#!/usr/bin/env bash
# Sportscast deploy — pulls prebuilt images from GHCR and restarts the stack.
# This script NEVER builds: the images are built in GitHub Actions so that a
# ~400 MB build never runs on a 4 GB box shared with valodex.
#
# Usage (ON THE VPS):  cd /opt/sportscast && ./deploy.sh
set -euo pipefail

cd "$(dirname "$0")"
COMPOSE="docker compose -f compose.prod.yml"

if [[ ! -f .env ]]; then
  echo "FATAL: .env is missing from $(pwd)." >&2
  echo "It must sit beside compose.prod.yml. Copy .env.prod.example and fill it in." >&2
  exit 1
fi

echo "==> Pulling images"
$COMPOSE pull

echo "==> Starting stack"
$COMPOSE up -d --remove-orphans

echo "==> Waiting for health (up to 120s)"
for name in sportscast-mongo sportscast-api sportscast-web; do
  for i in $(seq 1 60); do
    status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$name" 2>/dev/null || echo missing)"
    case "$status" in
      healthy|none) echo "    $name: $status"; break ;;
      missing|unhealthy)
        if [[ $i -ge 60 ]]; then
          echo "    $name: $status — giving up"; docker logs --tail 40 "$name" || true; exit 1
        fi ;;
    esac
    if [[ $i -ge 60 ]]; then
      echo "    $name: still $status after 120s"; docker logs --tail 40 "$name" || true; exit 1
    fi
    sleep 2
  done
done

echo "==> Pruning dangling images only"
# NEVER `docker system prune -a` on this box: it would delete valodex's images.
docker image prune -f >/dev/null

echo
echo "==> Status"
$COMPOSE ps
echo
echo "==> Memory"
docker stats --no-stream --format 'table {{.Name}}\t{{.MemUsage}}\t{{.MemPerc}}' \
  | grep -E 'NAME|sportscast' || true
echo
free -h
echo
echo "==> Local health check (through nginx, inside the box)"
docker exec sportscast-web wget -qO- http://127.0.0.1:8080/api/health || true
echo
echo "Done. External check:  curl -s https://sportscast.sapper.top/api/health"
