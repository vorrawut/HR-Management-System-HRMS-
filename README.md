# NextAuth with Keycloak Example

This is a Next.js app that shows how to integrate Keycloak authentication using NextAuth.js. It handles login, logout, protected routes, and automatic token refresh.

## What's in here

- Keycloak OIDC authentication
- Federated logout (clears both Keycloak and Next.js sessions)
- Server-side route protection
- Automatic JWT token refresh
- Role-based access control
- Unit and integration tests

## What you need

- Node.js 20 or higher
- Docker (for running Keycloak locally)
- A Keycloak instance (local via Docker or hosted)

## Getting started

Install dependencies first:

```bash
npm install
```

Then verify your setup:

```bash
npm run verify
```

This checks your environment variables and Docker setup.

### Setting up Keycloak

The easiest way to run Keycloak locally is with Docker:

```bash
npm run keycloak:up
```

Give it about 30-60 seconds to start. You can watch the logs with `npm run keycloak:logs`.

Once it's running, you'll need to configure it:

1. Open http://localhost:8080 in your browser
2. Log in to the admin console (username: `admin`, password: `admin`)
3. Follow the steps in [keycloak-setup.md](./keycloak-setup.md) to:
   - Create a realm called "next"
   - Create a client
   - Copy the client secret

### Environment variables

Create a `.env.local` file in the root:

```env
KEYCLOAK_CLIENT_ID="next"
KEYCLOAK_CLIENT_SECRET="your-secret-from-keycloak"
KEYCLOAK_ISSUER="http://localhost:8080/realms/next"

NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-random-string-here"
```

Replace `KEYCLOAK_CLIENT_SECRET` with the actual secret from Keycloak. For `NEXTAUTH_SECRET`, generate a random string (you can use `openssl rand -base64 32`).

### Testing the connection

After setting up Keycloak and your `.env.local`, test the connection:

```bash
npm run test:keycloak
```

This verifies that your app can reach Keycloak and that your config is correct.

### Running the app

```bash
npm run dev
```

Open http://localhost:3000 and click "Login with Keycloak" to test the authentication flow.

## Project structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/auth/           # NextAuth API routes
│   ├── admin/              # Admin page
│   ├── manager/            # Manager page
│   ├── profile/            # Profile page
│   └── Secured/            # Employee dashboard
│
├── components/             # React components
│   ├── ui/                 # Shared UI components
│   ├── dashboard/          # Dashboard widgets
│   └── profile/            # Profile widgets
│
├── contexts/               # React Context providers
│   ├── TokenContext.tsx    # Token data context
│   └── PermissionContext.tsx # Permissions & roles context
│
├── lib/                    # Business logic
│   ├── auth/               # Authentication logic
│   └── permissions/        # Permissions & roles logic
│
├── helpers/                # Helper functions
│   └── PrivateRoute.tsx    # Route protection
│
├── utils/                  # Generic utilities
│   ├── token.ts            # Token date formatting
│   ├── tokenDecode.ts      # Generic JWT decoding
│   └── tokenHelpers.ts     # Type-safe token field extraction
│
└── tests/                  # Tests organized by type
    ├── unit/               # Unit tests
    ├── components/         # Component tests
    └── integration/        # Integration tests
```

## Testing

Run tests:

```bash
npm test
npm run test:watch    # Watch mode
npm run test:coverage # With coverage report
```

## How it works

### Login

1. User clicks the login button
2. Redirects to Keycloak
3. After login, NextAuth handles the tokens
4. Session is available throughout the app via SessionProvider
5. User is redirected back

### Logout

The logout flow clears both the Keycloak session and the Next.js session:

1. Calls the federated logout endpoint
2. Gets the Keycloak logout URL
3. Clears the NextAuth session
4. Redirects to Keycloak to end the session there
5. User ends up back at the home page

### Protected routes

The `/Secured` route uses `PrivateRoute` which:
- Checks for a valid session server-side
- Redirects to home if not authenticated
- Renders the page if authenticated

### Role-based access

The app uses a role mapping system that converts Keycloak roles to internal roles (admin, manager, employee). Roles are extracted from tokens and normalized using the mapping configuration in `src/config/roleMappings.ts`.

## API routes

### `/api/auth/[...nextauth]`

The main NextAuth handler. Manages:
- OIDC authentication
- JWT tokens
- Token refresh
- Session callbacks

### `/api/auth/federated-logout`

Returns the Keycloak logout URL so the client can redirect there after clearing the NextAuth session.

### `/api/auth/token-details`

Fetches the full token payload for display in the profile page.

## Docker commands

We've got some npm scripts for managing Keycloak:

```bash
npm run keycloak:up      # Start Keycloak
npm run keycloak:down    # Stop Keycloak
npm run keycloak:logs    # View logs
npm run keycloak:restart # Restart
npm run keycloak:reset   # Wipe everything and start fresh
```

Or use docker-compose directly if you prefer.

## Deployment

Make sure to set all the environment variables in your deployment platform. Update `NEXTAUTH_URL` to match your production URL.

## Common issues

**"Invalid redirect URI"**
- Make sure the redirect URI in Keycloak is exactly: `http://localhost:3000/api/auth/callback/keycloak`

**"Invalid client secret"**
- Double-check that `KEYCLOAK_CLIENT_SECRET` in `.env.local` matches what's in Keycloak

**Session not persisting**
- Verify `NEXTAUTH_SECRET` is set and is a secure random string
- Make sure `NEXTAUTH_URL` matches your app URL

**Token refresh not working**
- Check that the Keycloak client has "Refresh Token" enabled

**Roles not showing up**
- Make sure roles are mapped in `src/config/roleMappings.ts`
- Check that roles exist in the token payload (use the profile page to inspect)

## Resources

- [Next.js docs](https://nextjs.org/docs)
- [NextAuth.js docs](https://next-auth.js.org/)
- [Keycloak docs](https://www.keycloak.org/documentation)
- [OpenID Connect spec](https://openid.net/connect/)
