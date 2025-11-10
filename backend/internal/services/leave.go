package services

import (
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"leave-management-system/internal/models"
	"leave-management-system/internal/repository"
)

var (
	ErrLeaveNotFound      = errors.New("leave request not found")
	ErrUnauthorizedAction = errors.New("unauthorized action")
	ErrInvalidStatus      = errors.New("invalid status transition")
)

// LeaveService handles business logic for leave requests
type LeaveService struct {
	repo repository.LeaveRepository
}

// NewLeaveService creates a new leave service
func NewLeaveService(repo repository.LeaveRepository) *LeaveService {
	return &LeaveService{
		repo: repo,
	}
}

// CreateLeaveRequest creates a new leave request
func (s *LeaveService) CreateLeaveRequest(req *models.CreateLeaveRequest, employeeID, employeeName, employeeEmail string) (*models.LeaveRequest, error) {
	// Calculate leave days (excluding weekends)
	days := models.CalculateDays(req.StartDate, req.EndDate)
	if days <= 0 {
		return nil, errors.New("invalid date range")
	}

	leaveRequest := &models.LeaveRequest{
		ID:             uuid.New(),
		EmployeeID:     employeeID,
		EmployeeName:   employeeName,
		EmployeeEmail:  employeeEmail,
		LeaveType:      models.LeaveType(req.LeaveType),
		Reason:         req.Reason,
		StartDate:      req.StartDate,
		EndDate:        req.EndDate,
		Days:           days,
		Status:         models.LeaveStatusPending,
		ManagerComment: sql.NullString{Valid: false}, // NULL for new requests
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	if err := s.repo.Create(leaveRequest); err != nil {
		return nil, fmt.Errorf("failed to create leave request: %w", err)
	}

	return leaveRequest, nil
}

// GetLeaveRequestsByEmployeeID gets all leave requests for an employee
func (s *LeaveService) GetLeaveRequestsByEmployeeID(employeeID string) ([]*models.LeaveRequest, error) {
	requests, err := s.repo.FindByEmployeeID(employeeID)
	if err != nil {
		return nil, fmt.Errorf("failed to query leave requests: %w", err)
	}
	return requests, nil
}

// GetLeaveRequestByID gets a leave request by ID
func (s *LeaveService) GetLeaveRequestByID(id uuid.UUID) (*models.LeaveRequest, error) {
	req, err := s.repo.FindByID(id)
	if err == sql.ErrNoRows {
		return nil, ErrLeaveNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get leave request: %w", err)
	}
	return req, nil
}

// UpdateLeaveRequest updates a leave request (only if pending)
func (s *LeaveService) UpdateLeaveRequest(id uuid.UUID, employeeID string, req *models.UpdateLeaveRequest) (*models.LeaveRequest, error) {
	// Get existing request
	existing, err := s.GetLeaveRequestByID(id)
	if err != nil {
		return nil, err
	}

	// Verify ownership
	if existing.EmployeeID != employeeID {
		return nil, ErrUnauthorizedAction
	}

	// Only allow updates if status is pending
	if existing.Status != models.LeaveStatusPending {
		return nil, fmt.Errorf("%w: cannot update %s request", ErrInvalidStatus, existing.Status)
	}

	// Update fields if provided
	updated := *existing
	if req.LeaveType != "" {
		updated.LeaveType = models.LeaveType(req.LeaveType)
	}
	if req.Reason != "" {
		updated.Reason = req.Reason
	}
	if req.StartDate != nil {
		updated.StartDate = *req.StartDate
	}
	if req.EndDate != nil {
		updated.EndDate = *req.EndDate
	}

	// Recalculate days if dates changed
	if req.StartDate != nil || req.EndDate != nil {
		updated.Days = models.CalculateDays(updated.StartDate, updated.EndDate)
		if updated.Days <= 0 {
			return nil, errors.New("invalid date range")
		}
	}

	// Check if anything changed
	if req.LeaveType == "" && req.Reason == "" && req.StartDate == nil && req.EndDate == nil {
		return existing, nil
	}

	if err := s.repo.Update(&updated); err != nil {
		return nil, fmt.Errorf("failed to update leave request: %w", err)
	}

	return &updated, nil
}

// CancelLeaveRequest cancels a leave request (only if pending)
func (s *LeaveService) CancelLeaveRequest(id uuid.UUID, employeeID string) error {
	// Get existing request
	existing, err := s.GetLeaveRequestByID(id)
	if err != nil {
		return err
	}

	// Verify ownership
	if existing.EmployeeID != employeeID {
		return ErrUnauthorizedAction
	}

	// Only allow cancellation if status is pending
	if existing.Status != models.LeaveStatusPending {
		return fmt.Errorf("%w: cannot cancel %s request", ErrInvalidStatus, existing.Status)
	}

	if err := s.repo.UpdateStatus(id, models.LeaveStatusCancelled, ""); err != nil {
		return fmt.Errorf("failed to cancel leave request: %w", err)
	}

	return nil
}

// GetPendingLeaveRequests gets all pending leave requests (for managers)
func (s *LeaveService) GetPendingLeaveRequests() ([]*models.LeaveRequest, error) {
	requests, err := s.repo.FindPending()
	if err != nil {
		return nil, fmt.Errorf("failed to query pending leave requests: %w", err)
	}
	return requests, nil
}

// ApproveLeaveRequest approves a leave request
func (s *LeaveService) ApproveLeaveRequest(id uuid.UUID, comment string) (*models.LeaveRequest, error) {
	// Get existing request
	existing, err := s.GetLeaveRequestByID(id)
	if err != nil {
		return nil, err
	}

	// Only allow approval if status is pending
	if existing.Status != models.LeaveStatusPending {
		return nil, fmt.Errorf("%w: cannot approve %s request", ErrInvalidStatus, existing.Status)
	}

	if err := s.repo.UpdateStatus(id, models.LeaveStatusApproved, comment); err != nil {
		return nil, fmt.Errorf("failed to approve leave request: %w", err)
	}

	// Fetch the updated request
	updated, err := s.repo.FindByID(id)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch updated leave request: %w", err)
	}

	return updated, nil
}

// RejectLeaveRequest rejects a leave request
func (s *LeaveService) RejectLeaveRequest(id uuid.UUID, comment string) (*models.LeaveRequest, error) {
	// Get existing request
	existing, err := s.GetLeaveRequestByID(id)
	if err != nil {
		return nil, err
	}

	// Only allow rejection if status is pending
	if existing.Status != models.LeaveStatusPending {
		return nil, fmt.Errorf("%w: cannot reject %s request", ErrInvalidStatus, existing.Status)
	}

	if err := s.repo.UpdateStatus(id, models.LeaveStatusRejected, comment); err != nil {
		return nil, fmt.Errorf("failed to reject leave request: %w", err)
	}

	// Fetch the updated request
	updated, err := s.repo.FindByID(id)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch updated leave request: %w", err)
	}

	return updated, nil
}
