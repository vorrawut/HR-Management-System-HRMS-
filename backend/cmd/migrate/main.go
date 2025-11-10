package main

import (
	"database/sql"
	"fmt"
	"os"

	_ "github.com/lib/pq"
	"leave-management-system/internal/logger"
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
	log := logger.New().With("operation", "create_database")

	// Connect to postgres database to create the target database
	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=postgres sslmode=disable",
		host, port, user, password)

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		log.Errorf("db_connect_failed host=%s port=%s error=%v", host, port, err)
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
		log.Infof("database_exists db_name=%s", dbName)
		return
	}

	// Create database
	_, err = db.Exec(fmt.Sprintf("CREATE DATABASE %s", dbName))
	if err != nil {
		log.Errorf("db_create_failed db_name=%s error=%v", dbName, err)
		os.Exit(1)
	}

	log.Infof("database_created db_name=%s", dbName)
}

func dropDatabase(host, port, user, password, dbName string) {
	log := logger.New().With("operation", "drop_database")

	// Connect to postgres database to drop the target database
	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=postgres sslmode=disable",
		host, port, user, password)

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		log.Errorf("db_connect_failed host=%s port=%s error=%v", host, port, err)
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
		log.Debugf("db_terminate_connections_skipped db_name=%s", dbName)
	}

	// Drop database
	_, err = db.Exec(fmt.Sprintf("DROP DATABASE IF EXISTS %s", dbName))
	if err != nil {
		log.Errorf("db_drop_failed db_name=%s error=%v", dbName, err)
		os.Exit(1)
	}

	log.Infof("database_dropped db_name=%s", dbName)
}

func runMigrationsUp(host, port, user, password, dbName, sslMode string) {
	log := logger.New().With("operation", "migrate_up")

	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		host, port, user, password, dbName, sslMode)

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		log.Errorf("db_connect_failed host=%s port=%s db_name=%s error=%v", host, port, dbName, err)
		log.Warn("db_connect_troubleshooting: ensure PostgreSQL is running, database exists, and user has permissions")
		os.Exit(1)
	}
	defer db.Close()

	// Test connection
	if err := db.Ping(); err != nil {
		log.Errorf("db_ping_failed host=%s port=%s db_name=%s error=%v", host, port, dbName, err)
		log.Warn("db_ping_troubleshooting: ensure PostgreSQL is running, database exists, and user has permissions")
		os.Exit(1)
	}

	// Read migration file
	migrationFile := "migrations/001_create_leave_requests.up.sql"
	sql, err := os.ReadFile(migrationFile)
	if err != nil {
		log.Errorf("migration_read_failed file=%s error=%v", migrationFile, err)
		os.Exit(1)
	}

	// Execute migration
	log.Info("migration_start")
	_, err = db.Exec(string(sql))
	if err != nil {
		log.Errorf("migration_failed file=%s error=%v", migrationFile, err)
		os.Exit(1)
	}

	log.Info("migration_complete")
}

func runMigrationsDown(host, port, user, password, dbName, sslMode string) {
	log := logger.New().With("operation", "migrate_down")

	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		host, port, user, password, dbName, sslMode)

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		log.Errorf("db_connect_failed host=%s port=%s db_name=%s error=%v", host, port, dbName, err)
		os.Exit(1)
	}
	defer db.Close()

	// Read migration file
	migrationFile := "migrations/001_create_leave_requests.down.sql"
	sql, err := os.ReadFile(migrationFile)
	if err != nil {
		log.Errorf("migration_read_failed file=%s error=%v", migrationFile, err)
		os.Exit(1)
	}

	// Execute migration
	log.Info("migration_rollback_start")
	_, err = db.Exec(string(sql))
	if err != nil {
		log.Errorf("migration_rollback_failed file=%s error=%v", migrationFile, err)
		os.Exit(1)
	}

	log.Info("migration_rollback_complete")
}

