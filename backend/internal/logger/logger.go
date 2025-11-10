package logger

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"
)

// Level represents log level
type Level int

const (
	LevelDebug Level = iota
	LevelInfo
	LevelWarn
	LevelError
)

var (
	currentLevel Level
	appName      = "lms"
)

func init() {
	env := os.Getenv("ENV")
	if env == "development" || env == "" {
		currentLevel = LevelDebug
	} else {
		currentLevel = LevelInfo
	}
}

// Logger provides structured logging with context
type Logger struct {
	fields map[string]interface{}
}

// New creates a new logger instance
func New() *Logger {
	return &Logger{
		fields: make(map[string]interface{}),
	}
}

// With adds a field to the logger context
func (l *Logger) With(key string, value interface{}) *Logger {
	newLogger := New()
	for k, v := range l.fields {
		newLogger.fields[k] = v
	}
	newLogger.fields[key] = value
	return newLogger
}

// WithFields adds multiple fields to the logger context
func (l *Logger) WithFields(fields map[string]interface{}) *Logger {
	newLogger := New()
	for k, v := range l.fields {
		newLogger.fields[k] = v
	}
	for k, v := range fields {
		newLogger.fields[k] = v
	}
	return newLogger
}

// WithRequestID adds request ID to logger context
func (l *Logger) WithRequestID(requestID string) *Logger {
	return l.With("request_id", requestID)
}

// WithUser adds user context to logger
func (l *Logger) WithUser(userID, userEmail string) *Logger {
	return l.WithFields(map[string]interface{}{
		"user_id":    userID,
		"user_email": userEmail,
	})
}

// format formats the log message with fields
func (l *Logger) format(level, message string) string {
	timestamp := time.Now().Format("2006-01-02T15:04:05.000Z07:00")
	output := fmt.Sprintf("[%s] %s [%s]", timestamp, level, appName)

	if len(l.fields) > 0 {
		for k, v := range l.fields {
			output += fmt.Sprintf(" %s=%v", k, v)
		}
	}

	output += fmt.Sprintf(" msg=%q", message)
	return output
}

// Debug logs a debug message
func (l *Logger) Debug(message string) {
	if currentLevel <= LevelDebug {
		log.Println(l.format("DEBUG", message))
	}
}

// Debugf logs a formatted debug message
func (l *Logger) Debugf(format string, args ...interface{}) {
	if currentLevel <= LevelDebug {
		l.Debug(fmt.Sprintf(format, args...))
	}
}

// Info logs an info message
func (l *Logger) Info(message string) {
	if currentLevel <= LevelInfo {
		log.Println(l.format("INFO", message))
	}
}

// Infof logs a formatted info message
func (l *Logger) Infof(format string, args ...interface{}) {
	if currentLevel <= LevelInfo {
		l.Info(fmt.Sprintf(format, args...))
	}
}

// Warn logs a warning message
func (l *Logger) Warn(message string) {
	if currentLevel <= LevelWarn {
		log.Println(l.format("WARN", message))
	}
}

// Warnf logs a formatted warning message
func (l *Logger) Warnf(format string, args ...interface{}) {
	if currentLevel <= LevelWarn {
		l.Warn(fmt.Sprintf(format, args...))
	}
}

// Error logs an error message
func (l *Logger) Error(message string) {
	if currentLevel <= LevelError {
		log.Println(l.format("ERROR", message))
	}
}

// Errorf logs a formatted error message
func (l *Logger) Errorf(format string, args ...interface{}) {
	if currentLevel <= LevelError {
		l.Error(fmt.Sprintf(format, args...))
	}
}

// FromContext creates a logger from context (extracts request ID and user info)
func FromContext(ctx context.Context) *Logger {
	logger := New()

	if requestID := ctx.Value("request_id"); requestID != nil {
		logger = logger.WithRequestID(requestID.(string))
	}

	if userID := ctx.Value("user_id"); userID != nil {
		if userEmail := ctx.Value("user_email"); userEmail != nil {
			logger = logger.WithUser(userID.(string), userEmail.(string))
		}
	}

	return logger
}

// SetLevel sets the current log level
func SetLevel(level Level) {
	currentLevel = level
}

// GetLevel returns the current log level
func GetLevel() Level {
	return currentLevel
}

