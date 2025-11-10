package utils

import (
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
)

// UserInfo represents the user information extracted from JWT token
type UserInfo struct {
	UserID string
	Email  string
	Name   string
	Roles  []string
}

// ExtractUserInfoFromToken extracts user information from a JWT token
// This is a simplified version - in production, you should properly validate the token
// using the JWT secret and verify the signature
func ExtractUserInfoFromToken(tokenString string) (*UserInfo, error) {
	// Split token into parts
	parts := strings.Split(tokenString, ".")
	if len(parts) != 3 {
		return nil, errors.New("invalid token format")
	}

	// Decode the payload (second part)
	payload, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return nil, fmt.Errorf("failed to decode token payload: %w", err)
	}

	// Parse the payload
	var claims map[string]interface{}
	if err := json.Unmarshal(payload, &claims); err != nil {
		return nil, fmt.Errorf("failed to parse token claims: %w", err)
	}

	// Extract user information
	userInfo := &UserInfo{}

	if sub, ok := claims["sub"].(string); ok {
		userInfo.UserID = sub
	}

	if email, ok := claims["email"].(string); ok {
		userInfo.Email = email
	}

	if name, ok := claims["name"].(string); ok {
		userInfo.Name = name
	}

	// Extract roles from session (if available)
	if roles, ok := claims["roles"].([]interface{}); ok {
		userInfo.Roles = make([]string, 0, len(roles))
		for _, role := range roles {
			if r, ok := role.(string); ok {
				userInfo.Roles = append(userInfo.Roles, r)
			}
		}
	}

	return userInfo, nil
}

// HasRole checks if the user has a specific role
func (u *UserInfo) HasRole(role string) bool {
	for _, r := range u.Roles {
		if r == role {
			return true
		}
	}
	return false
}

// HasAnyRole checks if the user has any of the specified roles
func (u *UserInfo) HasAnyRole(roles ...string) bool {
	for _, role := range roles {
		if u.HasRole(role) {
			return true
		}
	}
	return false
}

