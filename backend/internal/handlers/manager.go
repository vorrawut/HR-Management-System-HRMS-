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
	leaves, err := h.leaveService.GetPendingLeaveRequests()
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.JSON(http.StatusOK, leaves)
}

// ApproveLeaveRequest handles PUT /api/v1/manager/leave/:id/approve
func (h *ManagerHandler) ApproveLeaveRequest(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid leave request ID")
	}

	var req models.ApproveLeaveRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid request body")
	}

	leave, err := h.leaveService.ApproveLeaveRequest(id, strings.TrimSpace(req.Comment))
	if err != nil {
		if err == services.ErrLeaveNotFound {
			return echo.NewHTTPError(http.StatusNotFound, "Leave request not found")
		}
		if err == services.ErrInvalidStatus {
			return echo.NewHTTPError(http.StatusBadRequest, err.Error())
		}
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	// Send email notification (non-blocking)
	go func() {
		if err := h.emailService.SendLeaveApprovalEmail(leave); err != nil {
			c.Logger().Errorf("Failed to send approval email: %v", err)
		}
	}()

	return c.JSON(http.StatusOK, leave)
}

// RejectLeaveRequest handles PUT /api/v1/manager/leave/:id/reject
func (h *ManagerHandler) RejectLeaveRequest(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid leave request ID")
	}

	var req models.RejectLeaveRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid request body")
	}

	comment := strings.TrimSpace(req.Comment)
	if comment == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "Comment is required for rejection")
	}

	if len(comment) < 10 {
		return echo.NewHTTPError(http.StatusBadRequest, "Comment must be at least 10 characters")
	}

	leave, err := h.leaveService.RejectLeaveRequest(id, comment)
	if err != nil {
		if err == services.ErrLeaveNotFound {
			return echo.NewHTTPError(http.StatusNotFound, "Leave request not found")
		}
		if err == services.ErrInvalidStatus {
			return echo.NewHTTPError(http.StatusBadRequest, err.Error())
		}
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	// Send email notification (non-blocking)
	go func() {
		if err := h.emailService.SendLeaveRejectionEmail(leave); err != nil {
			c.Logger().Errorf("Failed to send rejection email: %v", err)
		}
	}()

	return c.JSON(http.StatusOK, leave)
}
