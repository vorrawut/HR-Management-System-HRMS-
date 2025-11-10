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
	log := middleware.GetLogger(c)

	userID, err := middleware.GetUserID(c)
	if err != nil {
		log.Warnf("create_leave_failed reason=unauthorized error=%v", err)
		return echo.NewHTTPError(http.StatusUnauthorized, err.Error())
	}

	userName, _ := middleware.GetUserName(c)
	userEmail, _ := middleware.GetUserEmail(c)

	var req models.CreateLeaveRequest
	if err := c.Bind(&req); err != nil {
		log.Warnf("create_leave_failed reason=invalid_request error=%v", err)
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid request body")
	}

	// Validate dates
	if req.StartDate.After(req.EndDate) {
		log.Warnf("create_leave_failed reason=invalid_dates start=%v end=%v", req.StartDate, req.EndDate)
		return echo.NewHTTPError(http.StatusBadRequest, "Start date must be before end date")
	}

	// Allow same-day leaves but not past dates
	today := time.Now().Truncate(24 * time.Hour)
	if req.StartDate.Before(today) {
		log.Warnf("create_leave_failed reason=past_date start=%v", req.StartDate)
		return echo.NewHTTPError(http.StatusBadRequest, "Start date cannot be in the past")
	}

	log.Debugf("create_leave_start leave_type=%s start_date=%v end_date=%v", req.LeaveType, req.StartDate, req.EndDate)

	leave, err := h.leaveService.CreateLeaveRequest(&req, userID, userName, userEmail)
	if err != nil {
		log.Errorf("create_leave_failed error=%v", err)
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	log.Infof("create_leave_success leave_id=%s days=%d", leave.ID, leave.Days)
	return c.JSON(http.StatusCreated, leave)
}

// GetLeaveRequests handles GET /api/v1/leave
func (h *LeaveHandler) GetLeaveRequests(c echo.Context) error {
	log := middleware.GetLogger(c)

	userID, err := middleware.GetUserID(c)
	if err != nil {
		log.Warnf("get_leaves_failed reason=unauthorized error=%v", err)
		return echo.NewHTTPError(http.StatusUnauthorized, err.Error())
	}

	log.Debug("get_leaves_start")

	leaves, err := h.leaveService.GetLeaveRequestsByEmployeeID(userID)
	if err != nil {
		log.Errorf("get_leaves_failed error=%v", err)
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	log.Infof("get_leaves_success count=%d", len(leaves))
	return c.JSON(http.StatusOK, leaves)
}

// GetLeaveRequest handles GET /api/v1/leave/:id
func (h *LeaveHandler) GetLeaveRequest(c echo.Context) error {
	log := middleware.GetLogger(c)

	userID, err := middleware.GetUserID(c)
	if err != nil {
		log.Warnf("get_leave_failed reason=unauthorized error=%v", err)
		return echo.NewHTTPError(http.StatusUnauthorized, err.Error())
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		log.Warnf("get_leave_failed reason=invalid_id id=%s error=%v", c.Param("id"), err)
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid leave request ID")
	}

	log.Debugf("get_leave_start leave_id=%s", id)

	leave, err := h.leaveService.GetLeaveRequestByID(id)
	if err != nil {
		if err == services.ErrLeaveNotFound {
			log.Warnf("get_leave_failed reason=not_found leave_id=%s", id)
			return echo.NewHTTPError(http.StatusNotFound, "Leave request not found")
		}
		log.Errorf("get_leave_failed leave_id=%s error=%v", id, err)
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	// Verify ownership
	if leave.EmployeeID != userID {
		log.Warnf("get_leave_failed reason=forbidden leave_id=%s owner=%s requester=%s", id, leave.EmployeeID, userID)
		return echo.NewHTTPError(http.StatusForbidden, "Access denied")
	}

	log.Infof("get_leave_success leave_id=%s", id)
	return c.JSON(http.StatusOK, leave)
}

// UpdateLeaveRequest handles PUT /api/v1/leave/:id
func (h *LeaveHandler) UpdateLeaveRequest(c echo.Context) error {
	log := middleware.GetLogger(c)

	userID, err := middleware.GetUserID(c)
	if err != nil {
		log.Warnf("update_leave_failed reason=unauthorized error=%v", err)
		return echo.NewHTTPError(http.StatusUnauthorized, err.Error())
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		log.Warnf("update_leave_failed reason=invalid_id id=%s error=%v", c.Param("id"), err)
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid leave request ID")
	}

	var req models.UpdateLeaveRequest
	if err := c.Bind(&req); err != nil {
		log.Warnf("update_leave_failed reason=invalid_request leave_id=%s error=%v", id, err)
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid request body")
	}

	// Validate dates if provided
	if req.StartDate != nil && req.EndDate != nil {
		if req.StartDate.After(*req.EndDate) {
			log.Warnf("update_leave_failed reason=invalid_dates leave_id=%s start=%v end=%v", id, req.StartDate, req.EndDate)
			return echo.NewHTTPError(http.StatusBadRequest, "Start date must be before end date")
		}
	} else if req.StartDate != nil {
		// If only start date is provided, check it's not in the past
		today := time.Now().Truncate(24 * time.Hour)
		if req.StartDate.Before(today) {
			log.Warnf("update_leave_failed reason=past_date leave_id=%s start=%v", id, req.StartDate)
			return echo.NewHTTPError(http.StatusBadRequest, "Start date cannot be in the past")
		}
	}

	log.Debugf("update_leave_start leave_id=%s", id)

	leave, err := h.leaveService.UpdateLeaveRequest(id, userID, &req)
	if err != nil {
		if err == services.ErrLeaveNotFound {
			log.Warnf("update_leave_failed reason=not_found leave_id=%s", id)
			return echo.NewHTTPError(http.StatusNotFound, "Leave request not found")
		}
		if err == services.ErrUnauthorizedAction {
			log.Warnf("update_leave_failed reason=forbidden leave_id=%s user_id=%s", id, userID)
			return echo.NewHTTPError(http.StatusForbidden, "Access denied")
		}
		if err == services.ErrInvalidStatus {
			log.Warnf("update_leave_failed reason=invalid_status leave_id=%s error=%v", id, err)
			return echo.NewHTTPError(http.StatusBadRequest, err.Error())
		}
		log.Errorf("update_leave_failed leave_id=%s error=%v", id, err)
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	log.Infof("update_leave_success leave_id=%s", id)
	return c.JSON(http.StatusOK, leave)
}

// CancelLeaveRequest handles DELETE /api/v1/leave/:id
func (h *LeaveHandler) CancelLeaveRequest(c echo.Context) error {
	log := middleware.GetLogger(c)

	userID, err := middleware.GetUserID(c)
	if err != nil {
		log.Warnf("cancel_leave_failed reason=unauthorized error=%v", err)
		return echo.NewHTTPError(http.StatusUnauthorized, err.Error())
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		log.Warnf("cancel_leave_failed reason=invalid_id id=%s error=%v", c.Param("id"), err)
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid leave request ID")
	}

	log.Debugf("cancel_leave_start leave_id=%s", id)

	err = h.leaveService.CancelLeaveRequest(id, userID)
	if err != nil {
		if err == services.ErrLeaveNotFound {
			log.Warnf("cancel_leave_failed reason=not_found leave_id=%s", id)
			return echo.NewHTTPError(http.StatusNotFound, "Leave request not found")
		}
		if err == services.ErrUnauthorizedAction {
			log.Warnf("cancel_leave_failed reason=forbidden leave_id=%s user_id=%s", id, userID)
			return echo.NewHTTPError(http.StatusForbidden, "Access denied")
		}
		if err == services.ErrInvalidStatus {
			log.Warnf("cancel_leave_failed reason=invalid_status leave_id=%s error=%v", id, err)
			return echo.NewHTTPError(http.StatusBadRequest, err.Error())
		}
		log.Errorf("cancel_leave_failed leave_id=%s error=%v", id, err)
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	log.Infof("cancel_leave_success leave_id=%s", id)
	return c.NoContent(http.StatusNoContent)
}
