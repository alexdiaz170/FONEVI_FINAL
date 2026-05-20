#!/bin/bash
# FONEVI Production Database Backup Script (Linux/Bash)
# Creates a compressed PostgreSQL schema + data dump from Supabase

# Load Environment Variables from .env
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/../.env" ]; then
  export $(grep -v '^#' "$SCRIPT_DIR/../.env" | xargs)
fi

# Config
if [ -z "$DATABASE_URL" ]; then
  echo "❌ Error: DATABASE_URL not found in .env. Exiting..."
  exit 1
fi

# Parse connection string
# Extract parts from DATABASE_URL
DB_USER=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/ \([^:]*\):.*/\1/p')
DB_PASS=$(echo "$DATABASE_URL" | sed -n 's/.*:\([^@]*\)@.*/\1/p')
DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:\/]*\).*/\1/p')
DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?#]*\).*/\1/p')

# Set default port if missing
if [ -z "$DB_PORT" ]; then
  DB_PORT=5432
fi

# Backup directory setup
BACKUP_DIR="$SCRIPT_DIR/../backups"
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="$BACKUP_DIR/fonevi_backup_$TIMESTAMP.sql"

# Setup PGPASSWORD so pg_dump doesn't prompt for password
export PGPASSWORD="$DB_PASS"

echo "🚀 Starting PostgreSQL Backup for FONEVI..."
echo "Database Name: $DB_NAME"
echo "Target Host: $DB_HOST"
echo "Backup File: $BACKUP_FILE"

# Execute pg_dump
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -F p -f "$BACKUP_FILE" --no-owner --no-privileges

if [ $? -eq 0 ]; then
  # Compress the SQL dump to save space
  gzip "$BACKUP_FILE"
  echo "✅ Backup completed successfully: ${BACKUP_FILE}.gz"
else
  echo "❌ Error: Backup failed during pg_dump execution."
  exit 1
fi

# Clear PGPASSWORD
unset PGPASSWORD
