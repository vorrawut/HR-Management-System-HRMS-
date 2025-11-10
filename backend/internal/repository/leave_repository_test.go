package repository

import (
	"database/sql"
	"testing"
	"time"

	"github.com/google/uuid"
	"leave-management-system/internal/models"
)

func TestMockLeaveRepository(t *testing.T) {
	repo := NewMockLeaveRepository()

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

	t.Run("Create", func(t *testing.T) {
		err := repo.Create(leave)
		if err != nil {
			t.Errorf("unexpected error: %v", err)
		}
	})

	t.Run("FindByID", func(t *testing.T) {
		found, err := repo.FindByID(leaveID)
		if err != nil {
			t.Errorf("unexpected error: %v", err)
		}
		if found.ID != leaveID {
			t.Errorf("expected ID %v, got %v", leaveID, found.ID)
		}

		// Test non-existent ID
		_, err = repo.FindByID(uuid.New())
		if err != sql.ErrNoRows {
			t.Errorf("expected sql.ErrNoRows, got %v", err)
		}
	})

	t.Run("FindByEmployeeID", func(t *testing.T) {
		leaves, err := repo.FindByEmployeeID("emp-1")
		if err != nil {
			t.Errorf("unexpected error: %v", err)
		}
		if len(leaves) != 1 {
			t.Errorf("expected 1 leave, got %d", len(leaves))
		}

		// Test non-existent employee
		leaves, err = repo.FindByEmployeeID("emp-999")
		if err != nil {
			t.Errorf("unexpected error: %v", err)
		}
		if len(leaves) != 0 {
			t.Errorf("expected 0 leaves, got %d", len(leaves))
		}
	})

	t.Run("FindPending", func(t *testing.T) {
		leaves, err := repo.FindPending()
		if err != nil {
			t.Errorf("unexpected error: %v", err)
		}
		if len(leaves) != 1 {
			t.Errorf("expected 1 pending leave, got %d", len(leaves))
		}

		// Update status to approved
		leave.Status = models.LeaveStatusApproved
		repo.Update(leave)

		leaves, err = repo.FindPending()
		if err != nil {
			t.Errorf("unexpected error: %v", err)
		}
		if len(leaves) != 0 {
			t.Errorf("expected 0 pending leaves, got %d", len(leaves))
		}
	})

	t.Run("Update", func(t *testing.T) {
		leave.Reason = "Updated reason"
		err := repo.Update(leave)
		if err != nil {
			t.Errorf("unexpected error: %v", err)
		}

		updated, _ := repo.FindByID(leaveID)
		if updated.Reason != "Updated reason" {
			t.Errorf("expected reason %q, got %q", "Updated reason", updated.Reason)
		}
	})

	t.Run("UpdateStatus", func(t *testing.T) {
		err := repo.UpdateStatus(leaveID, models.LeaveStatusApproved, "Approved")
		if err != nil {
			t.Errorf("unexpected error: %v", err)
		}

		updated, _ := repo.FindByID(leaveID)
		if updated.Status != models.LeaveStatusApproved {
			t.Errorf("expected status %q, got %q", models.LeaveStatusApproved, updated.Status)
		}
		if updated.ManagerComment != "Approved" {
			t.Errorf("expected comment %q, got %q", "Approved", updated.ManagerComment)
		}
	})
}

