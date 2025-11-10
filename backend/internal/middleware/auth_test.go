package middleware

import (
	"encoding/base64"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/labstack/echo/v4"
)

func createMockJWT(header, payload map[string]interface{}) string {
	headerJSON, _ := json.Marshal(header)
	payloadJSON, _ := json.Marshal(payload)

	headerB64 := base64.RawURLEncoding.EncodeToString(headerJSON)
	payloadB64 := base64.RawURLEncoding.EncodeToString(payloadJSON)

	signature := "mock-signature"
	return headerB64 + "." + payloadB64 + "." + signature
}

func TestAuthMiddleware(t *testing.T) {
	e := echo.New()

	tests := []struct {
		name           string
		authHeader     string
		wantStatusCode int
		wantErr        bool
	}{
		{
			name: "valid token",
			authHeader: "Bearer " + createMockJWT(
				map[string]interface{}{"alg": "HS256", "typ": "JWT"},
				map[string]interface{}{
					"sub":   "user-123",
					"email": "test@example.com",
					"name":  "Test User",
					"roles": []interface{}{"employee"},
				},
			),
			wantStatusCode: http.StatusOK,
			wantErr:        false,
		},
		{
			name:           "missing authorization header",
			authHeader:     "",
			wantStatusCode: http.StatusUnauthorized,
			wantErr:        true,
		},
		{
			name:           "invalid header format",
			authHeader:     "InvalidFormat token",
			wantStatusCode: http.StatusUnauthorized,
			wantErr:        true,
		},
		{
			name:           "invalid token format",
			authHeader:     "Bearer invalid.token",
			wantStatusCode: http.StatusUnauthorized,
			wantErr:        true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, "/test", nil)
			if tt.authHeader != "" {
				req.Header.Set("Authorization", tt.authHeader)
			}
			rec := httptest.NewRecorder()
			c := e.NewContext(req, rec)

			handler := AuthMiddleware()(func(c echo.Context) error {
				return c.String(http.StatusOK, "ok")
			})

			err := handler(c)

			if tt.wantErr {
				if err == nil {
					t.Errorf("expected error but got none")
					return
				}
				he, ok := err.(*echo.HTTPError)
				if !ok {
					t.Errorf("expected HTTPError, got %T", err)
					return
				}
				if he.Code != tt.wantStatusCode {
					t.Errorf("expected status code %d, got %d", tt.wantStatusCode, he.Code)
				}
				return
			}

			if err != nil {
				t.Errorf("unexpected error: %v", err)
				return
			}

			// Verify user info is set in context
			userID := c.Get("userID")
			if userID == nil {
				t.Errorf("expected userID in context")
			}
		})
	}
}

func TestRequireRole(t *testing.T) {
	e := echo.New()

	tests := []struct {
		name           string
		userRoles      []string
		requiredRoles  []string
		wantStatusCode int
		wantErr        bool
	}{
		{
			name:          "has required role",
			userRoles:     []string{"employee", "manager"},
			requiredRoles: []string{"manager"},
			wantStatusCode: http.StatusOK,
			wantErr:        false,
		},
		{
			name:          "has admin role",
			userRoles:     []string{"admin"},
			requiredRoles: []string{"manager", "admin"},
			wantStatusCode: http.StatusOK,
			wantErr:        false,
		},
		{
			name:          "missing required role",
			userRoles:     []string{"employee"},
			requiredRoles: []string{"manager", "admin"},
			wantStatusCode: http.StatusForbidden,
			wantErr:        true,
		},
		{
			name:          "no roles",
			userRoles:     []string{},
			requiredRoles: []string{"manager"},
			wantStatusCode: http.StatusForbidden,
			wantErr:        true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, "/test", nil)
			rec := httptest.NewRecorder()
			c := e.NewContext(req, rec)
			c.Set("userRoles", tt.userRoles)

			handler := RequireRole(tt.requiredRoles...)(func(c echo.Context) error {
				return c.String(http.StatusOK, "ok")
			})

			err := handler(c)

			if tt.wantErr {
				if err == nil {
					t.Errorf("expected error but got none")
					return
				}
				he, ok := err.(*echo.HTTPError)
				if !ok {
					t.Errorf("expected HTTPError, got %T", err)
					return
				}
				if he.Code != tt.wantStatusCode {
					t.Errorf("expected status code %d, got %d", tt.wantStatusCode, he.Code)
				}
				return
			}

			if err != nil {
				t.Errorf("unexpected error: %v", err)
			}
		})
	}
}

func TestGetUserID(t *testing.T) {
	e := echo.New()
	c := e.NewContext(nil, nil)

	// Test missing userID
	_, err := GetUserID(c)
	if err == nil {
		t.Errorf("expected error when userID is missing")
	}

	// Test with userID
	c.Set("userID", "user-123")
	userID, err := GetUserID(c)
	if err != nil {
		t.Errorf("unexpected error: %v", err)
	}
	if userID != "user-123" {
		t.Errorf("expected userID %q, got %q", "user-123", userID)
	}
}

func TestGetUserEmail(t *testing.T) {
	e := echo.New()
	c := e.NewContext(nil, nil)

	// Test missing email
	_, err := GetUserEmail(c)
	if err == nil {
		t.Errorf("expected error when email is missing")
	}

	// Test with email
	c.Set("userEmail", "test@example.com")
	email, err := GetUserEmail(c)
	if err != nil {
		t.Errorf("unexpected error: %v", err)
	}
	if email != "test@example.com" {
		t.Errorf("expected email %q, got %q", "test@example.com", email)
	}
}

func TestGetUserName(t *testing.T) {
	e := echo.New()
	c := e.NewContext(nil, nil)

	// Test missing name
	_, err := GetUserName(c)
	if err == nil {
		t.Errorf("expected error when name is missing")
	}

	// Test with name
	c.Set("userName", "Test User")
	name, err := GetUserName(c)
	if err != nil {
		t.Errorf("unexpected error: %v", err)
	}
	if name != "Test User" {
		t.Errorf("expected name %q, got %q", "Test User", name)
	}
}

