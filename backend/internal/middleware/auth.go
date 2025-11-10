package middleware

import (
	"errors"
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"
	"leave-management-system/internal/utils"
)

// AuthMiddleware validates JWT tokens from Next.js/NextAuth
func AuthMiddleware() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			log := GetLogger(c)

			authHeader := c.Request().Header.Get("Authorization")
			if authHeader == "" {
				log.Warn("auth_failed reason=missing_authorization_header")
				return echo.NewHTTPError(http.StatusUnauthorized, "Missing authorization header")
			}

			// Extract token from "Bearer <token>"
			parts := strings.Split(authHeader, " ")
			if len(parts) != 2 || parts[0] != "Bearer" {
				log.Warn("auth_failed reason=invalid_header_format")
				return echo.NewHTTPError(http.StatusUnauthorized, "Invalid authorization header format")
			}

			token := parts[1]

			// Extract user info from token
			userInfo, err := utils.ExtractUserInfoFromToken(token)
			if err != nil {
				log.Warnf("auth_failed reason=invalid_token error=%v", err)
				return echo.NewHTTPError(http.StatusUnauthorized, "Invalid token")
			}

			if userInfo.UserID == "" {
				log.Warn("auth_failed reason=missing_user_info")
				return echo.NewHTTPError(http.StatusUnauthorized, "Token missing user information")
			}

			// Store user info in context
			c.Set("userID", userInfo.UserID)
			c.Set("userEmail", userInfo.Email)
			c.Set("userName", userInfo.Name)
			c.Set("userRoles", userInfo.Roles)

			// Update logger with user context
			if logFromCtx := GetLogger(c); logFromCtx != nil {
				updatedLog := logFromCtx.WithUser(userInfo.UserID, userInfo.Email)
				c.Set("logger", updatedLog)
			}

			log.Debugf("auth_success user_id=%s", userInfo.UserID)

			return next(c)
		}
	}
}

// RequireRole middleware checks if the user has the required role
func RequireRole(roles ...string) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			userRoles, ok := c.Get("userRoles").([]string)
			if !ok {
				return echo.NewHTTPError(http.StatusForbidden, "User roles not found")
			}

			hasRole := false
			for _, requiredRole := range roles {
				for _, userRole := range userRoles {
					if userRole == requiredRole {
						hasRole = true
						break
					}
				}
				if hasRole {
					break
				}
			}

			if !hasRole {
				return echo.NewHTTPError(http.StatusForbidden, "Insufficient permissions")
			}

			return next(c)
		}
	}
}

// GetUserID extracts user ID from context
func GetUserID(c echo.Context) (string, error) {
	userID, ok := c.Get("userID").(string)
	if !ok || userID == "" {
		return "", errors.New("user ID not found in context")
	}
	return userID, nil
}

// GetUserEmail extracts user email from context
func GetUserEmail(c echo.Context) (string, error) {
	email, ok := c.Get("userEmail").(string)
	if !ok {
		return "", errors.New("user email not found in context")
	}
	return email, nil
}

// GetUserName extracts user name from context
func GetUserName(c echo.Context) (string, error) {
	name, ok := c.Get("userName").(string)
	if !ok {
		return "", errors.New("user name not found in context")
	}
	return name, nil
}

