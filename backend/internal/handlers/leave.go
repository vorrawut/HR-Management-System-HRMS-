package handlers

import (
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"leave-management-system/internal/middleware"
	"leave-management-system/internal/models"
	"leave-management-system/internal/services"
)

// LeaveHandler handles leave request endpoints
type LeaveHandler struct {
	leaveService *services.LeaveService
}

// NewLeaveHandler creates a new leave handler
func NewLeaveHandler(leaveService *services.LeaveService) *LeaveHandler {
	return &LeaveHandler{
		leaveService: leaveService,
	}
}

// CreateLeaveRequest handles POST /api/v1/leave
func (h *LeaveHandler) CreateLeaveRequest(c echo.Context) error {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, err.Error())
	}

	userName, _ := middleware.GetUserName(c)
	userEmail, _ := middleware.GetUserEmail(c)

	var req models.CreateLeaveRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid request body")
	}

	// Validate dates
	if req.StartDate.After(req.EndDate) {
		return echo.NewHTTPError(http.StatusBadRequest, "Start date must be before end date")
	}

	// Allow same-day leaves but not past dates
	today := time.Now().Truncate(24 * time.Hour)
	if req.StartDate.Before(today) {
		return echo.NewHTTPError(http.StatusBadRequest, "Start date cannot be in the past")
	}

	leave, err := h.leaveService.CreateLeaveRequest(&req, userID, userName, userEmail)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.JSON(http.StatusCreated, leave)
}

// GetLeaveRequests handles GET /api/v1/leave
func (h *LeaveHandler) GetLeaveRequests(c echo.Context) error {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, err.Error())
	}

	leaves, err := h.leaveService.GetLeaveRequestsByEmployeeID(userID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.JSON(http.StatusOK, leaves)
}

// GetLeaveRequest handles GET /api/v1/leave/:id
func (h *LeaveHandler) GetLeaveRequest(c echo.Context) error {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, err.Error())
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid leave request ID")
	}

	leave, err := h.leaveService.GetLeaveRequestByID(id)
	if err != nil {
		if err == services.ErrLeaveNotFound {
			return echo.NewHTTPError(http.StatusNotFound, "Leave request not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	// Verify ownership
	if leave.EmployeeID != userID {
		return echo.NewHTTPError(http.StatusForbidden, "Access denied")
	}

	return c.JSON(http.StatusOK, leave)
}

// UpdateLeaveRequest handles PUT /api/v1/leave/:id
func (h *LeaveHandler) UpdateLeaveRequest(c echo.Context) error {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, err.Error())
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid leave request ID")
	}

	var req models.UpdateLeaveRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid request body")
	}

	// Validate dates if provided
	if req.StartDate != nil && req.EndDate != nil {
		if req.StartDate.After(*req.EndDate) {
			return echo.NewHTTPError(http.StatusBadRequest, "Start date must be before end date")
		}
	} else if req.StartDate != nil {
		// If only start date is provided, check it's not in the past
		today := time.Now().Truncate(24 * time.Hour)
		if req.StartDate.Before(today) {
			return echo.NewHTTPError(http.StatusBadRequest, "Start date cannot be in the past")
		}
	}

	leave, err := h.leaveService.UpdateLeaveRequest(id, userID, &req)
	if err != nil {
		if err == services.ErrLeaveNotFound {
			return echo.NewHTTPError(http.StatusNotFound, "Leave request not found")
		}
		if err == services.ErrUnauthorizedAction {
			return echo.NewHTTPError(http.StatusForbidden, "Access denied")
		}
		if err == services.ErrInvalidStatus {
			return echo.NewHTTPError(http.StatusBadRequest, err.Error())
		}
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.JSON(http.StatusOK, leave)
}

// CancelLeaveRequest handles DELETE /api/v1/leave/:id
func (h *LeaveHandler) CancelLeaveRequest(c echo.Context) error {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, err.Error())
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid leave request ID")
	}

	err = h.leaveService.CancelLeaveRequest(id, userID)
	if err != nil {
		if err == services.ErrLeaveNotFound {
			return echo.NewHTTPError(http.StatusNotFound, "Leave request not found")
		}
		if err == services.ErrUnauthorizedAction {
			return echo.NewHTTPError(http.StatusForbidden, "Access denied")
		}
		if err == services.ErrInvalidStatus {
			return echo.NewHTTPError(http.StatusBadRequest, err.Error())
		}
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.NoContent(http.StatusNoContent)
}
