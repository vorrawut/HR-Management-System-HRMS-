package services

import (
	"database/sql"
	"testing"
	"time"

	"leave-management-system/internal/config"
	"leave-management-system/internal/models"
)

func TestEmailService_SendLeaveApprovalEmail(t *testing.T) {
	cfg := &config.Config{
		Email: config.EmailConfig{
			Host:     "", // Not configured - should skip
			Port:     587,
			User:     "test@example.com",
			Password: "password",
			From:     "noreply@company.com",
		},
	}

	service := NewEmailService(cfg)

	leave := &models.LeaveRequest{
		EmployeeName:  "John Doe",
		EmployeeEmail: "john@example.com",
		LeaveType:     models.LeaveTypeAnnual,
		StartDate:     time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC),
		EndDate:       time.Date(2024, 1, 5, 0, 0, 0, 0, time.UTC),
		Days:          5,
		Reason:        "Vacation",
		ManagerComment: sql.NullString{String: "Enjoy your vacation!", Valid: true},
	}

	// Should not error when email is not configured
	err := service.SendLeaveApprovalEmail(leave)
	if err != nil {
		t.Errorf("unexpected error when email not configured: %v", err)
	}
}

func TestEmailService_SendLeaveRejectionEmail(t *testing.T) {
	cfg := &config.Config{
		Email: config.EmailConfig{
			Host:     "", // Not configured - should skip
			Port:     587,
			User:     "test@example.com",
			Password: "password",
			From:     "noreply@company.com",
		},
	}

	service := NewEmailService(cfg)

	leave := &models.LeaveRequest{
		EmployeeName:  "John Doe",
		EmployeeEmail: "john@example.com",
		LeaveType:     models.LeaveTypeAnnual,
		StartDate:     time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC),
		EndDate:       time.Date(2024, 1, 5, 0, 0, 0, 0, time.UTC),
		Days:          5,
		Reason:        "Vacation",
		ManagerComment: sql.NullString{String: "Not enough leave balance", Valid: true},
	}

	// Should not error when email is not configured
	err := service.SendLeaveRejectionEmail(leave)
	if err != nil {
		t.Errorf("unexpected error when email not configured: %v", err)
	}
}

func TestEmailService_BuildApprovalEmailBody(t *testing.T) {
	cfg := &config.Config{
		Email: config.EmailConfig{
			From: "noreply@company.com",
		},
	}

	service := NewEmailService(cfg)

	leave := &models.LeaveRequest{
		EmployeeName:  "John Doe",
		LeaveType:     models.LeaveTypeAnnual,
		StartDate:     time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC),
		EndDate:       time.Date(2024, 1, 5, 0, 0, 0, 0, time.UTC),
		Days:          5,
		Reason:        "Vacation",
		ManagerComment: sql.NullString{String: "Enjoy!", Valid: true},
	}

	// This is an internal method, but we can test it indirectly
	// by checking that SendLeaveApprovalEmail doesn't crash
	err := service.SendLeaveApprovalEmail(leave)
	if err != nil {
		// Only error if email is configured but sending fails
		// If email is not configured, it should return nil
		if cfg.Email.Host == "" && err != nil {
			t.Errorf("unexpected error when email not configured: %v", err)
		}
	}
}

