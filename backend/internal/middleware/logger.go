package middleware

import (
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"leave-management-system/internal/logger"
)

// RequestLogger middleware adds request ID and logger to context
func RequestLogger() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			// Generate or extract request ID
			requestID := c.Request().Header.Get("X-Request-ID")
			if requestID == "" {
				requestID = uuid.New().String()
			}

			// Set request ID in response header
			c.Response().Header().Set("X-Request-ID", requestID)

			// Store in context
			c.Set("request_id", requestID)

			// Create logger with request ID
			log := logger.New().WithRequestID(requestID)

			// Log request
			log.Infof("request_start method=%s path=%s remote_addr=%s",
				c.Request().Method,
				c.Request().URL.Path,
				c.Request().RemoteAddr,
			)

			// Store logger in context
			c.Set("logger", log)

			// Continue request
			err := next(c)

			// Log response
			status := c.Response().Status
			if err != nil {
				log.Errorf("request_error status=%d error=%v", status, err)
			} else {
				log.Infof("request_complete status=%d", status)
			}

			return err
		}
	}
}

// GetLogger extracts logger from Echo context
func GetLogger(c echo.Context) *logger.Logger {
	if log, ok := c.Get("logger").(*logger.Logger); ok {
		return log
	}
	return logger.New()
}

