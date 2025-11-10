# Leave Management System - Quick Setup Guide

This guide will help you set up and run the Leave Management System quickly.

## Prerequisites

- **Node.js** 18+ and npm
- **Go** 1.21+
- **PostgreSQL** 15+ (or use Docker)
- **Keycloak** (already set up for authentication)

## Quick Start

### 1. Backend Setup (Go)

```bash
# Navigate to backend directory
cd backend

# Install dependencies
go mod download
go mod tidy

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Set up PostgreSQL database
createdb leave_management
# Or use Docker: docker run -d --name postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=leave_management -p 5432:5432 postgres:15-alpine

# Run migrations (requires migrate tool)
# Install migrate: https://github.com/golang-migrate/migrate
make migrate-up

# Start the backend server
make run
# Or: go run cmd/server/main.go
```

The backend will start on `http://localhost:8081`.

### 2. Frontend Setup (Next.js)

```bash
# From project root
cd ..

# Install dependencies (if not already done)
npm install

# Add backend URL to .env.local
echo "BACKEND_URL=http://localhost:8081" >> .env.local

# Start the development server
npm run dev
```

The frontend will start on `http://localhost:3000`.

### 3. Using Docker (Alternative)

If you prefer Docker:

```bash
# From backend directory
cd backend

# Start PostgreSQL and backend services
docker-compose up -d

# Run migrations
make migrate-up
```

## Environment Variables

### Backend (.env)

```env
PORT=8081
ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=leave_management
DB_SSLMODE=disable
JWT_SECRET=your-nextauth-secret-here
NEXTAUTH_URL=http://localhost:3000
KEYCLOAK_ISSUER=http://localhost:8080/realms/next
KEYCLOAK_CLIENT_ID=next
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@company.com
```

### Frontend (.env.local)

```env
BACKEND_URL=http://localhost:8081
```

## Testing the System

1. **Login** to the application with your Keycloak credentials
2. **As Employee**:
   - Navigate to "My Leaves" from the navigation
   - Click "+ New Leave Request"
   - Fill in the form and submit
3. **As Manager**:
   - Navigate to "Leave Requests" from the navigation
   - View pending requests
   - Approve or reject requests with comments

## Troubleshooting

### Backend won't start

- Check PostgreSQL is running: `pg_isready`
- Verify database credentials in `.env`
- Ensure migrations have been run: `make migrate-up`
- Check port 8081 is available

### Frontend can't connect to backend

- Verify `BACKEND_URL` in `.env.local`
- Check backend is running: `curl http://localhost:8081/health`
- Verify CORS settings in backend
- Check browser console for errors

### Database connection errors

- Verify PostgreSQL is running
- Check database exists: `psql -l | grep leave_management`
- Verify credentials match `.env` file
- Check network connectivity

### Authentication issues

- Verify JWT token is being sent (check Network tab)
- Check token is valid and not expired
- Verify user has correct roles (employee/manager/admin)
- Check Keycloak is running and accessible

## API Testing

### Using curl

```bash
# Get access token from Next.js session first, then:

# Create leave request
curl -X POST http://localhost:8081/api/v1/leave \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "leaveType": "annual",
    "reason": "Vacation",
    "startDate": "2024-01-01",
    "endDate": "2024-01-05"
  }'

# Get all leave requests
curl -X GET http://localhost:8081/api/v1/leave \
  -H "Authorization: Bearer YOUR_TOKEN"

# Approve leave request (manager only)
curl -X PUT http://localhost:8081/api/v1/manager/leave/123/approve \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"comment": "Approved"}'
```

## Next Steps

- Configure email notifications (SMTP settings)
- Set up production database
- Configure production environment variables
- Set up CI/CD pipeline
- Add monitoring and logging
- Review security settings

For detailed information, see `LMS_IMPLEMENTATION.md`.

