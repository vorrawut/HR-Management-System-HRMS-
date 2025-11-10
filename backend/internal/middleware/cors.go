package middleware

import (
	"github.com/labstack/echo/v4/middleware"
)

// CORSConfig returns CORS middleware configuration
func CORSConfig() middleware.CORSConfig {
	return middleware.CORSConfig{
		AllowOrigins:     []string{"http://localhost:3000"}, // Next.js dev server
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
		MaxAge:           86400,
	}
}

