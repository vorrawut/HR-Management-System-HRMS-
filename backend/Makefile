.PHONY: run build test test-unit test-integration test-race migrate-up migrate-down migrate-create clean init-db

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

# Database migrations
migrate-up:
	@if [ -z "$$(which migrate)" ]; then \
		echo "Error: migrate tool not found. Install from https://github.com/golang-migrate/migrate"; \
		exit 1; \
	fi
	migrate -path migrations -database "postgres://$(DB_USER):$(DB_PASSWORD)@$(DB_HOST):$(DB_PORT)/$(DB_NAME)?sslmode=$(DB_SSLMODE)" up

migrate-down:
	@if [ -z "$$(which migrate)" ]; then \
		echo "Error: migrate tool not found. Install from https://github.com/golang-migrate/migrate"; \
		exit 1; \
	fi
	migrate -path migrations -database "postgres://$(DB_USER):$(DB_PASSWORD)@$(DB_HOST):$(DB_PORT)/$(DB_NAME)?sslmode=$(DB_SSLMODE)" down 1

migrate-create:
	@if [ -z "$$(which migrate)" ]; then \
		echo "Error: migrate tool not found. Install from https://github.com/golang-migrate/migrate"; \
		exit 1; \
	fi
	@if [ -z "$(NAME)" ]; then \
		echo "Error: NAME is required. Usage: make migrate-create NAME=migration_name"; \
		exit 1; \
	fi
	migrate create -ext sql -dir migrations -seq $(NAME)

# Initialize database (create if not exists and run migrations)
init-db:
	@./scripts/init-db.sh

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
