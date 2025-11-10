package utils

import (
	"encoding/base64"
	"encoding/json"
	"testing"
)

func TestExtractUserInfoFromToken(t *testing.T) {
	tests := []struct {
		name        string
		tokenString string
		setupToken  func() string
		wantErr     bool
		checkFields func(*testing.T, *UserInfo)
	}{
		{
			name:        "valid token with all fields",
			tokenString: "",
			setupToken: func() string {
				header := map[string]interface{}{
					"alg": "HS256",
					"typ": "JWT",
				}
				payload := map[string]interface{}{
					"sub":   "user-123",
					"email": "test@example.com",
					"name":  "Test User",
					"roles": []interface{}{"employee", "manager"},
				}

				return createMockJWT(header, payload)
			},
			wantErr: false,
			checkFields: func(t *testing.T, info *UserInfo) {
				if info.UserID != "user-123" {
					t.Errorf("expected UserID %q, got %q", "user-123", info.UserID)
				}
				if info.Email != "test@example.com" {
					t.Errorf("expected Email %q, got %q", "test@example.com", info.Email)
				}
				if info.Name != "Test User" {
					t.Errorf("expected Name %q, got %q", "Test User", info.Name)
				}
				if len(info.Roles) != 2 {
					t.Errorf("expected 2 roles, got %d", len(info.Roles))
				}
			},
		},
		{
			name:        "token with minimal fields",
			tokenString: "",
			setupToken: func() string {
				header := map[string]interface{}{
					"alg": "HS256",
					"typ": "JWT",
				}
				payload := map[string]interface{}{
					"sub": "user-456",
				}

				return createMockJWT(header, payload)
			},
			wantErr: false,
			checkFields: func(t *testing.T, info *UserInfo) {
				if info.UserID != "user-456" {
					t.Errorf("expected UserID %q, got %q", "user-456", info.UserID)
				}
				if info.Email != "" {
					t.Errorf("expected empty Email, got %q", info.Email)
				}
			},
		},
		{
			name:        "invalid token format",
			tokenString: "invalid.token",
			wantErr:     true,
		},
		{
			name:        "empty token",
			tokenString: "",
			setupToken:  func() string { return "" },
			wantErr:     true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var token string
			if tt.setupToken != nil {
				token = tt.setupToken()
			} else {
				token = tt.tokenString
			}

			info, err := ExtractUserInfoFromToken(token)

			if tt.wantErr {
				if err == nil {
					t.Errorf("expected error but got none")
				}
				return
			}

			if err != nil {
				t.Errorf("unexpected error: %v", err)
				return
			}

			if info == nil {
				t.Errorf("expected UserInfo but got nil")
				return
			}

			if tt.checkFields != nil {
				tt.checkFields(t, info)
			}
		})
	}
}

func TestUserInfo_HasRole(t *testing.T) {
	info := &UserInfo{
		Roles: []string{"employee", "manager", "admin"},
	}

	tests := []struct {
		role string
		want bool
	}{
		{"employee", true},
		{"manager", true},
		{"admin", true},
		{"guest", false},
		{"", false},
	}

	for _, tt := range tests {
		t.Run(tt.role, func(t *testing.T) {
			got := info.HasRole(tt.role)
			if got != tt.want {
				t.Errorf("HasRole(%q) = %v, want %v", tt.role, got, tt.want)
			}
		})
	}
}

func TestUserInfo_HasAnyRole(t *testing.T) {
	info := &UserInfo{
		Roles: []string{"employee", "manager"},
	}

	tests := []struct {
		name  string
		roles []string
		want  bool
	}{
		{"has one of the roles", []string{"employee", "admin"}, true},
		{"has none of the roles", []string{"admin", "guest"}, false},
		{"empty roles list", []string{}, false},
		{"has all roles", []string{"employee", "manager"}, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := info.HasAnyRole(tt.roles...)
			if got != tt.want {
				t.Errorf("HasAnyRole(%v) = %v, want %v", tt.roles, got, tt.want)
			}
		})
	}
}

// Helper function to create a mock JWT token
func createMockJWT(header, payload map[string]interface{}) string {
	headerJSON, _ := json.Marshal(header)
	payloadJSON, _ := json.Marshal(payload)

	headerB64 := base64.RawURLEncoding.EncodeToString(headerJSON)
	payloadB64 := base64.RawURLEncoding.EncodeToString(payloadJSON)

	// Create a mock signature (not validated in our tests)
	signature := "mock-signature"

	return headerB64 + "." + payloadB64 + "." + signature
}

