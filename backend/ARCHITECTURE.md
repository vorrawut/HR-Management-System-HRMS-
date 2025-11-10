# Backend Architecture

This document describes the architecture and design patterns used in the Leave Management System backend.

## Architecture Overview

The backend follows a **layered architecture** with clear separation of concerns:

```
┌─────────────────────────────────────┐
│         HTTP Handlers                │  (Presentation Layer)
│    (Echo route handlers)             │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│         Services                     │  (Business Logic Layer)
│    (Business rules & validation)     │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│         Repository                   │  (Data Access Layer)
│    (Database operations)             │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│         Database                     │  (PostgreSQL)
└─────────────────────────────────────┘
```

## Design Patterns

### 1. Repository Pattern

The Repository pattern abstracts database operations, making the code:
- **Testable**: Easy to mock for unit tests
- **Maintainable**: Database changes don't affect business logic
- **Flexible**: Can swap database implementations

**Interface** (`internal/repository/leave_repository.go`):
```go
type LeaveRepository interface {
    Create(leave *models.LeaveRequest) error
    FindByID(id uuid.UUID) (*models.LeaveRequest, error)
    FindByEmployeeID(employeeID string) ([]*models.LeaveRequest, error)
    FindPending() ([]*models.LeaveRequest, error)
    Update(leave *models.LeaveRequest) error
    UpdateStatus(id uuid.UUID, status models.LeaveStatus, comment string) error
}
```

**Implementation**: `leaveRepository` uses raw SQL with `database/sql`

**Mock**: `MockLeaveRepository` for testing

### 2. Dependency Injection

Services receive dependencies via constructors, not global variables:

```go
// ✅ Good - Dependency Injection
func NewLeaveService(repo LeaveRepository) *LeaveService {
    return &LeaveService{repo: repo}
}

// ❌ Bad - Global dependency
func NewLeaveService() *LeaveService {
    return &LeaveService{db: database.DB} // Hard to test
}
```

### 3. Service Layer Pattern

Business logic is separated from HTTP handling:

- **Handlers**: Handle HTTP requests/responses, validation, error formatting
- **Services**: Contain business logic, rules, and orchestration
- **Repository**: Only data access, no business logic

### 4. Error Handling

Consistent error handling across layers:

```go
// Service layer returns domain errors
var (
    ErrLeaveNotFound      = errors.New("leave request not found")
    ErrUnauthorizedAction = errors.New("unauthorized action")
    ErrInvalidStatus      = errors.New("invalid status transition")
)

// Handler layer converts to HTTP errors
if err == services.ErrLeaveNotFound {
    return echo.NewHTTPError(http.StatusNotFound, "Leave request not found")
}
```

## Layer Responsibilities

### Handlers (`internal/handlers/`)

**Responsibilities**:
- Parse HTTP requests
- Extract user context from middleware
- Call service methods
- Format HTTP responses
- Handle HTTP-specific errors

**Should NOT**:
- Contain business logic
- Access database directly
- Make business decisions

**Example**:
```go
func (h *LeaveHandler) CreateLeaveRequest(c echo.Context) error {
    userID, err := middleware.GetUserID(c)
    if err != nil {
        return echo.NewHTTPError(http.StatusUnauthorized, err.Error())
    }
    
    var req models.CreateLeaveRequest
    if err := c.Bind(&req); err != nil {
        return echo.NewHTTPError(http.StatusBadRequest, "Invalid request body")
    }
    
    leave, err := h.leaveService.CreateLeaveRequest(&req, userID, ...)
    if err != nil {
        return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
    }
    
    return c.JSON(http.StatusCreated, leave)
}
```

### Services (`internal/services/`)

**Responsibilities**:
- Implement business rules
- Validate business logic
- Orchestrate operations
- Handle business errors

**Should NOT**:
- Know about HTTP
- Access database directly (use repository)
- Format HTTP responses

**Example**:
```go
func (s *LeaveService) CreateLeaveRequest(...) (*models.LeaveRequest, error) {
    // Business logic: calculate days
    days := models.CalculateDays(req.StartDate, req.EndDate)
    if days <= 0 {
        return nil, errors.New("invalid date range")
    }
    
    // Create entity
    leaveRequest := &models.LeaveRequest{...}
    
    // Persist via repository
    if err := s.repo.Create(leaveRequest); err != nil {
        return nil, fmt.Errorf("failed to create: %w", err)
    }
    
    return leaveRequest, nil
}
```

### Repository (`internal/repository/`)

**Responsibilities**:
- Database operations (CRUD)
- Query building
- Data mapping
- Transaction management (if needed)

**Should NOT**:
- Contain business logic
- Make business decisions
- Know about HTTP

**Example**:
```go
func (r *leaveRepository) Create(leave *models.LeaveRequest) error {
    query := `INSERT INTO leave_requests (...) VALUES (...) RETURNING ...`
    return r.db.QueryRow(query, ...).Scan(...)
}
```

### Models (`internal/models/`)

**Responsibilities**:
- Define data structures
- Provide domain logic (e.g., `CalculateDays`)
- Type definitions and constants

**Should NOT**:
- Know about database
- Know about HTTP
- Contain business orchestration

## Dependency Flow

```
main.go
  ├── database.Connect()
  ├── repository.NewLeaveRepository(db)
  ├── services.NewLeaveService(repo)
  ├── services.NewEmailService(cfg)
  ├── handlers.NewLeaveHandler(service)
  └── handlers.NewManagerHandler(service, emailService)
```

## Testing Strategy

### Unit Tests
- **Services**: Test business logic with mock repository
- **Repository**: Test data access with mock database (or test DB)
- **Models**: Test domain logic (e.g., `CalculateDays`)
- **Utils**: Test utility functions

### Integration Tests
- **Handlers**: Test HTTP endpoints with mock services
- **Middleware**: Test authentication and authorization

### Mock Objects
- `MockLeaveRepository`: In-memory implementation for testing
- No database required for unit tests

## Best Practices

### 1. Error Handling
- Use domain-specific errors in services
- Convert to HTTP errors in handlers
- Wrap errors with context: `fmt.Errorf("failed to create: %w", err)`

### 2. Validation
- Input validation in handlers (HTTP level)
- Business validation in services (domain level)
- Database constraints in schema

### 3. Testing
- Use dependency injection for testability
- Mock external dependencies
- Test edge cases and error scenarios
- Keep tests fast and isolated

### 4. Code Organization
- One file per type/function group
- Clear package boundaries
- Consistent naming conventions
- Document public APIs

### 5. Configuration
- Load from environment variables
- Provide sensible defaults
- Validate required settings
- Separate config from logic

## File Naming Conventions

- **Handlers**: `{resource}_handler.go` (e.g., `leave_handler.go`)
- **Services**: `{resource}_service.go` (e.g., `leave_service.go`)
- **Repository**: `{resource}_repository.go` (e.g., `leave_repository.go`)
- **Models**: `{resource}.go` (e.g., `leave.go`)
- **Tests**: `{file}_test.go` (e.g., `leave_test.go`)

## Benefits of This Architecture

1. **Testability**: Easy to test each layer in isolation
2. **Maintainability**: Clear separation of concerns
3. **Flexibility**: Easy to swap implementations
4. **Scalability**: Can scale each layer independently
5. **Readability**: Clear code organization and structure

## Future Enhancements

- Add transaction support in repository
- Implement caching layer
- Add event-driven architecture for notifications
- Implement CQRS pattern for read/write separation
- Add API versioning
- Implement rate limiting
- Add request logging and tracing

