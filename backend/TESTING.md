# Testing Guide - Leave Management System Backend

This document describes the testing strategy and how to run tests for the Go backend.

## Test Structure

Tests are organized alongside the code they test:

```
backend/
├── internal/
│   ├── models/
│   │   └── leave_test.go          # Model tests
│   ├── services/
│   │   ├── leave_test.go          # Service layer tests
│   │   └── email_test.go          # Email service tests
│   ├── handlers/
│   │   ├── leave_test.go          # Handler tests
│   │   └── manager_test.go       # Manager handler tests
│   ├── repository/
│   │   └── leave_repository_test.go # Repository tests
│   ├── middleware/
│   │   └── auth_test.go           # Middleware tests
│   ├── utils/
│   │   ├── jwt_test.go            # JWT utility tests
│   │   └── validator_test.go     # Validator tests
│   ├── config/
│   │   └── config_test.go        # Config tests
│   └── integration/
│       └── leave_integration_test.go # Integration tests
├── internal/testutil/
│   ├── testutil.go               # Test utilities
│   └── auth.go                   # Auth test helpers
```

## Running Tests

### Run All Tests
```bash
make test
# or
go test -v ./...
```

### Run Unit Tests Only
```bash
make test-unit
# or
go test -v ./internal/models ./internal/services ./internal/repository ./internal/utils ./internal/config ./internal/middleware
```

### Run Integration Tests Only
```bash
make test-integration
# or
go test -v ./internal/integration
```

### Run Tests with Coverage
```bash
make test-coverage
# or
go test -v -coverprofile=coverage.out ./...
go tool cover -html=coverage.out
```

### Run Tests with Race Detector
```bash
make test-race
# or
go test -race -v ./...
```

### Run Specific Test Package
```bash
go test -v ./internal/services
go test -v ./internal/handlers
```

### Run Specific Test
```bash
go test -v ./internal/services -run TestLeaveService_CreateLeaveRequest
```

## Test Categories

### Unit Tests

**Models** (`internal/models/leave_test.go`)
- `CalculateDays` - Tests weekday calculation logic
- Leave type and status constants

**Services** (`internal/services/leave_test.go`)
- `CreateLeaveRequest` - Create with various scenarios
- `GetLeaveRequestByID` - Get by ID, handle not found
- `UpdateLeaveRequest` - Update with authorization checks
- `CancelLeaveRequest` - Cancel with status validation
- `ApproveLeaveRequest` - Approve with status checks
- `RejectLeaveRequest` - Reject with status checks

**Repository** (`internal/repository/leave_repository_test.go`)
- Mock repository implementation tests
- CRUD operations
- Query methods

**Utils** (`internal/utils/`)
- JWT token extraction
- Date validation
- User role checking

### Integration Tests

**Integration Tests** (`internal/integration/leave_integration_test.go`)
- Full HTTP request/response cycle
- Database interactions
- End-to-end workflows
- Authentication and authorization
- Multiple components working together

**Test Scenarios**:
- Create and retrieve leave requests
- Update and cancel leave requests
- Manager approval workflow
- Manager rejection workflow
- Unauthorized access attempts
- Role-based access control
- Invalid token handling

## Mock Objects

### MockLeaveRepository

Located in `internal/repository/mock_repository.go`, this provides an in-memory implementation of `LeaveRepository` for testing without a database.

```go
repo := repository.NewMockLeaveRepository()
service := services.NewLeaveService(repo)
```

## Test Utilities

### Test Database Setup

Located in `internal/testutil/testutil.go`:

```go
// Setup test database
db := testutil.SetupTestDB(t)

// Run migrations
testutil.RunMigrations(t, db)

// Cleanup after test
defer testutil.CleanupTestDB(t, db)
```

### Test JWT Tokens

Located in `internal/testutil/auth.go`:

```go
// Create test token
token := testutil.CreateTestJWT("user-1", "user@example.com", "User Name", []string{"employee"})
authHeader := testutil.GetAuthHeader(token)
```

## Test Database Configuration

Integration tests use a separate test database. Configure via environment variables:

```bash
export TEST_DB_HOST=localhost
export TEST_DB_PORT=5432
export TEST_DB_USER=postgres
export TEST_DB_PASSWORD=postgres
export TEST_DB_NAME=leave_management_test
export TEST_DB_SSLMODE=disable
```

Or set defaults in `testutil/testutil.go`.

## Test Coverage Goals

- **Models**: 100% coverage
- **Services**: >90% coverage
- **Handlers**: >80% coverage
- **Repository**: >85% coverage
- **Utils**: >90% coverage
- **Integration**: >70% coverage of critical paths

## Writing New Tests

### Unit Tests

```go
func TestService_Method(t *testing.T) {
    repo := repository.NewMockLeaveRepository()
    service := NewService(repo)
    
    // Test implementation
}
```

### Integration Tests

```go
func TestIntegration_Scenario(t *testing.T) {
    setupIntegrationTest(t)
    defer teardownIntegrationTest(t)
    
    // Full HTTP request/response test
    req := httptest.NewRequest(http.MethodPost, "/api/v1/leave", body)
    req.Header.Set("Authorization", authHeader)
    rec := httptest.NewRecorder()
    
    e.ServeHTTP(rec, req)
    
    // Assertions
}
```

## Best Practices

1. **Use Table-Driven Tests**: Most tests use table-driven approach for better coverage
2. **Mock Dependencies**: Use mock repository for unit tests
3. **Test Database**: Use separate test database for integration tests
4. **Test Edge Cases**: Include error cases, boundary conditions
5. **Test Authorization**: Verify role-based access control
6. **Test Validation**: Ensure input validation works correctly
7. **Isolate Tests**: Each test should be independent
8. **Cleanup**: Always cleanup test data after tests

## Continuous Integration

Tests should be run:
- Before committing code
- In CI/CD pipeline
- Before merging pull requests

## Troubleshooting

### Tests Fail with Database Errors
- Ensure test database exists: `createdb leave_management_test`
- Check database connection settings
- Verify migrations are run: `testutil.RunMigrations(t, db)`

### Import Errors
- Run `go mod tidy` to ensure dependencies are correct
- Verify module path matches `go.mod`

### Race Conditions
- Use `go test -race` to detect race conditions
- Ensure proper synchronization in concurrent code

### Integration Tests Fail
- Ensure test database is accessible
- Check that migrations have been run
- Verify JWT token format matches middleware expectations

## Test Execution Time

- **Unit Tests**: Fast (< 1 second)
- **Integration Tests**: Slower (requires database, ~5-10 seconds)
- **Full Test Suite**: ~10-15 seconds

For faster feedback during development, run unit tests only:
```bash
make test-unit
```
