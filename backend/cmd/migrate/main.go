package main

import (
	"database/sql"
	"fmt"
	"os"

	_ "github.com/lib/pq"
)

func main() {
	// Get database connection from environment or use defaults
	dbHost := getEnv("DB_HOST", "localhost")
	dbPort := getEnv("DB_PORT", "5432")
	dbUser := getEnv("DB_USER", "postgres")
	dbPassword := getEnv("DB_PASSWORD", "postgres")
	dbName := getEnv("DB_NAME", "leave_management")
	dbSSLMode := getEnv("DB_SSLMODE", "disable")

	action := "up"
	if len(os.Args) > 1 {
		action = os.Args[1]
	}

	switch action {
	case "up":
		runMigrationsUp(dbHost, dbPort, dbUser, dbPassword, dbName, dbSSLMode)
	case "down":
		runMigrationsDown(dbHost, dbPort, dbUser, dbPassword, dbName, dbSSLMode)
	case "create-db":
		createDatabase(dbHost, dbPort, dbUser, dbPassword, dbName)
	case "drop-db":
		dropDatabase(dbHost, dbPort, dbUser, dbPassword, dbName)
	default:
		fmt.Printf("Usage: %s [up|down|create-db|drop-db]\n", os.Args[0])
		os.Exit(1)
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func createDatabase(host, port, user, password, dbName string) {
	// Connect to postgres database to create the target database
	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=postgres sslmode=disable",
		host, port, user, password)

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		fmt.Printf("Error: Failed to connect to PostgreSQL: %v\n", err)
		os.Exit(1)
	}
	defer db.Close()

	// Check if database exists
	var exists bool
	err = db.QueryRow(
		"SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = $1)",
		dbName,
	).Scan(&exists)

	if exists {
		fmt.Printf("Database '%s' already exists.\n", dbName)
		return
	}

	// Create database
	_, err = db.Exec(fmt.Sprintf("CREATE DATABASE %s", dbName))
	if err != nil {
		fmt.Printf("Error: Failed to create database: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("Database '%s' created successfully!\n", dbName)
}

func dropDatabase(host, port, user, password, dbName string) {
	// Connect to postgres database to drop the target database
	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=postgres sslmode=disable",
		host, port, user, password)

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		fmt.Printf("Error: Failed to connect to PostgreSQL: %v\n", err)
		os.Exit(1)
	}
	defer db.Close()

	// Terminate all connections to the database
	_, err = db.Exec(`
		SELECT pg_terminate_backend(pid)
		FROM pg_stat_activity
		WHERE datname = $1 AND pid <> pg_backend_pid()
	`, dbName)
	if err != nil {
		// Ignore error if database doesn't exist
	}

	// Drop database
	_, err = db.Exec(fmt.Sprintf("DROP DATABASE IF EXISTS %s", dbName))
	if err != nil {
		fmt.Printf("Error: Failed to drop database: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("Database '%s' dropped successfully!\n", dbName)
}

func runMigrationsUp(host, port, user, password, dbName, sslMode string) {
	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		host, port, user, password, dbName, sslMode)

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		fmt.Printf("Error: Failed to connect to database: %v\n", err)
		fmt.Println("\nMake sure:")
		fmt.Println("  1. PostgreSQL is running")
		fmt.Println("  2. Database exists (run: go run cmd/migrate/main.go create-db)")
		fmt.Println("  3. User has permissions")
		os.Exit(1)
	}
	defer db.Close()

	// Test connection
	if err := db.Ping(); err != nil {
		fmt.Printf("Error: Failed to ping database: %v\n", err)
		fmt.Println("\nMake sure:")
		fmt.Println("  1. PostgreSQL is running")
		fmt.Println("  2. Database exists (run: go run cmd/migrate/main.go create-db)")
		fmt.Println("  3. User has permissions")
		os.Exit(1)
	}

	// Read migration file
	migrationFile := "migrations/001_create_leave_requests.up.sql"
	sql, err := os.ReadFile(migrationFile)
	if err != nil {
		fmt.Printf("Error: Failed to read migration file '%s': %v\n", migrationFile, err)
		os.Exit(1)
	}

	// Execute migration
	fmt.Println("Running migrations...")
	_, err = db.Exec(string(sql))
	if err != nil {
		fmt.Printf("Error: Failed to run migrations: %v\n", err)
		os.Exit(1)
	}

	fmt.Println("Migrations completed successfully!")
}

func runMigrationsDown(host, port, user, password, dbName, sslMode string) {
	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		host, port, user, password, dbName, sslMode)

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		fmt.Printf("Error: Failed to connect to database: %v\n", err)
		os.Exit(1)
	}
	defer db.Close()

	// Read migration file
	migrationFile := "migrations/001_create_leave_requests.down.sql"
	sql, err := os.ReadFile(migrationFile)
	if err != nil {
		fmt.Printf("Error: Failed to read migration file '%s': %v\n", migrationFile, err)
		os.Exit(1)
	}

	// Execute migration
	fmt.Println("Rolling back migrations...")
	_, err = db.Exec(string(sql))
	if err != nil {
		fmt.Printf("Error: Failed to rollback migrations: %v\n", err)
		os.Exit(1)
	}

	fmt.Println("Rollback completed successfully!")
}

