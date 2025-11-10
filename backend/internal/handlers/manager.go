package handlers

import (
	"net/http"
	"strings"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"leave-management-system/internal/middleware"
	"leave-management-system/internal/models"
	"leave-management-system/internal/services"
)

// ManagerHandler handles manager leave endpoints
type ManagerHandler struct {
	leaveService *services.LeaveService
	emailService *services.EmailService
}

// NewManagerHandler creates a new manager handler
func NewManagerHandler(leaveService *services.LeaveService, emailService *services.EmailService) *ManagerHandler {
	return &ManagerHandler{
		leaveService: leaveService,
		emailService: emailService,
	}
}

// GetPendingLeaveRequests handles GET /api/v1/manager/leave
func (h *ManagerHandler) GetPendingLeaveRequests(c echo.Context) error {
	log := middleware.GetLogger(c)

	log.Debug("get_pending_leaves_start")

	leaves, err := h.leaveService.GetPendingLeaveRequests()
	if err != nil {
		log.Errorf("get_pending_leaves_failed error=%v", err)
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	log.Infof("get_pending_leaves_success count=%d", len(leaves))
	return c.JSON(http.StatusOK, leaves)
}

// ApproveLeaveRequest handles PUT /api/v1/manager/leave/:id/approve
func (h *ManagerHandler) ApproveLeaveRequest(c echo.Context) error {
	log := middleware.GetLogger(c)

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		log.Warnf("approve_leave_failed reason=invalid_id id=%s error=%v", c.Param("id"), err)
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid leave request ID")
	}

	var req models.ApproveLeaveRequest
	if err := c.Bind(&req); err != nil {
		log.Warnf("approve_leave_failed reason=invalid_request leave_id=%s error=%v", id, err)
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid request body")
	}

	log.Debugf("approve_leave_start leave_id=%s", id)

	leave, err := h.leaveService.ApproveLeaveRequest(id, strings.TrimSpace(req.Comment))
	if err != nil {
		if err == services.ErrLeaveNotFound {
			log.Warnf("approve_leave_failed reason=not_found leave_id=%s", id)
			return echo.NewHTTPError(http.StatusNotFound, "Leave request not found")
		}
		if err == services.ErrInvalidStatus {
			log.Warnf("approve_leave_failed reason=invalid_status leave_id=%s error=%v", id, err)
			return echo.NewHTTPError(http.StatusBadRequest, err.Error())
		}
		log.Errorf("approve_leave_failed leave_id=%s error=%v", id, err)
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	log.Infof("approve_leave_success leave_id=%s employee_id=%s", id, leave.EmployeeID)

	// Send email notification (non-blocking)
	go func() {
		if err := h.emailService.SendLeaveApprovalEmail(leave); err != nil {
			log.Errorf("email_send_failed type=approval leave_id=%s employee_email=%s error=%v", id, leave.EmployeeEmail, err)
		} else {
			log.Debugf("email_sent type=approval leave_id=%s employee_email=%s", id, leave.EmployeeEmail)
		}
	}()

	return c.JSON(http.StatusOK, leave)
}

// RejectLeaveRequest handles PUT /api/v1/manager/leave/:id/reject
func (h *ManagerHandler) RejectLeaveRequest(c echo.Context) error {
	log := middleware.GetLogger(c)

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		log.Warnf("reject_leave_failed reason=invalid_id id=%s error=%v", c.Param("id"), err)
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid leave request ID")
	}

	var req models.RejectLeaveRequest
	if err := c.Bind(&req); err != nil {
		log.Warnf("reject_leave_failed reason=invalid_request leave_id=%s error=%v", id, err)
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid request body")
	}

	comment := strings.TrimSpace(req.Comment)
	if comment == "" {
		log.Warnf("reject_leave_failed reason=missing_comment leave_id=%s", id)
		return echo.NewHTTPError(http.StatusBadRequest, "Comment is required for rejection")
	}

	if len(comment) < 10 {
		log.Warnf("reject_leave_failed reason=comment_too_short leave_id=%s comment_len=%d", id, len(comment))
		return echo.NewHTTPError(http.StatusBadRequest, "Comment must be at least 10 characters")
	}

	log.Debugf("reject_leave_start leave_id=%s", id)

	leave, err := h.leaveService.RejectLeaveRequest(id, comment)
	if err != nil {
		if err == services.ErrLeaveNotFound {
			log.Warnf("reject_leave_failed reason=not_found leave_id=%s", id)
			return echo.NewHTTPError(http.StatusNotFound, "Leave request not found")
		}
		if err == services.ErrInvalidStatus {
			log.Warnf("reject_leave_failed reason=invalid_status leave_id=%s error=%v", id, err)
			return echo.NewHTTPError(http.StatusBadRequest, err.Error())
		}
		log.Errorf("reject_leave_failed leave_id=%s error=%v", id, err)
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	log.Infof("reject_leave_success leave_id=%s employee_id=%s", id, leave.EmployeeID)

	// Send email notification (non-blocking)
	go func() {
		if err := h.emailService.SendLeaveRejectionEmail(leave); err != nil {
			log.Errorf("email_send_failed type=rejection leave_id=%s employee_email=%s error=%v", id, leave.EmployeeEmail, err)
		} else {
			log.Debugf("email_sent type=rejection leave_id=%s employee_email=%s", id, leave.EmployeeEmail)
		}
	}()

	return c.JSON(http.StatusOK, leave)
}
