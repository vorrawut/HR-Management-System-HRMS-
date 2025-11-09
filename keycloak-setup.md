# Keycloak Setup

Step-by-step guide to set up Keycloak locally with Docker for this project.

## Prerequisites

- Docker and Docker Compose installed
- Port 8080 available

## Step 1: Start Keycloak

```bash
docker-compose up -d
```

Wait 30-60 seconds for it to start. Check logs:

```bash
docker-compose logs -f keycloak
```

Look for `Keycloak 25.0.0 started`.

## Step 2: Access admin console

1. Open http://localhost:8080
2. Click "Administration Console"
3. Login:
   - Username: `admin`
   - Password: `admin`

## Step 3: Create a realm

1. Hover over "Master" in the top-left
2. Click "Create Realm"
3. Enter realm name: `next`
4. Click "Create"

## Step 4: Create a client

1. Go to "Clients" in the sidebar
2. Click "Create client"
3. General settings:
   - Client type: `OpenID Connect`
   - Client ID: `next`
   - Click "Next"
4. Capability config:
   - Client authentication: `On` (makes it a confidential client)
   - Authorization: `Off` (unless you need it)
   - Click "Next"
5. Login settings:
   - Valid redirect URIs: `http://localhost:3000/api/auth/callback/keycloak`
   - Web origins: `http://localhost:3000`
   - Click "Save"

## Step 5: Get client secret

1. Open the client you just created
2. Go to the "Credentials" tab
3. Copy the "Client secret" value
4. Update `.env.local`:

```env
KEYCLOAK_CLIENT_SECRET="paste-your-secret-here"
```

## Step 6: Create a test user (optional)

1. Go to "Users" in the sidebar
2. Click "Create new user"
3. Fill in:
   - Username: `testuser`
   - Email: `test@example.com`
   - First name: `Test`
   - Last name: `User`
   - Email verified: `On`
4. Click "Create"
5. Go to the "Credentials" tab
6. Set password:
   - Password: `test123` (or whatever you want)
   - Temporary: `Off`
7. Click "Set password"

## Step 7: Verify your config

Your `.env.local` should look like:

```env
KEYCLOAK_CLIENT_ID="next"
KEYCLOAK_CLIENT_SECRET="your-actual-secret-from-step-5"
KEYCLOAK_ISSUER="http://localhost:8080/realms/next"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="some-random-secret-string"
```

## Step 8: Restart Next.js

After updating `.env.local`, restart your dev server:

```bash
npm run dev
```

## Troubleshooting

**Keycloak won't start**
- Check if port 8080 is in use: `lsof -i :8080`
- Check Docker logs: `docker-compose logs keycloak`

**Can't access Keycloak**
- Give it more time to start
- Check if container is running: `docker-compose ps`

**Authentication fails**
- Make sure the redirect URI is exactly: `http://localhost:3000/api/auth/callback/keycloak`
- Verify the client secret in `.env.local` matches Keycloak
- Check that the realm name is `next` (or update `KEYCLOAK_ISSUER`)

**Need to start fresh**

```bash
docker-compose down -v
docker-compose up -d
```

This wipes all Keycloak data and starts from scratch.

## Useful commands

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# View logs
docker-compose logs -f keycloak

# Restart
docker-compose restart keycloak

# Remove everything (including data)
docker-compose down -v
```
