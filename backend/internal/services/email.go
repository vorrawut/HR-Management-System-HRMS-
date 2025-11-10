package services

import (
	"fmt"
	"net/smtp"
	"leave-management-system/internal/config"
	"leave-management-system/internal/models"
)

// EmailService handles email notifications
type EmailService struct {
	cfg *config.Config
}

// NewEmailService creates a new email service
func NewEmailService(cfg *config.Config) *EmailService {
	return &EmailService{
		cfg: cfg,
	}
}

// SendLeaveApprovalEmail sends an email when a leave request is approved
func (s *EmailService) SendLeaveApprovalEmail(leave *models.LeaveRequest) error {
	if s.cfg.Email.Host == "" {
		// Email not configured, skip sending
		return nil
	}

	subject := "Leave Request Approved"
	body := s.buildApprovalEmailBody(leave)

	return s.sendEmail(leave.EmployeeEmail, subject, body)
}

// SendLeaveRejectionEmail sends an email when a leave request is rejected
func (s *EmailService) SendLeaveRejectionEmail(leave *models.LeaveRequest) error {
	if s.cfg.Email.Host == "" {
		// Email not configured, skip sending
		return nil
	}

	subject := "Leave Request Rejected"
	body := s.buildRejectionEmailBody(leave)

	return s.sendEmail(leave.EmployeeEmail, subject, body)
}

func (s *EmailService) buildApprovalEmailBody(leave *models.LeaveRequest) string {
	return fmt.Sprintf(`
Hello %s,

Your leave request has been approved.

Leave Details:
- Type: %s
- Start Date: %s
- End Date: %s
- Days: %d
- Reason: %s

%s

Thank you,
Leave Management System
	`, leave.EmployeeName, leave.LeaveType, leave.StartDate.Format("January 2, 2006"),
		leave.EndDate.Format("January 2, 2006"), leave.Days, leave.Reason,
		s.getManagerCommentSection(leave.GetManagerComment()))
}

func (s *EmailService) buildRejectionEmailBody(leave *models.LeaveRequest) string {
	return fmt.Sprintf(`
Hello %s,

Your leave request has been rejected.

Leave Details:
- Type: %s
- Start Date: %s
- End Date: %s
- Days: %d
- Reason: %s

Manager's Comment:
%s

If you have any questions, please contact your manager.

Thank you,
Leave Management System
	`, leave.EmployeeName, leave.LeaveType, leave.StartDate.Format("January 2, 2006"),
		leave.EndDate.Format("January 2, 2006"), leave.Days, leave.Reason,
		leave.GetManagerComment())
}

func (s *EmailService) getManagerCommentSection(comment string) string {
	if comment == "" {
		return ""
	}
	return fmt.Sprintf("\nManager's Comment:\n%s", comment)
}

func (s *EmailService) sendEmail(to, subject, body string) error {
	addr := fmt.Sprintf("%s:%d", s.cfg.Email.Host, s.cfg.Email.Port)
	auth := smtp.PlainAuth("", s.cfg.Email.User, s.cfg.Email.Password, s.cfg.Email.Host)

	msg := []byte(fmt.Sprintf(
		"From: %s\r\nTo: %s\r\nSubject: %s\r\n\r\n%s\r\n",
		s.cfg.Email.From, to, subject, body,
	))

	return smtp.SendMail(addr, auth, s.cfg.Email.From, []string{to}, msg)
}

