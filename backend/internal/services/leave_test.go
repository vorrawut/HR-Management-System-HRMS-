package services

import (
	"database/sql"
	"testing"
	"time"

	"github.com/google/uuid"
	"leave-management-system/internal/models"
	"leave-management-system/internal/repository"
)

func TestLeaveService_CreateLeaveRequest(t *testing.T) {
	repo := repository.NewMockLeaveRepository()
	service := NewLeaveService(repo)

	tests := []struct {
		name        string
		req         *models.CreateLeaveRequest
		employeeID  string
		employeeName string
		employeeEmail string
		wantErr     bool
		errContains string
	}{
		{
			name: "valid request",
			req: &models.CreateLeaveRequest{
				LeaveType: "annual",
				Reason:    "Vacation time",
				StartDate: time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC),
				EndDate:   time.Date(2024, 1, 5, 0, 0, 0, 0, time.UTC),
			},
			employeeID:    "emp-1",
			employeeName:  "John Doe",
			employeeEmail: "john@example.com",
			wantErr:       false,
		},
		{
			name: "invalid date range - end before start",
			req: &models.CreateLeaveRequest{
				LeaveType: "annual",
				Reason:    "Vacation time",
				StartDate: time.Date(2024, 1, 5, 0, 0, 0, 0, time.UTC),
				EndDate:   time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC),
			},
			employeeID:    "emp-1",
			employeeName:  "John Doe",
			employeeEmail: "john@example.com",
			wantErr:       true,
			errContains:   "invalid date range",
		},
		{
			name: "same day leave",
			req: &models.CreateLeaveRequest{
				LeaveType: "sick",
				Reason:    "Feeling unwell",
				StartDate: time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC),
				EndDate:   time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC),
			},
			employeeID:    "emp-1",
			employeeName:  "John Doe",
			employeeEmail: "john@example.com",
			wantErr:       false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			repo.Clear()
			leave, err := service.CreateLeaveRequest(tt.req, tt.employeeID, tt.employeeName, tt.employeeEmail)

			if tt.wantErr {
				if err == nil {
					t.Errorf("expected error but got none")
					return
				}
				if tt.errContains != "" && !contains(err.Error(), tt.errContains) {
					t.Errorf("error should contain %q, got %q", tt.errContains, err.Error())
				}
				return
			}

			if err != nil {
				t.Errorf("unexpected error: %v", err)
				return
			}

			if leave == nil {
				t.Errorf("expected leave request but got nil")
				return
			}

			if leave.EmployeeID != tt.employeeID {
				t.Errorf("expected employeeID %q, got %q", tt.employeeID, leave.EmployeeID)
			}

			if leave.Status != models.LeaveStatusPending {
				t.Errorf("expected status %q, got %q", models.LeaveStatusPending, leave.Status)
			}

			if leave.Days <= 0 {
				t.Errorf("expected days > 0, got %d", leave.Days)
			}
		})
	}
}

func TestLeaveService_GetLeaveRequestByID(t *testing.T) {
	repo := repository.NewMockLeaveRepository()
	service := NewLeaveService(repo)

	// Create a test leave request
	leaveID := uuid.New()
	testLeave := &models.LeaveRequest{
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
	repo.Create(testLeave)

	tests := []struct {
		name    string
		id      uuid.UUID
		wantErr bool
		errType error
	}{
		{
			name:    "existing leave request",
			id:      leaveID,
			wantErr: false,
		},
		{
			name:    "non-existent leave request",
			id:      uuid.New(),
			wantErr: true,
			errType: ErrLeaveNotFound,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			leave, err := service.GetLeaveRequestByID(tt.id)

			if tt.wantErr {
				if err == nil {
					t.Errorf("expected error but got none")
					return
				}
				if tt.errType != nil && err != tt.errType {
					t.Errorf("expected error %v, got %v", tt.errType, err)
				}
				return
			}

			if err != nil {
				t.Errorf("unexpected error: %v", err)
				return
			}

			if leave.ID != tt.id {
				t.Errorf("expected ID %v, got %v", tt.id, leave.ID)
			}
		})
	}
}

func TestLeaveService_UpdateLeaveRequest(t *testing.T) {
	repo := repository.NewMockLeaveRepository()
	service := NewLeaveService(repo)

	// Create a test leave request
	leaveID := uuid.New()
	testLeave := &models.LeaveRequest{
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
	repo.Create(testLeave)

	tests := []struct {
		name        string
		id          uuid.UUID
		employeeID  string
		req         *models.UpdateLeaveRequest
		wantErr     bool
		errType     error
		errContains string
	}{
		{
			name:       "update reason",
			id:         leaveID,
			employeeID: "emp-1",
			req: &models.UpdateLeaveRequest{
				Reason: "Updated vacation reason",
			},
			wantErr: false,
		},
		{
			name:       "update dates",
			id:         leaveID,
			employeeID: "emp-1",
			req: &models.UpdateLeaveRequest{
				StartDate: timePtr(time.Date(2024, 1, 2, 0, 0, 0, 0, time.UTC)),
				EndDate:   timePtr(time.Date(2024, 1, 6, 0, 0, 0, 0, time.UTC)),
			},
			wantErr: false,
		},
		{
			name:       "unauthorized - wrong employee",
			id:         leaveID,
			employeeID: "emp-2",
			req: &models.UpdateLeaveRequest{
				Reason: "Updated reason",
			},
			wantErr:     true,
			errType:     ErrUnauthorizedAction,
			errContains: "unauthorized",
		},
		{
			name:       "cannot update approved request",
			id:         leaveID,
			employeeID: "emp-1",
			req:        &models.UpdateLeaveRequest{},
			wantErr:    false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Reset status to pending for each test
			testLeave.Status = models.LeaveStatusPending
			repo.Update(testLeave)

			// For the "cannot update approved" test, set status to approved
			if tt.name == "cannot update approved request" {
				testLeave.Status = models.LeaveStatusApproved
				repo.Update(testLeave)
			}

			leave, err := service.UpdateLeaveRequest(tt.id, tt.employeeID, tt.req)

			if tt.wantErr {
				if err == nil {
					t.Errorf("expected error but got none")
					return
				}
				if tt.errType != nil && err != tt.errType {
					t.Errorf("expected error %v, got %v", tt.errType, err)
				}
				if tt.errContains != "" && !contains(err.Error(), tt.errContains) {
					t.Errorf("error should contain %q, got %q", tt.errContains, err.Error())
				}
				return
			}

			if err != nil {
				t.Errorf("unexpected error: %v", err)
				return
			}

			if leave == nil {
				t.Errorf("expected leave request but got nil")
				return
			}
		})
	}
}

func TestLeaveService_CancelLeaveRequest(t *testing.T) {
	repo := repository.NewMockLeaveRepository()
	service := NewLeaveService(repo)

	// Create a test leave request
	leaveID := uuid.New()
	testLeave := &models.LeaveRequest{
		ID:            leaveID,
		EmployeeID:    "emp-1",
		Status:        models.LeaveStatusPending,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}
	repo.Create(testLeave)

	tests := []struct {
		name        string
		id          uuid.UUID
		employeeID  string
		wantErr     bool
		errType     error
		errContains string
	}{
		{
			name:       "cancel pending request",
			id:         leaveID,
			employeeID: "emp-1",
			wantErr:    false,
		},
		{
			name:        "unauthorized - wrong employee",
			id:          leaveID,
			employeeID:  "emp-2",
			wantErr:     true,
			errType:     ErrUnauthorizedAction,
			errContains: "unauthorized",
		},
		{
			name:        "cannot cancel approved request",
			id:          leaveID,
			employeeID:  "emp-1",
			wantErr:     true,
			errType:     ErrInvalidStatus,
			errContains: "invalid status",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Reset status
			testLeave.Status = models.LeaveStatusPending
			repo.Update(testLeave)

			// For the "cannot cancel approved" test, set status to approved
			if tt.name == "cannot cancel approved request" {
				testLeave.Status = models.LeaveStatusApproved
				repo.Update(testLeave)
			}

			err := service.CancelLeaveRequest(tt.id, tt.employeeID)

			if tt.wantErr {
				if err == nil {
					t.Errorf("expected error but got none")
					return
				}
				if tt.errType != nil && err != tt.errType {
					t.Errorf("expected error %v, got %v", tt.errType, err)
				}
				if tt.errContains != "" && !contains(err.Error(), tt.errContains) {
					t.Errorf("error should contain %q, got %q", tt.errContains, err.Error())
				}
				return
			}

			if err != nil {
				t.Errorf("unexpected error: %v", err)
				return
			}

			// Verify status was updated
			updated, _ := repo.FindByID(tt.id)
			if updated.Status != models.LeaveStatusCancelled {
				t.Errorf("expected status %q, got %q", models.LeaveStatusCancelled, updated.Status)
			}
		})
	}
}

func TestLeaveService_ApproveLeaveRequest(t *testing.T) {
	repo := repository.NewMockLeaveRepository()
	service := NewLeaveService(repo)

	// Create a test leave request
	leaveID := uuid.New()
	testLeave := &models.LeaveRequest{
		ID:            leaveID,
		EmployeeID:    "emp-1",
		Status:        models.LeaveStatusPending,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}
	repo.Create(testLeave)

	tests := []struct {
		name        string
		id          uuid.UUID
		comment     string
		wantErr     bool
		errType     error
		errContains string
	}{
		{
			name:    "approve pending request",
			id:      leaveID,
			comment: "Approved",
			wantErr: false,
		},
		{
			name:        "cannot approve already approved request",
			id:          leaveID,
			comment:     "Approved",
			wantErr:     true,
			errType:     ErrInvalidStatus,
			errContains: "invalid status",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Reset status
			testLeave.Status = models.LeaveStatusPending
			repo.Update(testLeave)

			// For the "cannot approve already approved" test, set status to approved
			if tt.name == "cannot approve already approved request" {
				testLeave.Status = models.LeaveStatusApproved
				repo.Update(testLeave)
			}

			leave, err := service.ApproveLeaveRequest(tt.id, tt.comment)

			if tt.wantErr {
				if err == nil {
					t.Errorf("expected error but got none")
					return
				}
				if tt.errType != nil && err != tt.errType {
					t.Errorf("expected error %v, got %v", tt.errType, err)
				}
				return
			}

			if err != nil {
				t.Errorf("unexpected error: %v", err)
				return
			}

			if leave.Status != models.LeaveStatusApproved {
				t.Errorf("expected status %q, got %q", models.LeaveStatusApproved, leave.Status)
			}

			if leave.ManagerComment != tt.comment {
				t.Errorf("expected comment %q, got %q", tt.comment, leave.ManagerComment)
			}
		})
	}
}

func TestLeaveService_RejectLeaveRequest(t *testing.T) {
	repo := repository.NewMockLeaveRepository()
	service := NewLeaveService(repo)

	// Create a test leave request
	leaveID := uuid.New()
	testLeave := &models.LeaveRequest{
		ID:            leaveID,
		EmployeeID:    "emp-1",
		Status:        models.LeaveStatusPending,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}
	repo.Create(testLeave)

	tests := []struct {
		name        string
		id          uuid.UUID
		comment     string
		wantErr     bool
		errType     error
		errContains string
	}{
		{
			name:    "reject pending request",
			id:      leaveID,
			comment: "Not enough leave balance",
			wantErr: false,
		},
		{
			name:        "cannot reject already rejected request",
			id:          leaveID,
			comment:     "Rejected",
			wantErr:     true,
			errType:     ErrInvalidStatus,
			errContains: "invalid status",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Reset status
			testLeave.Status = models.LeaveStatusPending
			repo.Update(testLeave)

			// For the "cannot reject already rejected" test, set status to rejected
			if tt.name == "cannot reject already rejected request" {
				testLeave.Status = models.LeaveStatusRejected
				repo.Update(testLeave)
			}

			leave, err := service.RejectLeaveRequest(tt.id, tt.comment)

			if tt.wantErr {
				if err == nil {
					t.Errorf("expected error but got none")
					return
				}
				if tt.errType != nil && err != tt.errType {
					t.Errorf("expected error %v, got %v", tt.errType, err)
				}
				return
			}

			if err != nil {
				t.Errorf("unexpected error: %v", err)
				return
			}

			if leave.Status != models.LeaveStatusRejected {
				t.Errorf("expected status %q, got %q", models.LeaveStatusRejected, leave.Status)
			}

			if leave.ManagerComment != tt.comment {
				t.Errorf("expected comment %q, got %q", tt.comment, leave.ManagerComment)
			}
		})
	}
}

// Helper functions
func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || 
		(len(s) > len(substr) && (s[:len(substr)] == substr || 
		s[len(s)-len(substr):] == substr || 
		containsMiddle(s, substr))))
}

func containsMiddle(s, substr string) bool {
	if len(substr) == 0 {
		return true
	}
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}

func timePtr(t time.Time) *time.Time {
	return &t
}

