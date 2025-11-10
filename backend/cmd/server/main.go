package main

import (
	"context"
	"fmt"
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
	"leave-management-system/internal/logger"
)

func main() {
	log := logger.New()

	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Errorf("startup_failed reason=config_load error=%v", err)
		os.Exit(1)
	}

	log.Infof("config_loaded env=%s port=%s", cfg.Env, cfg.Port)

	// Connect to database
	if err := database.Connect(cfg); err != nil {
		log.Errorf("startup_failed reason=db_connect error=%v", err)
		os.Exit(1)
	}
	defer database.Close()

	log.Info("database_connected")

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

	// Middleware (order matters)
	e.Use(authMiddleware.RequestLogger()) // Must be first to set up request ID
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
			log.Errorf("server_start_failed port=%s error=%v", cfg.Port, err)
			os.Exit(1)
		}
	}()

	log.Infof("server_started port=%s env=%s", cfg.Port, cfg.Env)

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt)
	<-quit

	log.Info("server_shutdown_start")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := e.Shutdown(ctx); err != nil {
		log.Errorf("server_shutdown_failed error=%v", err)
		os.Exit(1)
	}

	log.Info("server_shutdown_complete")
}

