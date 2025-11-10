# Leave Management System - Backend API

Go backend service for the Leave Management System using Echo framework.

## Architecture

- **Framework**: Echo v4
- **Database**: PostgreSQL
- **ORM**: Raw SQL with `database/sql` (lightweight approach)
- **Authentication**: JWT tokens from Next.js/NextAuth
- **Email**: SMTP (configurable for SendGrid, AWS SES, etc.)

## Project Structure

```
backend/
├── cmd/
│   └── server/
│       └── main.go          # Application entry point
├── internal/
│   ├── config/
│   │   ├── config.go        # Configuration loading
│   │   └── config_test.go  # Config tests
│   ├── database/
│   │   └── db.go            # Database connection
│   ├── models/
│   │   ├── leave.go         # Leave request model
│   │   └── leave_test.go   # Model tests
│   ├── repository/
│   │   ├── leave_repository.go      # Data access layer
│   │   ├── mock_repository.go       # Mock for testing
│   │   ├── repository.go            # Package docs
│   │   └── leave_repository_test.go # Repository tests
│   ├── handlers/
│   │   ├── leave.go         # Employee leave handlers
│   │   ├── leave_test.go    # Handler tests
│   │   ├── manager.go       # Manager leave handlers
│   │   └── manager_test.go  # Manager handler tests
│   ├── services/
│   │   ├── leave.go         # Leave business logic
│   │   ├── leave_test.go    # Service tests
│   │   ├── email.go         # Email notification service
│   │   └── email_test.go    # Email service tests
│   ├── middleware/
│   │   ├── auth.go          # JWT authentication
│   │   ├── auth_test.go     # Middleware tests
│   │   └── cors.go          # CORS configuration
│   ├── utils/
│   │   ├── jwt.go           # JWT token validation
│   │   ├── jwt_test.go      # JWT tests
│   │   ├── validator.go    # Request validation
│   │   └── validator_test.go # Validator tests
│   ├── integration/
│   │   └── leave_integration_test.go # Integration tests
│   └── testutil/
│       ├── testutil.go      # Test utilities
│       └── auth.go          # Auth test helpers
├── migrations/               # Database migration files
├── scripts/
│   └── init-db.sh          # Database initialization
├── go.mod
├── go.sum
├── Makefile
├── .golangci.yml            # Linter configuration
├── TESTING.md               # Testing guide
├── ARCHITECTURE.md          # Architecture documentation
└── README.md
```

## Setup

1. **Install Go dependencies**:
   ```bash
   make deps
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Set up PostgreSQL database**:
   ```bash
   createdb leave_management
   ```

4. **Run migrations**:
   ```bash
   make migrate-up
   ```

5. **Run the server**:
   ```bash
   make run
   ```

The server will start on `http://localhost:8081` by default.

## API Endpoints

### Employee Endpoints

- `POST /api/v1/leave` - Create leave request
- `GET /api/v1/leave` - Get all leave requests for current user
- `GET /api/v1/leave/:id` - Get leave request by ID
- `PUT /api/v1/leave/:id` - Update leave request (pending only)
- `DELETE /api/v1/leave/:id` - Cancel leave request (pending only)

### Manager Endpoints

- `GET /api/v1/manager/leave` - Get all pending leave requests
- `PUT /api/v1/manager/leave/:id/approve` - Approve leave request
- `PUT /api/v1/manager/leave/:id/reject` - Reject leave request

## Authentication

The backend validates JWT tokens from Next.js/NextAuth. Include the token in the `Authorization` header:

```
Authorization: Bearer <jwt-token>
```

The token is validated and user information is extracted for authorization checks.

## Database Schema

See `migrations/001_create_leave_requests.up.sql` for the database schema.

## Testing

### Run All Tests
```bash
make test
```

### Run Unit Tests Only
```bash
make test-unit
```

### Run Integration Tests Only
```bash
make test-integration
```

### Run Tests with Coverage
```bash
make test-coverage
```

### Run Tests with Race Detector
```bash
make test-race
```

### Test Structure
- **Unit Tests**: Models, services, repository, utils, middleware, config
- **Integration Tests**: Full HTTP request/response cycle with database
- **Mock Objects**: Mock repository for testing without database

See `TESTING.md` for detailed testing guide.

## Code Quality

### Linting
```bash
# Install golangci-lint first: https://golangci-lint.run/usage/install/
golangci-lint run
```

### Code Organization
- **Repository Pattern**: Data access layer abstraction
- **Dependency Injection**: Services receive dependencies via constructors
- **Interface-Based Design**: Easy to mock and test
- **Separation of Concerns**: Clear boundaries between layers

See `ARCHITECTURE.md` for detailed architecture documentation.
