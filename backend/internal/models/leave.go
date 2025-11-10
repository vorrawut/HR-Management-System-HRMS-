package models

import (
	"database/sql"
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

// LeaveType represents the type of leave
type LeaveType string

const (
	LeaveTypeAnnual   LeaveType = "annual"
	LeaveTypeSick     LeaveType = "sick"
	LeaveTypePersonal LeaveType = "personal"
	LeaveTypeOther    LeaveType = "other"
)

// LeaveStatus represents the status of a leave request
type LeaveStatus string

const (
	LeaveStatusPending   LeaveStatus = "pending"
	LeaveStatusApproved  LeaveStatus = "approved"
	LeaveStatusRejected  LeaveStatus = "rejected"
	LeaveStatusCancelled LeaveStatus = "cancelled"
)

// LeaveRequest represents a leave request in the database
type LeaveRequest struct {
	ID             uuid.UUID      `json:"id" db:"id"`
	EmployeeID     string          `json:"employeeId" db:"employee_id"`
	EmployeeName   string          `json:"employeeName" db:"employee_name"`
	EmployeeEmail  string          `json:"employeeEmail" db:"employee_email"`
	LeaveType      LeaveType       `json:"leaveType" db:"leave_type"`
	Reason         string          `json:"reason" db:"reason"`
	StartDate      time.Time       `json:"startDate" db:"start_date"`
	EndDate        time.Time       `json:"endDate" db:"end_date"`
	Days           int             `json:"days" db:"days"`
	Status         LeaveStatus     `json:"status" db:"status"`
	ManagerComment sql.NullString  `json:"-" db:"manager_comment"` // Use custom MarshalJSON
	CreatedAt      time.Time       `json:"createdAt" db:"created_at"`
	UpdatedAt      time.Time       `json:"updatedAt" db:"updated_at"`
}

// LeaveRequestJSON is used for JSON serialization with proper manager comment handling
type LeaveRequestJSON struct {
	ID             uuid.UUID   `json:"id"`
	EmployeeID     string      `json:"employeeId"`
	EmployeeName   string      `json:"employeeName"`
	EmployeeEmail  string      `json:"employeeEmail"`
	LeaveType      LeaveType   `json:"leaveType"`
	Reason         string      `json:"reason"`
	StartDate      time.Time   `json:"startDate"`
	EndDate        time.Time   `json:"endDate"`
	Days           int         `json:"days"`
	Status         LeaveStatus `json:"status"`
	ManagerComment string      `json:"managerComment,omitempty"`
	CreatedAt      time.Time   `json:"createdAt"`
	UpdatedAt      time.Time   `json:"updatedAt"`
}

// MarshalJSON customizes JSON serialization to handle nullable manager comment
func (l *LeaveRequest) MarshalJSON() ([]byte, error) {
	jsonData := LeaveRequestJSON{
		ID:            l.ID,
		EmployeeID:    l.EmployeeID,
		EmployeeName:  l.EmployeeName,
		EmployeeEmail: l.EmployeeEmail,
		LeaveType:     l.LeaveType,
		Reason:        l.Reason,
		StartDate:     l.StartDate,
		EndDate:       l.EndDate,
		Days:          l.Days,
		Status:        l.Status,
		CreatedAt:     l.CreatedAt,
		UpdatedAt:     l.UpdatedAt,
	}
	
	if l.ManagerComment.Valid {
		jsonData.ManagerComment = l.ManagerComment.String
	}
	
	// Use standard JSON encoding
	type Alias LeaveRequestJSON
	return json.Marshal((*Alias)(&jsonData))
}

// GetManagerComment returns the manager comment as a string, or empty string if NULL
func (l *LeaveRequest) GetManagerComment() string {
	if l.ManagerComment.Valid {
		return l.ManagerComment.String
	}
	return ""
}

// CreateLeaveRequest represents the payload for creating a leave request
type CreateLeaveRequest struct {
	LeaveType string    `json:"leaveType" validate:"required,oneof=annual sick personal other"`
	Reason    string    `json:"reason" validate:"required,min=10"`
	StartDate time.Time `json:"startDate" validate:"required"`
	EndDate   time.Time `json:"endDate" validate:"required,gtfield=StartDate"`
}

// UpdateLeaveRequest represents the payload for updating a leave request
type UpdateLeaveRequest struct {
	LeaveType string     `json:"leaveType" validate:"omitempty,oneof=annual sick personal other"`
	Reason    string     `json:"reason" validate:"omitempty,min=10"`
	StartDate *time.Time `json:"startDate" validate:"omitempty"`
	EndDate   *time.Time `json:"endDate" validate:"omitempty,gtfield=StartDate"`
}

// ApproveLeaveRequest represents the payload for approving a leave request
type ApproveLeaveRequest struct {
	Comment string `json:"comment"`
}

// RejectLeaveRequest represents the payload for rejecting a leave request
type RejectLeaveRequest struct {
	Comment string `json:"comment" validate:"required,min=10"`
}

// CalculateDays calculates the number of leave days between start and end date
// Excludes weekends (Saturday and Sunday)
func CalculateDays(startDate, endDate time.Time) int {
	// Include both start and end dates
	days := 0
	currentDate := startDate

	for !currentDate.After(endDate) {
		weekday := currentDate.Weekday()
		// Count only weekdays (Monday = 1, Friday = 5)
		if weekday != time.Saturday && weekday != time.Sunday {
			days++
		}
		currentDate = currentDate.AddDate(0, 0, 1)
	}

	return days
}
