package config

import (
	"os"
	"testing"
)

func TestLoad(t *testing.T) {
	// Save original env
	originalEnv := make(map[string]string)
	envVars := []string{
		"PORT", "ENV", "DB_HOST", "DB_PORT", "DB_USER", "DB_PASSWORD",
		"DB_NAME", "DB_SSLMODE", "JWT_SECRET", "NEXTAUTH_URL",
		"SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASSWORD", "SMTP_FROM",
		"KEYCLOAK_ISSUER", "KEYCLOAK_CLIENT_ID",
	}

	for _, key := range envVars {
		originalEnv[key] = os.Getenv(key)
		os.Unsetenv(key)
	}

	// Restore original env after test
	defer func() {
		for key, value := range originalEnv {
			if value != "" {
				os.Setenv(key, value)
			} else {
				os.Unsetenv(key)
			}
		}
	}()

	t.Run("load with defaults", func(t *testing.T) {
		cfg, err := Load()
		if err != nil {
			t.Errorf("unexpected error: %v", err)
			return
		}

		if cfg.Port != "8081" {
			t.Errorf("expected default port 8081, got %s", cfg.Port)
		}

		if cfg.Env != "development" {
			t.Errorf("expected default env development, got %s", cfg.Env)
		}

		if cfg.Database.Host != "localhost" {
			t.Errorf("expected default DB host localhost, got %s", cfg.Database.Host)
		}
	})

	t.Run("load with custom values", func(t *testing.T) {
		os.Setenv("PORT", "9000")
		os.Setenv("DB_HOST", "custom-host")
		os.Setenv("SMTP_PORT", "465")

		cfg, err := Load()
		if err != nil {
			t.Errorf("unexpected error: %v", err)
			return
		}

		if cfg.Port != "9000" {
			t.Errorf("expected port 9000, got %s", cfg.Port)
		}

		if cfg.Database.Host != "custom-host" {
			t.Errorf("expected DB host custom-host, got %s", cfg.Database.Host)
		}

		if cfg.Email.Port != 465 {
			t.Errorf("expected SMTP port 465, got %d", cfg.Email.Port)
		}

		// Cleanup
		os.Unsetenv("PORT")
		os.Unsetenv("DB_HOST")
		os.Unsetenv("SMTP_PORT")
	})
}

func TestGetEnv(t *testing.T) {
	os.Setenv("TEST_KEY", "test-value")
	defer os.Unsetenv("TEST_KEY")

	value := getEnv("TEST_KEY", "default")
	if value != "test-value" {
		t.Errorf("expected test-value, got %s", value)
	}

	value = getEnv("NON_EXISTENT_KEY", "default-value")
	if value != "default-value" {
		t.Errorf("expected default-value, got %s", value)
	}
}

