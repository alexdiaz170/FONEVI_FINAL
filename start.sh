#!/bin/sh
set -e

echo "=== Aplicando migraciones de Prisma ==="
npx prisma migrate deploy --schema=packages/shared/prisma/schema.prisma

echo "=== Iniciando servidor ==="
exec node packages/backend/dist/index.js
