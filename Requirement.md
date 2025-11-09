1. Project Overview

This project aims to create a Next.js application (using the latest stable Next.js and React versions with TypeScript) that integrates with Keycloak using the OpenID Connect (OIDC) protocol via NextAuth.js.
The goal is to provide a real-world, production-ready authentication flow, including:

Login with Keycloak (OIDC)

Federated logout

Protected routes

Clean, maintainable structure

Comprehensive unit test coverage for all authentication logic and UI components

2. Key Requirements
2.1 Functional Requirements
Authentication & Session Handling

The system must use Keycloak as the Identity Provider via OpenID Connect.

Authentication should be handled via NextAuth.js with KeycloakProvider.

JWT sessions are to be used with automatic token refresh logic.

Support both login and logout using federated endpoints.

Store and refresh access_token, id_token, and refresh_token properly.

Pages & Components

Login Page

Displays a “Login with Keycloak” button.

Redirects user to Keycloak’s login screen.

On success, redirects back to /.

Logout Component

Provides a federated logout that logs out from both Keycloak and the Next.js session.

Redirects back to / after logout.

Protected Page (Secured Page)

Accessible only to authenticated users.

Uses PrivateRoute middleware to restrict access.

Displays username when logged in.

Navigation (Nav.js)

Displays login/logout and navigation to secured page depending on session state.

Session Provider

Use SessionProvider in a global context (Providers.js) to share authentication state across components.

PrivateRoute Middleware

Protects routes that require authentication using getServerSession.

Redirects or hides content if not logged in.

2.2 Non-Functional Requirements
Category	Requirement
Performance	Login flow should complete within 2 seconds in a local environment.
Security	Secure tokens must not be exposed client-side. Use environment variables for all credentials.
Maintainability	Codebase should follow clean architecture and best practices (clear folder separation, reusable hooks).
Scalability	Should support additional providers with minimal changes.
Testing	100% coverage for auth logic, 80%+ for UI components. Use Jest and React Testing Library.
Documentation	Include README explaining setup, env vars, and test execution.
3. Project Structure
root/
├─ app/
│  ├─ api/
│  │  ├─ auth/
│  │  │  ├─ [...nextauth]/route.js
│  │  │  ├─ federated-logout/route.js
│  ├─ Providers.js
│  ├─ layout.js
│  ├─ page.js
│  └─ Secured/page.js
│
├─ components/
│  ├─ Login.js
│  ├─ Logout.js
│  ├─ Nav.js
│  ├─ Securedpage.js
│
├─ helpers/
│  └─ PrivateRoute.js
│
├─ utils/
│  └─ federatedLogout.js
│
├─ tests/
│  ├─ auth.test.ts
│  ├─ nav.test.tsx
│  ├─ privateRoute.test.ts
│
├─ .env
├─ globals.css
└─ package.json

4. Environment Configuration (.env)
KEYCLOAK_CLIENT_ID="next"
KEYCLOAK_CLIENT_SECRET="your-secret"
KEYCLOAK_ISSUER="http://localhost:8080/realms/next"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="random-secret"

5. Implementation Summary
Key Packages
npm install next-auth
npm install --save-dev jest @testing-library/react @testing-library/jest-dom

Login Flow

User clicks “Login with Keycloak”.

Redirects to Keycloak login.

After authentication, NextAuth processes tokens.

Session data becomes available globally via SessionProvider.

Logout Flow

User clicks “Logout”.

Triggers federatedLogout() utility.

Calls Keycloak’s end session endpoint.

Ends both Keycloak and NextAuth sessions.

6. Unit Testing Requirements
Tools

Jest

React Testing Library

Test Cases
Area	Test Description
Login Component	Should render login button and trigger signIn("keycloak").
Logout Component	Should call federatedLogout() and redirect.
PrivateRoute	Should render children only if session is valid.
API Routes	Should correctly handle /federated-logout responses.
Session Handling	Should refresh tokens when expired.
Nav	Should show Login or Logout based on session.
Coverage Goal

Statements: 100%

Branches: 95%

Functions: 100%

Lines: 100%

7. Deployment Requirements

The app must run on:

Node.js 20+

Next.js 15+

Keycloak 25+ (local instance or hosted)

Use .env.local for secrets in local dev.

CI/CD pipeline should include:

Linting

Type checking

Unit tests

8. Deliverables

Fully functional Next.js project integrated with Keycloak.

Clean authentication flow (login/logout).

Protected route example.

Jest-based test coverage.

Documentation with setup steps and explanation.