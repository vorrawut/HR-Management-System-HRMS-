package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"leave-management-system/internal/config"
	"leave-management-system/internal/database"
	"leave-management-system/internal/handlers"
	authMiddleware "leave-management-system/internal/middleware"
	"leave-management-system/internal/repository"
	"leave-management-system/internal/services"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Connect to database
	if err := database.Connect(cfg); err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer database.Close()

	// Initialize repository
	leaveRepo := repository.NewLeaveRepository(database.DB)

	// Initialize services
	leaveService := services.NewLeaveService(leaveRepo)
	emailService := services.NewEmailService(cfg)

	// Initialize handlers
	leaveHandler := handlers.NewLeaveHandler(leaveService)
	managerHandler := handlers.NewManagerHandler(leaveService, emailService)

	// Create Echo instance
	e := echo.New()

	// Middleware
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORSWithConfig(authMiddleware.CORSConfig()))

	// Health check endpoint
	e.GET("/health", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{"status": "ok"})
	})

	// API routes
	api := e.Group("/api/v1")

	// Employee leave routes (require authentication)
	leave := api.Group("/leave", authMiddleware.AuthMiddleware())
	leave.POST("", leaveHandler.CreateLeaveRequest)
	leave.GET("", leaveHandler.GetLeaveRequests)
	leave.GET("/:id", leaveHandler.GetLeaveRequest)
	leave.PUT("/:id", leaveHandler.UpdateLeaveRequest)
	leave.DELETE("/:id", leaveHandler.CancelLeaveRequest)

	// Manager routes (require authentication and manager role)
	manager := api.Group("/manager/leave", authMiddleware.AuthMiddleware(), authMiddleware.RequireRole("manager", "admin"))
	manager.GET("", managerHandler.GetPendingLeaveRequests)
	manager.PUT("/:id/approve", managerHandler.ApproveLeaveRequest)
	manager.PUT("/:id/reject", managerHandler.RejectLeaveRequest)

	// Start server
	port := fmt.Sprintf(":%s", cfg.Port)
	go func() {
		if err := e.Start(port); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	log.Printf("Server started on port %s", cfg.Port)

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt)
	<-quit

	log.Println("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := e.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("Server exited")
}

