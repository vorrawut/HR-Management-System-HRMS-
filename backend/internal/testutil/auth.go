package testutil

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
)

// CreateTestJWT creates a test JWT token for integration tests
func CreateTestJWT(userID, email, name string, roles []string) string {
	header := map[string]interface{}{
		"alg": "HS256",
		"typ": "JWT",
	}

	payload := map[string]interface{}{
		"sub":   userID,
		"email": email,
		"name":  name,
		"roles": roles,
	}

	headerJSON, _ := json.Marshal(header)
	payloadJSON, _ := json.Marshal(payload)

	headerB64 := base64.RawURLEncoding.EncodeToString(headerJSON)
	payloadB64 := base64.RawURLEncoding.EncodeToString(payloadJSON)

	// Mock signature (not validated in tests)
	signature := "test-signature"

	return fmt.Sprintf("%s.%s.%s", headerB64, payloadB64, signature)
}

// GetAuthHeader returns an Authorization header value
func GetAuthHeader(token string) string {
	return fmt.Sprintf("Bearer %s", token)
}

