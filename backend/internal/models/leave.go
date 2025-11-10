package models

import (
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
	ID             uuid.UUID   `json:"id" db:"id"`
	EmployeeID     string      `json:"employeeId" db:"employee_id"`
	EmployeeName   string      `json:"employeeName" db:"employee_name"`
	EmployeeEmail  string      `json:"employeeEmail" db:"employee_email"`
	LeaveType      LeaveType   `json:"leaveType" db:"leave_type"`
	Reason         string      `json:"reason" db:"reason"`
	StartDate      time.Time   `json:"startDate" db:"start_date"`
	EndDate        time.Time   `json:"endDate" db:"end_date"`
	Days           int         `json:"days" db:"days"`
	Status         LeaveStatus `json:"status" db:"status"`
	ManagerComment string      `json:"managerComment,omitempty" db:"manager_comment"`
	CreatedAt      time.Time   `json:"createdAt" db:"created_at"`
	UpdatedAt      time.Time   `json:"updatedAt" db:"updated_at"`
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
