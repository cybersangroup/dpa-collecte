#!/bin/sh
set -e

echo "▶ Running Prisma migrations..."
prisma migrate deploy

echo "▶ Starting Next.js on port ${PORT:-3000}..."
exec node server.js
