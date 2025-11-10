package repository

import (
	"database/sql"
	"time"

	"github.com/google/uuid"
	"leave-management-system/internal/models"
)

// MockLeaveRepository is a mock implementation of LeaveRepository for testing
type MockLeaveRepository struct {
	leaves map[uuid.UUID]*models.LeaveRequest
}

// NewMockLeaveRepository creates a new mock repository
func NewMockLeaveRepository() *MockLeaveRepository {
	return &MockLeaveRepository{
		leaves: make(map[uuid.UUID]*models.LeaveRequest),
	}
}

// Create inserts a new leave request
func (m *MockLeaveRepository) Create(leave *models.LeaveRequest) error {
	m.leaves[leave.ID] = leave
	return nil
}

// FindByID finds a leave request by ID
func (m *MockLeaveRepository) FindByID(id uuid.UUID) (*models.LeaveRequest, error) {
	leave, exists := m.leaves[id]
	if !exists {
		return nil, sql.ErrNoRows
	}
	return leave, nil
}

// FindByEmployeeID finds all leave requests for an employee
func (m *MockLeaveRepository) FindByEmployeeID(employeeID string) ([]*models.LeaveRequest, error) {
	var result []*models.LeaveRequest
	for _, leave := range m.leaves {
		if leave.EmployeeID == employeeID {
			result = append(result, leave)
		}
	}
	return result, nil
}

// FindPending finds all pending leave requests
func (m *MockLeaveRepository) FindPending() ([]*models.LeaveRequest, error) {
	var result []*models.LeaveRequest
	for _, leave := range m.leaves {
		if leave.Status == models.LeaveStatusPending {
			result = append(result, leave)
		}
	}
	return result, nil
}

// Update updates a leave request
func (m *MockLeaveRepository) Update(leave *models.LeaveRequest) error {
	if _, exists := m.leaves[leave.ID]; !exists {
		return sql.ErrNoRows
	}
	leave.UpdatedAt = time.Now()
	m.leaves[leave.ID] = leave
	return nil
}

// UpdateStatus updates the status and comment of a leave request
func (m *MockLeaveRepository) UpdateStatus(id uuid.UUID, status models.LeaveStatus, comment string) error {
	leave, exists := m.leaves[id]
	if !exists {
		return sql.ErrNoRows
	}
	leave.Status = status
	leave.ManagerComment = comment
	leave.UpdatedAt = time.Now()
	return nil
}

// Clear clears all mock data
func (m *MockLeaveRepository) Clear() {
	m.leaves = make(map[uuid.UUID]*models.LeaveRequest)
}

