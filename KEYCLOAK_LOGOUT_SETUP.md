# Keycloak Logout Configuration Guide

## Problem
After signing out, clicking "Sign In" automatically logs in with the previous account instead of showing the Keycloak login screen. This happens because Keycloak's SSO session persists even after application logout.

## Solution Implementation

This application implements a comprehensive logout flow that:

1. **Clears NextAuth session** - Removes all application-side session data
2. **Performs RP-Initiated Logout** - Redirects to Keycloak's logout endpoint to terminate the SSO session
3. **Forces login screen** - Uses `prompt=login` parameter to ensure users see the login screen after logout

## Keycloak Client Configuration

To ensure proper logout functionality, configure your Keycloak client with the following settings:

### Required Settings

1. **Valid Redirect URIs**
   - Add your application's logout redirect URI: `http://localhost:3000/login` (or your production URL)
   - Add your callback URI: `http://localhost:3000/api/auth/callback/keycloak`

2. **Web Origins**
   - Add your application origin: `http://localhost:3000` (or your production URL)

3. **Logout Settings** (if available in your Keycloak version)
   - Enable "Front-Channel Logout" if available
   - Set "Logout Service Post Binding URL" if required

### Testing Logout

1. Log in to your application
2. Click "Sign Out"
3. You should be redirected to Keycloak's logout endpoint
4. After logout, you should be redirected back to the login page
5. Click "Sign In" - you should see the Keycloak login screen (not auto-login)

## How It Works

### Logout Flow

```
User clicks "Sign Out"
  ↓
Clear client-side storage (localStorage, sessionStorage)
  ↓
Clear application cookies
  ↓
Get Keycloak logout URL with id_token_hint
  ↓
Sign out from NextAuth
  ↓
Redirect to Keycloak logout endpoint
  ↓
Keycloak clears SSO session
  ↓
Redirect back to /login?prompt=login&logout=<timestamp>
  ↓
Set force_login flag in sessionStorage
```

### Login Flow (After Logout)

```
User clicks "Sign In"
  ↓
Check for force_login flag or prompt=login query param
  ↓
If force_login is set:
  - Construct Keycloak auth URL with prompt=login
  - Redirect to Keycloak (forces login screen)
  ↓
If normal login:
  - Construct Keycloak auth URL with prompt=select_account
  - Redirect to Keycloak (shows account selection)
```

## Security Features

1. **Complete Session Termination**
   - Clears NextAuth session
   - Terminates Keycloak SSO session via logout endpoint
   - Clears all application cookies

2. **Prevents Auto-Login**
   - Uses `prompt=login` after logout to force login screen
   - Uses `prompt=select_account` for normal login to show account selection
   - Adds timestamp to prevent caching

3. **Secure Redirects**
   - Uses `window.location.replace()` to prevent back button navigation
   - Validates redirect URIs
   - Includes `client_id` in logout URL for proper session identification

## Troubleshooting

### Issue: Still auto-logging in after logout

**Possible causes:**
1. Keycloak client not configured with proper redirect URIs
2. Keycloak SSO session not being terminated
3. Browser caching the session

**Solutions:**
1. Verify Keycloak client configuration (see above)
2. Check browser console for errors during logout
3. Clear browser cookies manually and test again
4. Verify the logout URL includes `id_token_hint` and `post_logout_redirect_uri`
5. Check that Keycloak's logout endpoint is accessible

### Issue: Logout redirects to wrong page

**Solution:**
- Verify `NEXTAUTH_URL` environment variable is set correctly
- Check that the redirect URI in Keycloak client matches your application URL

### Issue: prompt=login not working

**Solution:**
- Verify Keycloak version supports `prompt` parameter (Keycloak 3.0+)
- Check that the authorization URL is constructed correctly
- Ensure `kc_idp_hint` is cleared (set to empty string)

## Environment Variables

Ensure these are set in your `.env.local`:

```env
KEYCLOAK_ISSUER=http://localhost:8080/realms/next
KEYCLOAK_CLIENT_ID=next
KEYCLOAK_CLIENT_SECRET=your-secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret
```

## Best Practices

1. **Always use RP-Initiated Logout** - Don't just clear local session, terminate Keycloak session too
2. **Use prompt parameters** - `prompt=login` after logout, `prompt=select_account` for normal login
3. **Validate redirect URIs** - Ensure Keycloak client has correct redirect URIs configured
4. **Test thoroughly** - Test logout flow in different browsers and scenarios
5. **Monitor logs** - Check Keycloak server logs if logout isn't working

## References

- [Keycloak OIDC Logout Documentation](https://www.keycloak.org/docs/latest/securing_apps/#oidc-logout)
- [OpenID Connect RP-Initiated Logout](https://openid.net/specs/openid-connect-rpinitiated-1_0.html)
- [OAuth 2.0 Prompt Parameter](https://openid.net/specs/openid-connect-core-1_0.html#AuthRequest)

