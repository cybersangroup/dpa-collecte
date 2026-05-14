#!/bin/sh
set -e

echo "▶ Running Prisma migrations..."
./node_modules/.bin/prisma migrate deploy

echo "▶ Starting Next.js on port ${PORT:-3000}..."
exec node server.js
