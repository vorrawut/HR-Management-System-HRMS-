#!/bin/bash

# Database connection variables (can be overridden by environment)
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD:-postgres}
DB_NAME=${DB_NAME:-leave_management}
DB_SSLMODE=${DB_SSLMODE:-disable}

echo "Initializing database: $DB_NAME"

# Check if Go is available
if ! command -v go &> /dev/null; then
    echo "Error: Go is not installed. Please install Go to run migrations."
    exit 1
fi

# Export variables for Go program
export DB_HOST DB_PORT DB_USER DB_PASSWORD DB_NAME DB_SSLMODE

# Create database
echo "Creating database..."
go run cmd/migrate/main.go create-db

# Run migrations
echo "Running migrations..."
go run cmd/migrate/main.go up

echo "Database initialization completed!"
