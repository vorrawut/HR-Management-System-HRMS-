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
	"leave-management-system/internal/config"
	"leave-management-system/internal/models"
	"leave-management-system/internal/repository"
	"leave-management-system/internal/services"
)

func setupTestManagerHandler() (*ManagerHandler, *repository.MockLeaveRepository) {
	repo := repository.NewMockLeaveRepository()
	leaveService := services.NewLeaveService(repo)
	emailService := services.NewEmailService(&config.Config{})
	handler := NewManagerHandler(leaveService, emailService)
	return handler, repo
}

func setupEchoContextForManager(method, path string, body interface{}) (echo.Context, *httptest.ResponseRecorder) {
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

func TestManagerHandler_GetPendingLeaveRequests(t *testing.T) {
	handler, repo := setupTestManagerHandler()

	// Create test data
	leave1 := &models.LeaveRequest{
		ID:            uuid.New(),
		EmployeeID:    "emp-1",
		Status:        models.LeaveStatusPending,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}
	leave2 := &models.LeaveRequest{
		ID:            uuid.New(),
		EmployeeID:    "emp-2",
		Status:        models.LeaveStatusPending,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}
	leave3 := &models.LeaveRequest{
		ID:            uuid.New(),
		EmployeeID:    "emp-3",
		Status:        models.LeaveStatusApproved,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	repo.Create(leave1)
	repo.Create(leave2)
	repo.Create(leave3)

	c, rec := setupEchoContextForManager(http.MethodGet, "/api/v1/manager/leave", nil)

	err := handler.GetPendingLeaveRequests(c)

	if err != nil {
		t.Errorf("unexpected error: %v", err)
		return
	}

	if rec.Code != http.StatusOK {
		t.Errorf("expected status code %d, got %d", http.StatusOK, rec.Code)
		return
	}

	var leaves []*models.LeaveRequest
	if err := json.Unmarshal(rec.Body.Bytes(), &leaves); err != nil {
		t.Errorf("failed to unmarshal response: %v", err)
		return
	}

	// Should only return pending leaves
	if len(leaves) != 2 {
		t.Errorf("expected 2 pending leaves, got %d", len(leaves))
	}

	for _, leave := range leaves {
		if leave.Status != models.LeaveStatusPending {
			t.Errorf("expected status %q, got %q", models.LeaveStatusPending, leave.Status)
		}
	}
}

func TestManagerHandler_ApproveLeaveRequest(t *testing.T) {
	handler, repo := setupTestManagerHandler()

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
		wantStatusCode int
		wantErr        bool
	}{
		{
			name: "approve with comment",
			id:   leaveID.String(),
			body: map[string]interface{}{
				"comment": "Approved!",
			},
			wantStatusCode: http.StatusOK,
			wantErr:        false,
		},
		{
			name: "approve without comment",
			id:   leaveID.String(),
			body: map[string]interface{}{
				"comment": "",
			},
			wantStatusCode: http.StatusOK,
			wantErr:        false,
		},
		{
			name: "approve non-existent request",
			id:   uuid.New().String(),
			body: map[string]interface{}{
				"comment": "Approved",
			},
			wantStatusCode: http.StatusNotFound,
			wantErr:        true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Reset status to pending
			leave.Status = models.LeaveStatusPending
			repo.Update(leave)

			c, rec := setupEchoContextForManager(http.MethodPut, "/api/v1/manager/leave/:id/approve", tt.body)
			c.SetParamNames("id")
			c.SetParamValues(tt.id)

			err := handler.ApproveLeaveRequest(c)

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

			// Verify status was updated
			if !tt.wantErr {
				var updated models.LeaveRequest
				json.Unmarshal(rec.Body.Bytes(), &updated)
				if updated.Status != models.LeaveStatusApproved {
					t.Errorf("expected status %q, got %q", models.LeaveStatusApproved, updated.Status)
				}
			}
		})
	}
}

func TestManagerHandler_RejectLeaveRequest(t *testing.T) {
	handler, repo := setupTestManagerHandler()

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
		wantStatusCode int
		wantErr        bool
	}{
		{
			name: "reject with valid comment",
			id:   leaveID.String(),
			body: map[string]interface{}{
				"comment": "Not enough leave balance available",
			},
			wantStatusCode: http.StatusOK,
			wantErr:        false,
		},
		{
			name: "reject with empty comment",
			id:   leaveID.String(),
			body: map[string]interface{}{
				"comment": "",
			},
			wantStatusCode: http.StatusBadRequest,
			wantErr:        true,
		},
		{
			name: "reject with short comment",
			id:   leaveID.String(),
			body: map[string]interface{}{
				"comment": "Short",
			},
			wantStatusCode: http.StatusBadRequest,
			wantErr:        true,
		},
		{
			name: "reject non-existent request",
			id:   uuid.New().String(),
			body: map[string]interface{}{
				"comment": "Not enough leave balance",
			},
			wantStatusCode: http.StatusNotFound,
			wantErr:        true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Reset status to pending
			leave.Status = models.LeaveStatusPending
			repo.Update(leave)

			c, rec := setupEchoContextForManager(http.MethodPut, "/api/v1/manager/leave/:id/reject", tt.body)
			c.SetParamNames("id")
			c.SetParamValues(tt.id)

			err := handler.RejectLeaveRequest(c)

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

			// Verify status was updated
			var updated models.LeaveRequest
			json.Unmarshal(rec.Body.Bytes(), &updated)
			if updated.Status != models.LeaveStatusRejected {
				t.Errorf("expected status %q, got %q", models.LeaveStatusRejected, updated.Status)
			}
		})
	}
}

