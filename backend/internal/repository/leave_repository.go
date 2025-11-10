package repository

import (
	"database/sql"
	"fmt"

	"github.com/google/uuid"
	"leave-management-system/internal/logger"
	"leave-management-system/internal/models"
)

// LeaveRepository defines the interface for leave data access
type LeaveRepository interface {
	Create(leave *models.LeaveRequest) error
	FindByID(id uuid.UUID) (*models.LeaveRequest, error)
	FindByEmployeeID(employeeID string) ([]*models.LeaveRequest, error)
	FindPending() ([]*models.LeaveRequest, error)
	Update(leave *models.LeaveRequest) error
	UpdateStatus(id uuid.UUID, status models.LeaveStatus, comment string) error
}

// leaveRepository implements LeaveRepository
type leaveRepository struct {
	db     *sql.DB
	logger *logger.Logger
}

// NewLeaveRepository creates a new leave repository
func NewLeaveRepository(db *sql.DB) LeaveRepository {
	return &leaveRepository{
		db:     db,
		logger: logger.New().With("component", "repository"),
	}
}

// Create inserts a new leave request
func (r *leaveRepository) Create(leave *models.LeaveRequest) error {
	query := `
		INSERT INTO leave_requests (
			id, employee_id, employee_name, employee_email, leave_type, reason,
			start_date, end_date, days, status, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
		RETURNING id, employee_id, employee_name, employee_email, leave_type, reason,
			start_date, end_date, days, status, manager_comment, created_at, updated_at
	`

	err := r.db.QueryRow(
		query,
		leave.ID,
		leave.EmployeeID,
		leave.EmployeeName,
		leave.EmployeeEmail,
		leave.LeaveType,
		leave.Reason,
		leave.StartDate,
		leave.EndDate,
		leave.Days,
		leave.Status,
		leave.CreatedAt,
		leave.UpdatedAt,
	).Scan(
		&leave.ID,
		&leave.EmployeeID,
		&leave.EmployeeName,
		&leave.EmployeeEmail,
		&leave.LeaveType,
		&leave.Reason,
		&leave.StartDate,
		&leave.EndDate,
		&leave.Days,
		&leave.Status,
		&leave.ManagerComment,
		&leave.CreatedAt,
		&leave.UpdatedAt,
	)

	if err != nil {
		r.logger.Errorf("db_create_failed operation=create_leave leave_id=%s employee_id=%s error=%v", leave.ID, leave.EmployeeID, err)
	}

	return err
}

// FindByID finds a leave request by ID
func (r *leaveRepository) FindByID(id uuid.UUID) (*models.LeaveRequest, error) {
	query := `
		SELECT id, employee_id, employee_name, employee_email, leave_type, reason,
			start_date, end_date, days, status, manager_comment, created_at, updated_at
		FROM leave_requests
		WHERE id = $1
	`

	var leave models.LeaveRequest
	err := r.db.QueryRow(query, id).Scan(
		&leave.ID,
		&leave.EmployeeID,
		&leave.EmployeeName,
		&leave.EmployeeEmail,
		&leave.LeaveType,
		&leave.Reason,
		&leave.StartDate,
		&leave.EndDate,
		&leave.Days,
		&leave.Status,
		&leave.ManagerComment,
		&leave.CreatedAt,
		&leave.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("%w: %s", ErrNotFound, "leave request")
	}
	if err != nil {
		r.logger.Errorf("db_query_failed operation=find_by_id leave_id=%s error=%v", id, err)
		return nil, fmt.Errorf("failed to find leave request by ID: %w", err)
	}

	return &leave, nil
}

// FindByEmployeeID finds all leave requests for an employee
func (r *leaveRepository) FindByEmployeeID(employeeID string) ([]*models.LeaveRequest, error) {
	query := `
		SELECT id, employee_id, employee_name, employee_email, leave_type, reason,
			start_date, end_date, days, status, manager_comment, created_at, updated_at
		FROM leave_requests
		WHERE employee_id = $1
		ORDER BY created_at DESC
	`

	rows, err := r.db.Query(query, employeeID)
	if err != nil {
		r.logger.Errorf("db_query_failed operation=find_by_employee_id employee_id=%s error=%v", employeeID, err)
		return nil, fmt.Errorf("failed to query leave requests by employee ID: %w", err)
	}
	defer rows.Close()

	var leaves []*models.LeaveRequest
	for rows.Next() {
		var leave models.LeaveRequest
		err := rows.Scan(
			&leave.ID,
			&leave.EmployeeID,
			&leave.EmployeeName,
			&leave.EmployeeEmail,
			&leave.LeaveType,
			&leave.Reason,
			&leave.StartDate,
			&leave.EndDate,
			&leave.Days,
			&leave.Status,
			&leave.ManagerComment,
			&leave.CreatedAt,
			&leave.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		leaves = append(leaves, &leave)
	}

	return leaves, rows.Err()
}

// FindPending finds all pending leave requests
func (r *leaveRepository) FindPending() ([]*models.LeaveRequest, error) {
	query := `
		SELECT id, employee_id, employee_name, employee_email, leave_type, reason,
			start_date, end_date, days, status, manager_comment, created_at, updated_at
		FROM leave_requests
		WHERE status = $1
		ORDER BY created_at ASC
	`

	rows, err := r.db.Query(query, models.LeaveStatusPending)
	if err != nil {
		r.logger.Errorf("db_query_failed operation=find_pending error=%v", err)
		return nil, fmt.Errorf("failed to query pending leave requests: %w", err)
	}
	defer rows.Close()

	var leaves []*models.LeaveRequest
	for rows.Next() {
		var leave models.LeaveRequest
		err := rows.Scan(
			&leave.ID,
			&leave.EmployeeID,
			&leave.EmployeeName,
			&leave.EmployeeEmail,
			&leave.LeaveType,
			&leave.Reason,
			&leave.StartDate,
			&leave.EndDate,
			&leave.Days,
			&leave.Status,
			&leave.ManagerComment,
			&leave.CreatedAt,
			&leave.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		leaves = append(leaves, &leave)
	}

	return leaves, rows.Err()
}

// Update updates a leave request
func (r *leaveRepository) Update(leave *models.LeaveRequest) error {
	query := `
		UPDATE leave_requests
		SET leave_type = $1, reason = $2, start_date = $3, end_date = $4, 
			days = $5, updated_at = CURRENT_TIMESTAMP
		WHERE id = $6
		RETURNING id, employee_id, employee_name, employee_email, leave_type, reason,
			start_date, end_date, days, status, manager_comment, created_at, updated_at
	`

	err := r.db.QueryRow(
		query,
		leave.LeaveType,
		leave.Reason,
		leave.StartDate,
		leave.EndDate,
		leave.Days,
		leave.ID,
	).Scan(
		&leave.ID,
		&leave.EmployeeID,
		&leave.EmployeeName,
		&leave.EmployeeEmail,
		&leave.LeaveType,
		&leave.Reason,
		&leave.StartDate,
		&leave.EndDate,
		&leave.Days,
		&leave.Status,
		&leave.ManagerComment,
		&leave.CreatedAt,
		&leave.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return fmt.Errorf("%w: %s", ErrNotFound, "leave request")
		}
		r.logger.Errorf("db_update_failed operation=update_leave leave_id=%s error=%v", leave.ID, err)
		return fmt.Errorf("failed to update leave request: %w", err)
	}

	return nil
}

// UpdateStatus updates the status and comment of a leave request
func (r *leaveRepository) UpdateStatus(id uuid.UUID, status models.LeaveStatus, comment string) error {
	query := `
		UPDATE leave_requests
		SET status = $1, manager_comment = $2, updated_at = CURRENT_TIMESTAMP
		WHERE id = $3
	`

	// Handle empty comment as NULL
	var commentValue interface{}
	if comment == "" {
		commentValue = nil
	} else {
		commentValue = comment
	}

	_, err := r.db.Exec(query, status, commentValue, id)
	if err != nil {
		r.logger.Errorf("db_update_failed operation=update_status leave_id=%s status=%s error=%v", id, status, err)
		return fmt.Errorf("failed to update leave request status: %w", err)
	}
	return nil
}

