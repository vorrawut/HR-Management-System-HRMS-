package testutil

import (
	"database/sql"
	"fmt"
	"os"
	"testing"

	_ "github.com/lib/pq"
	"leave-management-system/internal/config"
	"leave-management-system/internal/database"
	"leave-management-system/internal/repository"
	"leave-management-system/internal/services"
)

// SetupTestDB creates a test database connection
func SetupTestDB(t *testing.T) *sql.DB {
	t.Helper()

	// Use test database configuration
	testConfig := &config.Config{
		Database: config.DatabaseConfig{
			Host:     getEnv("TEST_DB_HOST", "localhost"),
			Port:     getEnv("TEST_DB_PORT", "5432"),
			User:     getEnv("TEST_DB_USER", "postgres"),
			Password: getEnv("TEST_DB_PASSWORD", "postgres"),
			Name:     getEnv("TEST_DB_NAME", "leave_management_test"),
			SSLMode:  getEnv("TEST_DB_SSLMODE", "disable"),
		},
	}

	db, err := sql.Open("postgres", fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		testConfig.Database.Host,
		testConfig.Database.Port,
		testConfig.Database.User,
		testConfig.Database.Password,
		testConfig.Database.Name,
		testConfig.Database.SSLMode,
	))
	if err != nil {
		t.Fatalf("Failed to open test database: %v", err)
	}

	if err := db.Ping(); err != nil {
		t.Fatalf("Failed to ping test database: %v", err)
	}

	return db
}

// CleanupTestDB truncates all tables in the test database
func CleanupTestDB(t *testing.T, db *sql.DB) {
	t.Helper()

	tables := []string{"leave_requests"}
	for _, table := range tables {
		_, err := db.Exec(fmt.Sprintf("TRUNCATE TABLE %s CASCADE", table))
		if err != nil {
			t.Logf("Warning: Failed to truncate table %s: %v", table, err)
		}
	}
}

// SetupTestServices creates test services with a real database
func SetupTestServices(t *testing.T, db *sql.DB) (*services.LeaveService, *services.EmailService) {
	t.Helper()

	repo := repository.NewLeaveRepository(db)
	leaveService := services.NewLeaveService(repo)

	cfg := &config.Config{
		Email: config.EmailConfig{
			Host:     "", // Not configured for tests
			Port:     587,
			User:     "",
			Password: "",
			From:     "test@example.com",
		},
	}
	emailService := services.NewEmailService(cfg)

	return leaveService, emailService
}

// RunMigrations runs database migrations for testing
func RunMigrations(t *testing.T, db *sql.DB) {
	t.Helper()

	migrationSQL := `
		CREATE TABLE IF NOT EXISTS leave_requests (
			id UUID PRIMARY KEY,
			employee_id VARCHAR(255) NOT NULL,
			employee_name VARCHAR(255) NOT NULL,
			employee_email VARCHAR(255) NOT NULL,
			leave_type VARCHAR(50) NOT NULL,
			reason TEXT NOT NULL,
			start_date TIMESTAMP NOT NULL,
			end_date TIMESTAMP NOT NULL,
			days INTEGER NOT NULL,
			status VARCHAR(50) NOT NULL DEFAULT 'pending',
			manager_comment TEXT,
			created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
		);
	`

	_, err := db.Exec(migrationSQL)
	if err != nil {
		t.Fatalf("Failed to run migrations: %v", err)
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

