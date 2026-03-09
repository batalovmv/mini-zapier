#!/bin/sh
set -e

until pg_isready -h postgres -p 5432 -U "$POSTGRES_USER" -q; do
  echo "Waiting for PostgreSQL..."
  sleep 2
done

cd /app/apps/api
./node_modules/.bin/prisma migrate deploy

exec node dist/main.js
