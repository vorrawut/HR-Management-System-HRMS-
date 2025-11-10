package config

import (
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	Port         string
	Env          string
	Database     DatabaseConfig
	JWT          JWTConfig
	Email        EmailConfig
	Keycloak     KeycloakConfig
}

type DatabaseConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	Name     string
	SSLMode  string
}

type JWTConfig struct {
	Secret      string
	NextAuthURL string
}

type EmailConfig struct {
	Host     string
	Port     int
	User     string
	Password string
	From     string
}

type KeycloakConfig struct {
	Issuer   string
	ClientID string
}

func Load() (*Config, error) {
	// Load .env file if it exists (optional in production)
	_ = godotenv.Load()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8081"
	}

	smtpPort, _ := strconv.Atoi(os.Getenv("SMTP_PORT"))
	if smtpPort == 0 {
		smtpPort = 587
	}

	return &Config{
		Port: port,
		Env:  getEnv("ENV", "development"),
		Database: DatabaseConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnv("DB_PORT", "5432"),
			User:     getEnv("DB_USER", "postgres"),
			Password: getEnv("DB_PASSWORD", "postgres"),
			Name:     getEnv("DB_NAME", "leave_management"),
			SSLMode:  getEnv("DB_SSLMODE", "disable"),
		},
		JWT: JWTConfig{
			Secret:      getEnv("JWT_SECRET", ""),
			NextAuthURL: getEnv("NEXTAUTH_URL", "http://localhost:3000"),
		},
		Email: EmailConfig{
			Host:     getEnv("SMTP_HOST", ""),
			Port:     smtpPort,
			User:     getEnv("SMTP_USER", ""),
			Password: getEnv("SMTP_PASSWORD", ""),
			From:     getEnv("SMTP_FROM", "noreply@company.com"),
		},
		Keycloak: KeycloakConfig{
			Issuer:   getEnv("KEYCLOAK_ISSUER", "http://localhost:8080/realms/next"),
			ClientID: getEnv("KEYCLOAK_CLIENT_ID", "next"),
		},
	}, nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

