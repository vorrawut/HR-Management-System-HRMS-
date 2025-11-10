package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"leave-management-system/internal/models"
	"leave-management-system/internal/repository"
	"leave-management-system/internal/services"
)

func setupTestHandler() (*LeaveHandler, *repository.MockLeaveRepository) {
	repo := repository.NewMockLeaveRepository()
	service := services.NewLeaveService(repo)
	handler := NewLeaveHandler(service)
	return handler, repo
}

func setupEchoContext(method, path string, body interface{}) (echo.Context, *httptest.ResponseRecorder) {
	e := echo.New()
	var reqBody []byte
	if body != nil {
		reqBody, _ = json.Marshal(body)
	}
	req := httptest.NewRequest(method, path, bytes.NewBuffer(reqBody))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	return c, rec
}

func TestLeaveHandler_CreateLeaveRequest(t *testing.T) {
	handler, repo := setupTestHandler()

	tests := []struct {
		name           string
		body           interface{}
		setupContext   func(echo.Context)
		wantStatusCode int
		wantErr        bool
	}{
		{
			name: "valid request",
			body: map[string]interface{}{
				"leaveType": "annual",
				"reason":    "Vacation time",
				"startDate": "2024-01-01T00:00:00Z",
				"endDate":   "2024-01-05T00:00:00Z",
			},
			setupContext: func(c echo.Context) {
				c.Set("userID", "emp-1")
				c.Set("userName", "John Doe")
				c.Set("userEmail", "john@example.com")
			},
			wantStatusCode: http.StatusCreated,
			wantErr:        false,
		},
		{
			name: "missing user context",
			body: map[string]interface{}{
				"leaveType": "annual",
				"reason":    "Vacation",
				"startDate": "2024-01-01T00:00:00Z",
				"endDate":   "2024-01-05T00:00:00Z",
			},
			setupContext:   func(c echo.Context) {},
			wantStatusCode: http.StatusUnauthorized,
			wantErr:        true,
		},
		{
			name: "invalid date range",
			body: map[string]interface{}{
				"leaveType": "annual",
				"reason":    "Vacation",
				"startDate": "2024-01-05T00:00:00Z",
				"endDate":   "2024-01-01T00:00:00Z",
			},
			setupContext: func(c echo.Context) {
				c.Set("userID", "emp-1")
				c.Set("userName", "John Doe")
				c.Set("userEmail", "john@example.com")
			},
			wantStatusCode: http.StatusBadRequest,
			wantErr:        true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			repo.Clear()
			c, rec := setupEchoContext(http.MethodPost, "/api/v1/leave", tt.body)
			tt.setupContext(c)

			err := handler.CreateLeaveRequest(c)

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

			if rec.Code != tt.wantStatusCode {
				t.Errorf("expected status code %d, got %d", tt.wantStatusCode, rec.Code)
			}
		})
	}
}

func TestLeaveHandler_GetLeaveRequests(t *testing.T) {
	handler, repo := setupTestHandler()

	// Create test data
	leaveID := uuid.New()
	leave := &models.LeaveRequest{
		ID:            leaveID,
		EmployeeID:    "emp-1",
		EmployeeName:  "John Doe",
		EmployeeEmail: "john@example.com",
		LeaveType:     models.LeaveTypeAnnual,
		Reason:        "Vacation",
		StartDate:     time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC),
		EndDate:       time.Date(2024, 1, 5, 0, 0, 0, 0, time.UTC),
		Days:          5,
		Status:        models.LeaveStatusPending,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}
	repo.Create(leave)

	tests := []struct {
		name           string
		setupContext   func(echo.Context)
		wantStatusCode int
		wantCount      int
	}{
		{
			name: "get leave requests",
			setupContext: func(c echo.Context) {
				c.Set("userID", "emp-1")
			},
			wantStatusCode: http.StatusOK,
			wantCount:      1,
		},
		{
			name: "missing user context",
			setupContext: func(c echo.Context) {
				// No userID set
			},
			wantStatusCode: http.StatusUnauthorized,
			wantCount:      0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			c, rec := setupEchoContext(http.MethodGet, "/api/v1/leave", nil)
			tt.setupContext(c)

			err := handler.GetLeaveRequests(c)

			if tt.wantStatusCode == http.StatusUnauthorized {
				if err == nil {
					t.Errorf("expected error but got none")
					return
				}
				return
			}

			if err != nil {
				t.Errorf("unexpected error: %v", err)
				return
			}

			if rec.Code != tt.wantStatusCode {
				t.Errorf("expected status code %d, got %d", tt.wantStatusCode, rec.Code)
			}

			if tt.wantCount > 0 {
				var leaves []*models.LeaveRequest
				json.Unmarshal(rec.Body.Bytes(), &leaves)
				if len(leaves) != tt.wantCount {
					t.Errorf("expected %d leaves, got %d", tt.wantCount, len(leaves))
				}
			}
		})
	}
}

func TestLeaveHandler_GetLeaveRequest(t *testing.T) {
	handler, repo := setupTestHandler()

	leaveID := uuid.New()
	leave := &models.LeaveRequest{
		ID:            leaveID,
		EmployeeID:    "emp-1",
		EmployeeName:  "John Doe",
		EmployeeEmail: "john@example.com",
		LeaveType:     models.LeaveTypeAnnual,
		Reason:        "Vacation",
		StartDate:     time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC),
		EndDate:       time.Date(2024, 1, 5, 0, 0, 0, 0, time.UTC),
		Days:          5,
		Status:        models.LeaveStatusPending,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}
	repo.Create(leave)

	tests := []struct {
		name           string
		id             string
		setupContext   func(echo.Context)
		wantStatusCode int
	}{
		{
			name: "get existing leave request",
			id:   leaveID.String(),
			setupContext: func(c echo.Context) {
				c.Set("userID", "emp-1")
			},
			wantStatusCode: http.StatusOK,
		},
		{
			name: "get non-existent leave request",
			id:   uuid.New().String(),
			setupContext: func(c echo.Context) {
				c.Set("userID", "emp-1")
			},
			wantStatusCode: http.StatusNotFound,
		},
		{
			name: "unauthorized access",
			id:   leaveID.String(),
			setupContext: func(c echo.Context) {
				c.Set("userID", "emp-2") // Different employee
			},
			wantStatusCode: http.StatusForbidden,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			c, rec := setupEchoContext(http.MethodGet, "/api/v1/leave/:id", nil)
			c.SetParamNames("id")
			c.SetParamValues(tt.id)
			tt.setupContext(c)

			err := handler.GetLeaveRequest(c)

			if tt.wantStatusCode >= 400 {
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

			if rec.Code != tt.wantStatusCode {
				t.Errorf("expected status code %d, got %d", tt.wantStatusCode, rec.Code)
			}
		})
	}
}

func TestLeaveHandler_UpdateLeaveRequest(t *testing.T) {
	handler, repo := setupTestHandler()

	leaveID := uuid.New()
	leave := &models.LeaveRequest{
		ID:            leaveID,
		EmployeeID:    "emp-1",
		Status:        models.LeaveStatusPending,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}
	repo.Create(leave)

	tests := []struct {
		name           string
		id             string
		body           interface{}
		setupContext   func(echo.Context)
		wantStatusCode int
	}{
		{
			name: "update reason",
			id:   leaveID.String(),
			body: map[string]interface{}{
				"reason": "Updated vacation reason",
			},
			setupContext: func(c echo.Context) {
				c.Set("userID", "emp-1")
			},
			wantStatusCode: http.StatusOK,
		},
		{
			name: "unauthorized update",
			id:   leaveID.String(),
			body: map[string]interface{}{
				"reason": "Updated reason",
			},
			setupContext: func(c echo.Context) {
				c.Set("userID", "emp-2") // Different employee
			},
			wantStatusCode: http.StatusForbidden,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Reset status to pending
			leave.Status = models.LeaveStatusPending
			repo.Update(leave)

			c, rec := setupEchoContext(http.MethodPut, "/api/v1/leave/:id", tt.body)
			c.SetParamNames("id")
			c.SetParamValues(tt.id)
			tt.setupContext(c)

			err := handler.UpdateLeaveRequest(c)

			if tt.wantStatusCode >= 400 {
				if err == nil {
					t.Errorf("expected error but got none")
					return
				}
				return
			}

			if err != nil {
				t.Errorf("unexpected error: %v", err)
				return
			}

			if rec.Code != tt.wantStatusCode {
				t.Errorf("expected status code %d, got %d", tt.wantStatusCode, rec.Code)
			}
		})
	}
}

func TestLeaveHandler_CancelLeaveRequest(t *testing.T) {
	handler, repo := setupTestHandler()

	leaveID := uuid.New()
	leave := &models.LeaveRequest{
		ID:            leaveID,
		EmployeeID:    "emp-1",
		Status:        models.LeaveStatusPending,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}
	repo.Create(leave)

	tests := []struct {
		name           string
		id             string
		setupContext   func(echo.Context)
		wantStatusCode int
	}{
		{
			name: "cancel pending request",
			id:   leaveID.String(),
			setupContext: func(c echo.Context) {
				c.Set("userID", "emp-1")
			},
			wantStatusCode: http.StatusNoContent,
		},
		{
			name: "unauthorized cancel",
			id:   leaveID.String(),
			setupContext: func(c echo.Context) {
				c.Set("userID", "emp-2")
			},
			wantStatusCode: http.StatusForbidden,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Reset status to pending
			leave.Status = models.LeaveStatusPending
			repo.Update(leave)

			c, rec := setupEchoContext(http.MethodDelete, "/api/v1/leave/:id", nil)
			c.SetParamNames("id")
			c.SetParamValues(tt.id)
			tt.setupContext(c)

			err := handler.CancelLeaveRequest(c)

			if tt.wantStatusCode >= 400 {
				if err == nil {
					t.Errorf("expected error but got none")
					return
				}
				return
			}

			if err != nil {
				t.Errorf("unexpected error: %v", err)
				return
			}

			if rec.Code != tt.wantStatusCode {
				t.Errorf("expected status code %d, got %d", tt.wantStatusCode, rec.Code)
			}
		})
	}
}

