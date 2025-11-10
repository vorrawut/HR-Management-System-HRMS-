.PHONY: run build test test-unit test-integration test-race migrate-up migrate-down clean init-db deps dev

# Default database connection variables (can be overridden)
DB_HOST ?= localhost
DB_PORT ?= 5432
DB_USER ?= postgres
DB_PASSWORD ?= postgres
DB_NAME ?= leave_management
DB_SSLMODE ?= disable

# Run the application
run:
	go run cmd/server/main.go

# Build the application
build:
	go build -o bin/server cmd/server/main.go

# Run all tests
test:
	go test -v ./...

# Run unit tests only
test-unit:
	go test -v ./internal/models ./internal/services ./internal/repository ./internal/utils ./internal/config ./internal/middleware

# Run integration tests only
test-integration:
	go test -v ./internal/integration

# Run tests with race detector
test-race:
	go test -race -v ./...

# Run tests with coverage
test-coverage:
	go test -v -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out

# Database migrations using Go (no external tools needed)
migrate-up:
	@echo "Running database migrations..."
	@DB_HOST=$(DB_HOST) DB_PORT=$(DB_PORT) DB_USER=$(DB_USER) DB_PASSWORD=$(DB_PASSWORD) DB_NAME=$(DB_NAME) DB_SSLMODE=$(DB_SSLMODE) \
		go run cmd/migrate/main.go up

migrate-down:
	@echo "Rolling back database migrations..."
	@DB_HOST=$(DB_HOST) DB_PORT=$(DB_PORT) DB_USER=$(DB_USER) DB_PASSWORD=$(DB_PASSWORD) DB_NAME=$(DB_NAME) DB_SSLMODE=$(DB_SSLMODE) \
		go run cmd/migrate/main.go down

# Initialize database (create if not exists and run migrations)
init-db:
	@echo "Initializing database..."
	@DB_HOST=$(DB_HOST) DB_PORT=$(DB_PORT) DB_USER=$(DB_USER) DB_PASSWORD=$(DB_PASSWORD) DB_NAME=$(DB_NAME) DB_SSLMODE=$(DB_SSLMODE) \
		go run cmd/migrate/main.go create-db
	@DB_HOST=$(DB_HOST) DB_PORT=$(DB_PORT) DB_USER=$(DB_USER) DB_PASSWORD=$(DB_PASSWORD) DB_NAME=$(DB_NAME) DB_SSLMODE=$(DB_SSLMODE) \
		go run cmd/migrate/main.go up
	@echo "Database initialization completed!"

# Clean build artifacts
clean:
	rm -rf bin/
	rm -f coverage.out

# Install dependencies
deps:
	go mod download
	go mod tidy

# Development setup (install deps, init db, run)
dev: deps init-db run

# Create database (helper command)
create-db:
	@echo "Creating database '$(DB_NAME)'..."
	@DB_HOST=$(DB_HOST) DB_PORT=$(DB_PORT) DB_USER=$(DB_USER) DB_PASSWORD=$(DB_PASSWORD) DB_NAME=$(DB_NAME) \
		go run cmd/migrate/main.go create-db

# Drop database (helper command)
drop-db:
	@echo "Dropping database '$(DB_NAME)'..."
	@DB_HOST=$(DB_HOST) DB_PORT=$(DB_PORT) DB_USER=$(DB_USER) DB_PASSWORD=$(DB_PASSWORD) DB_NAME=$(DB_NAME) \
		go run cmd/migrate/main.go drop-db

# Reset database (drop, create, migrate)
reset-db: drop-db create-db migrate-up
