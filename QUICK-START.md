# Quick Start Guide

Get up and running in a few minutes.

## Prerequisites

- Keycloak running in Docker
- Realm "next" needs to be created
- Client secret needs to be configured

## Setup steps

### 1. Wait for Keycloak

Keycloak takes 30-60 seconds to start. Check the logs:

```bash
npm run keycloak:logs
```

Look for `Keycloak 25.0.0 started` or `Listening on: http://0.0.0.0:8080`.

### 2. Access admin console

1. Open http://localhost:8080
2. Click "Administration Console"
3. Login:
   - Username: `admin`
   - Password: `admin`

### 3. Create the realm

1. Hover over "Master" in the top-left
2. Click "Create Realm"
3. Name it: `next`
4. Click "Create"

### 4. Create the client

1. Go to "Clients" in the sidebar
2. Click "Create client"
3. General settings:
   - Client type: `OpenID Connect`
   - Client ID: `next`
   - Click "Next"
4. Capability config:
   - Client authentication: `On` (confidential client)
   - Authorization: `Off`
   - Click "Next"
5. Login settings:
   - Valid redirect URIs: `http://localhost:3000/api/auth/callback/keycloak`
   - Web origins: `http://localhost:3000`
   - Click "Save"

### 5. Get the client secret

1. Open the client you just created
2. Go to the "Credentials" tab
3. Copy the "Client secret" value
4. Open `.env.local` in your project
5. Replace the placeholder with your actual secret:

```env
KEYCLOAK_CLIENT_SECRET="paste-your-secret-here"
```

### 6. Test the connection

```bash
npm run test:keycloak
```

You should see all checks passing.

### 7. Start the app

```bash
npm run dev
```

### 8. Test it

1. Open http://localhost:3000
2. Click "Login with Keycloak"
3. You'll be redirected to Keycloak
4. Log in (create a user in Keycloak if you need one)
5. You should be redirected back, logged in

## Troubleshooting

**Keycloak not accessible**
```bash
# Check if it's running
docker ps | grep keycloak

# Check logs
npm run keycloak:logs

# Restart if needed
npm run keycloak:restart
```

**Realm not found (404)**
- Make sure you created the realm named exactly "next"
- Check that `KEYCLOAK_ISSUER` in `.env.local` matches your realm

**Client secret error**
- Make sure you copied the secret from the Credentials tab
- Verify it's in `.env.local`
- Restart Next.js after updating `.env.local`

**Connection test fails**
- Wait for Keycloak to fully start (check logs)
- Verify the realm exists
- Double-check `.env.local` values

For more details, see [keycloak-setup.md](./keycloak-setup.md) or [README.md](./README.md).
