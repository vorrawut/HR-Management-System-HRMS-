# NextAuth Keycloak Example

This is a Next.js application integrated with Keycloak using OpenID Connect (OIDC) protocol via NextAuth.js. The project provides a production-ready authentication flow with login, federated logout, and protected routes.

## Features

- ✅ Login with Keycloak (OIDC)
- ✅ Federated logout (logs out from both Keycloak and Next.js session)
- ✅ Protected routes using server-side session validation
- ✅ JWT session with automatic token refresh
- ✅ Clean, maintainable structure
- ✅ Comprehensive unit test coverage

## Prerequisites

- Node.js 20+
- Next.js 15+
- Keycloak 25+ (local instance or hosted)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Keycloak Configuration
KEYCLOAK_CLIENT_ID="next"
KEYCLOAK_CLIENT_SECRET="your-secret"
KEYCLOAK_ISSUER="http://localhost:8080/realms/next"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="random-secret"
```

**Important Notes:**
- Replace `KEYCLOAK_CLIENT_SECRET` with your actual Keycloak client secret
- Update `KEYCLOAK_ISSUER` to match your Keycloak realm URL
- Generate a secure random string for `NEXTAUTH_SECRET` (you can use `openssl rand -base64 32`)

### 3. Keycloak Configuration

1. Start your Keycloak instance (default: http://localhost:8080)
2. Create a new realm named "next" (or update the `KEYCLOAK_ISSUER` to match your realm)
3. Create a new client:
   - Client ID: `next` (or match your `KEYCLOAK_CLIENT_ID`)
   - Client Protocol: `openid-connect`
   - Access Type: `confidential`
   - Valid Redirect URIs: `http://localhost:3000/api/auth/callback/keycloak`
   - Web Origins: `http://localhost:3000`
4. Copy the client secret to your `.env.local` file

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Project Structure

```
root/
├─ app/
│  ├─ api/
│  │  ├─ auth/
│  │  │  ├─ [...nextauth]/route.ts    # NextAuth configuration
│  │  │  └─ federated-logout/route.ts # Federated logout endpoint
│  ├─ Providers.tsx                    # SessionProvider wrapper
│  ├─ layout.tsx                       # Root layout
│  ├─ page.tsx                         # Home page
│  └─ Secured/page.tsx                 # Protected page
│
├─ components/
│  ├─ Login.tsx                        # Login component
│  ├─ Logout.tsx                       # Logout component
│  ├─ Nav.tsx                          # Navigation component
│  └─ SecuredPage.tsx                  # Secured page component
│
├─ helpers/
│  └─ PrivateRoute.tsx                 # Route protection helper
│
├─ utils/
│  └─ federatedLogout.ts               # Federated logout utility
│
├─ tests/
│  ├─ auth.test.ts                     # Authentication tests
│  ├─ nav.test.tsx                     # Navigation tests
│  ├─ privateRoute.test.ts             # PrivateRoute tests
│  ├─ login.test.tsx                   # Login component tests
│  ├─ logout.test.tsx                  # Logout component tests
│  └─ federatedLogout.test.ts          # Federated logout tests
│
└─ types/
   └─ next-auth.d.ts                   # NextAuth type definitions
```

## Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Coverage Goals

- Statements: 100%
- Branches: 95%
- Functions: 100%
- Lines: 100%

## Usage

### Login Flow

1. User clicks "Login with Keycloak" button
2. Redirects to Keycloak login screen
3. After authentication, NextAuth processes tokens
4. Session data becomes available globally via SessionProvider
5. User is redirected back to the home page

### Logout Flow

1. User clicks "Logout" button
2. Triggers `federatedLogout()` utility
3. Calls Keycloak's end session endpoint
4. Ends both Keycloak and NextAuth sessions
5. Redirects back to home page

### Protected Routes

The `/Secured` route is protected using the `PrivateRoute` helper, which:
- Checks for a valid session using `getServerSession`
- Redirects to home page if not authenticated
- Renders the protected content if authenticated

## API Routes

### `/api/auth/[...nextauth]`

NextAuth.js API route handler that manages:
- OIDC authentication flow
- JWT token management
- Automatic token refresh
- Session callbacks

### `/api/auth/federated-logout`

Handles federated logout by:
- Retrieving the id_token from the session
- Constructing Keycloak's end session endpoint URL
- Returning the logout URL for client-side redirection

## TypeScript Support

The project includes TypeScript type definitions for NextAuth in `src/types/next-auth.d.ts` to extend the default session and JWT types.

## Deployment

### Environment Variables

Make sure to set all required environment variables in your deployment platform:

- `KEYCLOAK_CLIENT_ID`
- `KEYCLOAK_CLIENT_SECRET`
- `KEYCLOAK_ISSUER`
- `NEXTAUTH_URL` (should match your deployment URL)
- `NEXTAUTH_SECRET`

### CI/CD Pipeline

The project is configured for CI/CD with:
- Linting (`npm run lint`)
- Type checking (via TypeScript)
- Unit tests (`npm test`)

## Troubleshooting

### Common Issues

1. **"Invalid redirect URI" error**
   - Ensure the redirect URI in Keycloak matches exactly: `http://localhost:3000/api/auth/callback/keycloak`

2. **"Invalid client secret" error**
   - Verify the `KEYCLOAK_CLIENT_SECRET` in `.env.local` matches the client secret in Keycloak

3. **Session not persisting**
   - Check that `NEXTAUTH_SECRET` is set and is a secure random string
   - Verify `NEXTAUTH_URL` matches your application URL

4. **Token refresh failing**
   - Ensure the Keycloak client has "Refresh Token" enabled in the client settings

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Keycloak Documentation](https://www.keycloak.org/documentation)
- [OpenID Connect Specification](https://openid.net/connect/)

## License

This project is open source and available under the [MIT License](LICENSE).
