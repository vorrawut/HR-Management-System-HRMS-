#!/bin/bash

# Database initialization script for Leave Management System

set -e

DB_NAME="${DB_NAME:-leave_management}"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

echo "Initializing database: $DB_NAME"

# Check if database exists
if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    echo "Database $DB_NAME already exists"
else
    echo "Creating database $DB_NAME..."
    createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME"
    echo "Database $DB_NAME created successfully"
fi

# Run migrations
echo "Running migrations..."
if command -v migrate &> /dev/null; then
    migrate -path migrations -database "postgres://$DB_USER@$DB_HOST:$DB_PORT/$DB_NAME?sslmode=disable" up
    echo "Migrations completed successfully"
else
    echo "Warning: migrate tool not found. Please install it from https://github.com/golang-migrate/migrate"
    echo "Or run migrations manually: make migrate-up"
fi

echo "Database initialization complete!"

