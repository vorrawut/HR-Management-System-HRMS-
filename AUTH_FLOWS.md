# Authentication Flows

This document describes the login, logout, and password reset flows in the application.

## Login Flow

### User Journey

1. User clicks "Login with Keycloak" button (from home page or `/login`)
2. Redirects to `/login` page
3. User clicks "Sign in with Keycloak" button
4. Redirects to Keycloak login page
5. User enters credentials
6. **If first-time login with temporary password**: Keycloak automatically shows password reset form
7. User completes password reset (if needed)
8. Keycloak redirects back to `/api/auth/callback/keycloak`
9. NextAuth processes the tokens and creates session
10. User is redirected to the original destination (or home page)

### Pages & Components

- **`/login`** - Login page with error handling
- **`/components/LoginPage.tsx`** - Main login component
- **`/components/Login.tsx`** - Simple login button (redirects to `/login`)

### Error Handling

- Configuration errors
- Access denied errors
- Invalid credentials
- Password reset required (redirects to `/reset-password`)

## Logout Flow

### User Journey

1. User clicks "Logout" button
2. Redirects to `/logout` confirmation page
3. User confirms logout
4. App calls `/api/auth/federated-logout` to get Keycloak logout URL
5. NextAuth session is cleared
6. User is redirected to Keycloak logout endpoint
7. Keycloak clears its session
8. User is redirected back to home page

### Pages & Components

- **`/logout`** - Logout confirmation page
- **`/components/LogoutPage.tsx`** - Logout confirmation component
- **`/components/Logout.tsx`** - Simple logout button (redirects to `/logout`)
- **`/lib/auth/federatedLogout.ts`** - Federated logout logic

## Password Reset Flow

### First-Time Login (Admin Created User)

When an admin creates a user in Keycloak with a temporary password:

1. User goes to `/login` or `/reset-password`
2. Clicks "Login & Set Password" on reset password page
3. Redirects to Keycloak login
4. User enters temporary password
5. Keycloak automatically detects temporary password and shows password reset form
6. User sets new password
7. Keycloak redirects back to app
8. User is logged in with new password

### Forgot Password

1. User goes to `/reset-password`
2. Clicks "Request Reset Link"
3. Redirects to Keycloak password reset page
4. User enters email/username
5. Keycloak sends reset email (if configured)
6. User follows link in email
7. User sets new password
8. Redirects back to app login

### Pages & Components

- **`/reset-password`** - Password reset page
- **`/components/ResetPasswordPage.tsx`** - Password reset component
- **`/app/api/auth/keycloak-config/route.ts`** - API route to get Keycloak config

## Error Handling

### Auth Error Page

- **`/auth/error`** - Centralized error page for authentication errors
- Handles various error codes from NextAuth
- Provides helpful messages and next steps
- Detects password reset errors and redirects appropriately

### Error Types

- **Configuration**: Server configuration issue
- **AccessDenied**: User doesn't have permission
- **Verification**: Token expired or used
- **CredentialsSignin**: Invalid credentials
- **Password errors**: Redirects to password reset

## Keycloak Integration

The app uses Keycloak's built-in password reset functionality. When a user has a temporary password, Keycloak automatically shows the password reset form during login.

### Required Keycloak Settings

1. **Required Actions**: Enable "Update Password" as a required action
2. **User Creation**: When creating users, set password as "Temporary"
3. **Email**: Configure email server if using email-based password reset

## API Routes

### `/api/auth/keycloak-config`

Returns Keycloak configuration (issuer, clientId) for client-side use. Only exposes non-sensitive configuration.

### `/api/auth/federated-logout`

Handles federated logout by generating Keycloak logout URL.

## User Experience

All flows are designed to be:
- **Clear**: Users understand what's happening
- **Guided**: Helpful error messages and next steps
- **Secure**: Proper session handling and federated logout
- **Seamless**: Keycloak handles password reset automatically

