package integration

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"leave-management-system/internal/config"
	"leave-management-system/internal/handlers"
	"leave-management-system/internal/middleware"
	authMiddleware "leave-management-system/internal/middleware"
	"leave-management-system/internal/models"
	"leave-management-system/internal/repository"
	"leave-management-system/internal/services"
	"leave-management-system/internal/testutil"
)

var (
	testDB     *sql.DB
	leaveRepo  repository.LeaveRepository
	leaveSvc   *services.LeaveService
	emailSvc   *services.EmailService
	leaveHdlr  *handlers.LeaveHandler
	managerHdlr *handlers.ManagerHandler
	e          *echo.Echo
)

func setupIntegrationTest(t *testing.T) {
	t.Helper()

	// Setup test database
	testDB = testutil.SetupTestDB(t)
	testutil.RunMigrations(t, testDB)
	testutil.CleanupTestDB(t, testDB)

	// Setup repository and services
	leaveRepo = repository.NewLeaveRepository(testDB)
	leaveSvc = services.NewLeaveService(leaveRepo)

	cfg := &config.Config{
		Email: config.EmailConfig{
			Host:     "",
			Port:     587,
			User:     "",
			Password: "",
			From:     "test@example.com",
		},
	}
	emailSvc = services.NewEmailService(cfg)

	// Setup handlers
	leaveHdlr = handlers.NewLeaveHandler(leaveSvc)
	managerHdlr = handlers.NewManagerHandler(leaveSvc, emailSvc)

	// Setup Echo with middleware
	e = echo.New()
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORSWithConfig(authMiddleware.CORSConfig()))

	// Setup routes
	api := e.Group("/api/v1")
	leave := api.Group("/leave", authMiddleware.AuthMiddleware())
	leave.POST("", leaveHdlr.CreateLeaveRequest)
	leave.GET("", leaveHdlr.GetLeaveRequests)
	leave.GET("/:id", leaveHdlr.GetLeaveRequest)
	leave.PUT("/:id", leaveHdlr.UpdateLeaveRequest)
	leave.DELETE("/:id", leaveHdlr.CancelLeaveRequest)

	manager := api.Group("/manager/leave", authMiddleware.AuthMiddleware(), authMiddleware.RequireRole("manager", "admin"))
	manager.GET("", managerHdlr.GetPendingLeaveRequests)
	manager.PUT("/:id/approve", managerHdlr.ApproveLeaveRequest)
	manager.PUT("/:id/reject", managerHdlr.RejectLeaveRequest)
}

func teardownIntegrationTest(t *testing.T) {
	t.Helper()
	if testDB != nil {
		testutil.CleanupTestDB(t, testDB)
		testDB.Close()
	}
}

func TestLeaveIntegration_CreateAndGet(t *testing.T) {
	setupIntegrationTest(t)
	defer teardownIntegrationTest(t)

	// Create employee token
	employeeToken := testutil.CreateTestJWT("emp-1", "employee@example.com", "Employee One", []string{"employee"})
	authHeader := testutil.GetAuthHeader(employeeToken)

	// Create leave request
	createReq := map[string]interface{}{
		"leaveType": "annual",
		"reason":    "Vacation time for rest",
		"startDate": "2024-06-01T00:00:00Z",
		"endDate":   "2024-06-05T00:00:00Z",
	}

	body, _ := json.Marshal(createReq)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/leave", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", authHeader)
	rec := httptest.NewRecorder()

	e.ServeHTTP(rec, req)

	if rec.Code != http.StatusCreated {
		t.Errorf("Expected status %d, got %d. Body: %s", http.StatusCreated, rec.Code, rec.Body.String())
		return
	}

	var createdLeave models.LeaveRequest
	if err := json.Unmarshal(rec.Body.Bytes(), &createdLeave); err != nil {
		t.Fatalf("Failed to unmarshal response: %v", err)
	}

	if createdLeave.Status != models.LeaveStatusPending {
		t.Errorf("Expected status %q, got %q", models.LeaveStatusPending, createdLeave.Status)
	}

	if createdLeave.Days <= 0 {
		t.Errorf("Expected days > 0, got %d", createdLeave.Days)
	}

	// Get all leave requests
	req = httptest.NewRequest(http.MethodGet, "/api/v1/leave", nil)
	req.Header.Set("Authorization", authHeader)
	rec = httptest.NewRecorder()

	e.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, rec.Code)
		return
	}

	var leaves []*models.LeaveRequest
	if err := json.Unmarshal(rec.Body.Bytes(), &leaves); err != nil {
		t.Fatalf("Failed to unmarshal response: %v", err)
	}

	if len(leaves) != 1 {
		t.Errorf("Expected 1 leave request, got %d", len(leaves))
	}

	if leaves[0].ID != createdLeave.ID {
		t.Errorf("Expected leave ID %v, got %v", createdLeave.ID, leaves[0].ID)
	}
}

func TestLeaveIntegration_UpdateAndCancel(t *testing.T) {
	setupIntegrationTest(t)
	defer teardownIntegrationTest(t)

	employeeToken := testutil.CreateTestJWT("emp-1", "employee@example.com", "Employee One", []string{"employee"})
	authHeader := testutil.GetAuthHeader(employeeToken)

	// Create leave request
	createReq := map[string]interface{}{
		"leaveType": "annual",
		"reason":    "Initial vacation request",
		"startDate": "2024-06-01T00:00:00Z",
		"endDate":   "2024-06-05T00:00:00Z",
	}

	body, _ := json.Marshal(createReq)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/leave", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", authHeader)
	rec := httptest.NewRecorder()

	e.ServeHTTP(rec, req)

	var createdLeave models.LeaveRequest
	json.Unmarshal(rec.Body.Bytes(), &createdLeave)

	// Update leave request
	updateReq := map[string]interface{}{
		"reason": "Updated vacation reason",
	}

	body, _ = json.Marshal(updateReq)
	req = httptest.NewRequest(http.MethodPut, "/api/v1/leave/"+createdLeave.ID.String(), bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", authHeader)
	rec = httptest.NewRecorder()

	e.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d. Body: %s", http.StatusOK, rec.Code, rec.Body.String())
		return
	}

	var updatedLeave models.LeaveRequest
	json.Unmarshal(rec.Body.Bytes(), &updatedLeave)

	if updatedLeave.Reason != "Updated vacation reason" {
		t.Errorf("Expected reason %q, got %q", "Updated vacation reason", updatedLeave.Reason)
	}

	// Cancel leave request
	req = httptest.NewRequest(http.MethodDelete, "/api/v1/leave/"+createdLeave.ID.String(), nil)
	req.Header.Set("Authorization", authHeader)
	rec = httptest.NewRecorder()

	e.ServeHTTP(rec, req)

	if rec.Code != http.StatusNoContent {
		t.Errorf("Expected status %d, got %d", http.StatusNoContent, rec.Code)
	}

	// Verify it's cancelled
	req = httptest.NewRequest(http.MethodGet, "/api/v1/leave/"+createdLeave.ID.String(), nil)
	req.Header.Set("Authorization", authHeader)
	rec = httptest.NewRecorder()

	e.ServeHTTP(rec, req)

	var cancelledLeave models.LeaveRequest
	json.Unmarshal(rec.Body.Bytes(), &cancelledLeave)

	if cancelledLeave.Status != models.LeaveStatusCancelled {
		t.Errorf("Expected status %q, got %q", models.LeaveStatusCancelled, cancelledLeave.Status)
	}
}

func TestLeaveIntegration_ManagerApproveReject(t *testing.T) {
	setupIntegrationTest(t)
	defer teardownIntegrationTest(t)

	employeeToken := testutil.CreateTestJWT("emp-1", "employee@example.com", "Employee One", []string{"employee"})
	managerToken := testutil.CreateTestJWT("mgr-1", "manager@example.com", "Manager One", []string{"manager"})

	employeeAuth := testutil.GetAuthHeader(employeeToken)
	managerAuth := testutil.GetAuthHeader(managerToken)

	// Employee creates leave request
	createReq := map[string]interface{}{
		"leaveType": "annual",
		"reason":    "Vacation time for rest",
		"startDate": "2024-06-01T00:00:00Z",
		"endDate":   "2024-06-05T00:00:00Z",
	}

	body, _ := json.Marshal(createReq)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/leave", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", employeeAuth)
	rec := httptest.NewRecorder()

	e.ServeHTTP(rec, req)

	var createdLeave models.LeaveRequest
	json.Unmarshal(rec.Body.Bytes(), &createdLeave)

	// Manager gets pending requests
	req = httptest.NewRequest(http.MethodGet, "/api/v1/manager/leave", nil)
	req.Header.Set("Authorization", managerAuth)
	rec = httptest.NewRecorder()

	e.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d. Body: %s", http.StatusOK, rec.Code, rec.Body.String())
		return
	}

	var pendingLeaves []*models.LeaveRequest
	json.Unmarshal(rec.Body.Bytes(), &pendingLeaves)

	if len(pendingLeaves) != 1 {
		t.Errorf("Expected 1 pending leave, got %d", len(pendingLeaves))
	}

	// Manager approves leave request
	approveReq := map[string]interface{}{
		"comment": "Approved! Enjoy your vacation",
	}

	body, _ = json.Marshal(approveReq)
	req = httptest.NewRequest(http.MethodPut, "/api/v1/manager/leave/"+createdLeave.ID.String()+"/approve", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", managerAuth)
	rec = httptest.NewRecorder()

	e.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d. Body: %s", http.StatusOK, rec.Code, rec.Body.String())
		return
	}

	var approvedLeave models.LeaveRequest
	json.Unmarshal(rec.Body.Bytes(), &approvedLeave)

	if approvedLeave.Status != models.LeaveStatusApproved {
		t.Errorf("Expected status %q, got %q", models.LeaveStatusApproved, approvedLeave.Status)
	}

	if approvedLeave.ManagerComment != "Approved! Enjoy your vacation" {
		t.Errorf("Expected comment %q, got %q", "Approved! Enjoy your vacation", approvedLeave.ManagerComment)
	}

	// Verify employee can see approved status
	req = httptest.NewRequest(http.MethodGet, "/api/v1/leave/"+createdLeave.ID.String(), nil)
	req.Header.Set("Authorization", employeeAuth)
	rec = httptest.NewRecorder()

	e.ServeHTTP(rec, req)

	var employeeView models.LeaveRequest
	json.Unmarshal(rec.Body.Bytes(), &employeeView)

	if employeeView.Status != models.LeaveStatusApproved {
		t.Errorf("Expected status %q, got %q", models.LeaveStatusApproved, employeeView.Status)
	}
}

func TestLeaveIntegration_ManagerReject(t *testing.T) {
	setupIntegrationTest(t)
	defer teardownIntegrationTest(t)

	employeeToken := testutil.CreateTestJWT("emp-1", "employee@example.com", "Employee One", []string{"employee"})
	managerToken := testutil.CreateTestJWT("mgr-1", "manager@example.com", "Manager One", []string{"manager"})

	employeeAuth := testutil.GetAuthHeader(employeeToken)
	managerAuth := testutil.GetAuthHeader(managerToken)

	// Employee creates leave request
	createReq := map[string]interface{}{
		"leaveType": "annual",
		"reason":    "Vacation time for rest",
		"startDate": "2024-06-01T00:00:00Z",
		"endDate":   "2024-06-05T00:00:00Z",
	}

	body, _ := json.Marshal(createReq)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/leave", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", employeeAuth)
	rec := httptest.NewRecorder()

	e.ServeHTTP(rec, req)

	var createdLeave models.LeaveRequest
	json.Unmarshal(rec.Body.Bytes(), &createdLeave)

	// Manager rejects leave request
	rejectReq := map[string]interface{}{
		"comment": "Not enough leave balance available for this period",
	}

	body, _ = json.Marshal(rejectReq)
	req = httptest.NewRequest(http.MethodPut, "/api/v1/manager/leave/"+createdLeave.ID.String()+"/reject", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", managerAuth)
	rec = httptest.NewRecorder()

	e.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d. Body: %s", http.StatusOK, rec.Code, rec.Body.String())
		return
	}

	var rejectedLeave models.LeaveRequest
	json.Unmarshal(rec.Body.Bytes(), &rejectedLeave)

	if rejectedLeave.Status != models.LeaveStatusRejected {
		t.Errorf("Expected status %q, got %q", models.LeaveStatusRejected, rejectedLeave.Status)
	}

	if rejectedLeave.ManagerComment == "" {
		t.Error("Expected manager comment, got empty")
	}
}

func TestLeaveIntegration_UnauthorizedAccess(t *testing.T) {
	setupIntegrationTest(t)
	defer teardownIntegrationTest(t)

	employeeToken := testutil.CreateTestJWT("emp-1", "employee@example.com", "Employee One", []string{"employee"})
	otherEmployeeToken := testutil.CreateTestJWT("emp-2", "employee2@example.com", "Employee Two", []string{"employee"})

	employeeAuth := testutil.GetAuthHeader(employeeToken)
	otherAuth := testutil.GetAuthHeader(otherEmployeeToken)

	// Employee 1 creates leave request
	createReq := map[string]interface{}{
		"leaveType": "annual",
		"reason":    "Vacation time",
		"startDate": "2024-06-01T00:00:00Z",
		"endDate":   "2024-06-05T00:00:00Z",
	}

	body, _ := json.Marshal(createReq)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/leave", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", employeeAuth)
	rec := httptest.NewRecorder()

	e.ServeHTTP(rec, req)

	var createdLeave models.LeaveRequest
	json.Unmarshal(rec.Body.Bytes(), &createdLeave)

	// Employee 2 tries to access Employee 1's leave request
	req = httptest.NewRequest(http.MethodGet, "/api/v1/leave/"+createdLeave.ID.String(), nil)
	req.Header.Set("Authorization", otherAuth)
	rec = httptest.NewRecorder()

	e.ServeHTTP(rec, req)

	if rec.Code != http.StatusForbidden {
		t.Errorf("Expected status %d, got %d", http.StatusForbidden, rec.Code)
	}
}

func TestLeaveIntegration_ManagerOnlyEndpoints(t *testing.T) {
	setupIntegrationTest(t)
	defer teardownIntegrationTest(t)

	employeeToken := testutil.CreateTestJWT("emp-1", "employee@example.com", "Employee One", []string{"employee"})
	employeeAuth := testutil.GetAuthHeader(employeeToken)

	// Employee tries to access manager endpoint
	req := httptest.NewRequest(http.MethodGet, "/api/v1/manager/leave", nil)
	req.Header.Set("Authorization", employeeAuth)
	rec := httptest.NewRecorder()

	e.ServeHTTP(rec, req)

	if rec.Code != http.StatusForbidden {
		t.Errorf("Expected status %d, got %d", http.StatusForbidden, rec.Code)
	}
}

func TestLeaveIntegration_InvalidToken(t *testing.T) {
	setupIntegrationTest(t)
	defer teardownIntegrationTest(t)

	// Request without token
	req := httptest.NewRequest(http.MethodGet, "/api/v1/leave", nil)
	rec := httptest.NewRecorder()

	e.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Errorf("Expected status %d, got %d", http.StatusUnauthorized, rec.Code)
	}

	// Request with invalid token
	req = httptest.NewRequest(http.MethodGet, "/api/v1/leave", nil)
	req.Header.Set("Authorization", "Bearer invalid.token.here")
	rec = httptest.NewRecorder()

	e.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Errorf("Expected status %d, got %d", http.StatusUnauthorized, rec.Code)
	}
}

