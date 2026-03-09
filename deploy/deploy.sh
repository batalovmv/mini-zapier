#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d --remove-orphans

echo "Waiting for API..."
sleep 8
curl -fsS http://127.0.0.1:3000/api/health && echo " OK" || (echo " FAILED" && exit 1)
