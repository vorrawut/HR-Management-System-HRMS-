# Token Payload Example

This is an example of what a full token payload looks like from Keycloak. This is what gets decoded and displayed in the profile page.

```json
{
  "exp": 1762694357,
  "iat": 1762694057,
  "auth_time": 1762694057,
  "jti": "f943181a-344e-4c71-aaed-3f8c59bc8450",
  "iss": "http://localhost:8080/realms/next",
  "aud": [
    "realm-management",
    "broker",
    "account"
  ],
  "sub": "6b4c547b-618f-4276-8093-282f46955594",
  "typ": "Bearer",
  "azp": "next",
  "sid": "ac408082-f56e-41a3-9399-3f1f0ed817d6",
  "acr": "1",
  "allowed-origins": [
    "*"
  ],
  "realm_access": {
    "roles": [
      "offline_access",
      "default-roles-next",
      "uma_authorization"
    ]
  },
  "resource_access": {
    "next": {
      "roles": [
        "uma_protection"
      ]
    },
    "realm-management": {
      "roles": [
        "view-realm",
        "view-identity-providers",
        "manage-identity-providers",
        "impersonation",
        "realm-admin",
        "create-client",
        "manage-users",
        "query-realms",
        "view-authorization",
        "query-clients",
        "query-users",
        "manage-events",
        "manage-realm",
        "view-events",
        "view-users",
        "view-clients",
        "manage-authorization",
        "manage-clients",
        "query-groups"
      ]
    },
    "broker": {
      "roles": [
        "read-token"
      ]
    },
    "account": {
      "roles": [
        "manage-account",
        "view-applications",
        "view-consent",
        "view-groups",
        "manage-account-links",
        "manage-consent",
        "delete-account",
        "view-profile"
      ]
    }
  },
  "scope": "openid email profile",
  "email_verified": false,
  "name": "FirstName LastName",
  "preferred_username": "test",
  "given_name": "FirstName",
  "family_name": "LastName",
  "email": "test@gmail.com"
}
```

## Key Fields

- **`realm_access.roles`**: Roles assigned at the realm level
- **`resource_access`**: Roles assigned per resource/client
- **`groups`**: User groups (if configured in Keycloak)
- **`email`**, **`name`**, **`preferred_username`**: User information
- **`exp`**, **`iat`**, **`auth_time`**: Token timestamps

The app extracts roles from `realm_access.roles` and `resource_access.{resource}.roles`, then maps them to internal roles (admin, manager, employee) using the configuration in `src/config/roleMappings.ts`.
