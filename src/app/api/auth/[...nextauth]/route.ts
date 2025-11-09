import NextAuth from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";
import type { JWT } from "next-auth/jwt";
import type { Session, Account, Profile } from "next-auth";

// Validate required environment variables
const requiredEnvVars = {
  KEYCLOAK_CLIENT_ID: process.env.KEYCLOAK_CLIENT_ID,
  KEYCLOAK_CLIENT_SECRET: process.env.KEYCLOAK_CLIENT_SECRET,
  KEYCLOAK_ISSUER: process.env.KEYCLOAK_ISSUER,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
};

const missingVars = Object.entries(requiredEnvVars)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0 && process.env.NODE_ENV !== "test") {
  console.error(
    `❌ Missing required environment variables: ${missingVars.join(", ")}\n` +
    `Please check your .env.local file.`
  );
}

export const authOptions = {
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
      issuer: process.env.KEYCLOAK_ISSUER!,
    }),
  ],
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, account, profile }: {
      token: JWT;
      account?: Account | null;
      profile?: Profile & {
        realm_access?: { roles?: string[] };
        resource_access?: Record<string, { roles?: string[] }>;
      };
    }) {
      if (account) {
        token.idToken = account.id_token;
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
        
        // Extract roles from Keycloak token
        // Keycloak can return roles from:
        // 1. realm_access.roles (realm roles)
        // 2. resource_access[client_id].roles (client roles)
        // 3. Groups (which are mapped to roles in Keycloak)
        let extractedRoles: string[] = [];
        
        if (profile) {
          const realmRoles = profile.realm_access?.roles || [];
          const resourceRoles = profile.resource_access?.[process.env.KEYCLOAK_CLIENT_ID || ""]?.roles || [];
          extractedRoles = [...realmRoles, ...resourceRoles];
        } else if (account.id_token) {
          // Fallback: decode id_token to get roles if profile is not available
          try {
            const payload = JSON.parse(Buffer.from(account.id_token.split(".")[1], "base64").toString());
            const realmRoles = payload.realm_access?.roles || [];
            const resourceRoles = payload.resource_access?.[process.env.KEYCLOAK_CLIENT_ID || ""]?.roles || [];
            extractedRoles = [...realmRoles, ...resourceRoles];
          } catch {
            extractedRoles = [];
          }
        }
        
        // Normalize roles (map Keycloak group names like "admins", "employees", "managers" to our role names)
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { normalizeRoles } = require("@/utils/roles");
        token.roles = normalizeRoles(extractedRoles);
        
        return token;
      }

      if (token.expiresAt && Date.now() < (token.expiresAt * 1000 - 60 * 1000)) {
        return token;
      }

      return await refreshAccessToken(token);
    },
    async session({ session, token }: {
      session: Session;
      token: JWT;
    }) {
      if (token) {
        session.accessToken = token.accessToken as string;
        session.error = token.error as string | undefined;
        session.roles = (token.roles as string[]) || [];
        if (token.idToken) {
          try {
            const parts = (token.idToken as string).split(".");
            if (parts.length === 3) {
              let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
              while (base64.length % 4) {
                base64 += "=";
              }
              const decoded = Buffer.from(base64, "base64").toString();
              const payload = JSON.parse(decoded);
              session.tokenPayload = {
                exp: payload.exp,
                iat: payload.iat,
                sub: payload.sub,
                email: payload.email,
                name: payload.name,
                preferred_username: payload.preferred_username,
                email_verified: payload.email_verified,
                realm_access: payload.realm_access,
                resource_access: payload.resource_access,
                groups: payload.groups,
              };
            }
          } catch {
            // If decoding fails, don't store token payload
          }
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    // Check if refresh token exists
    if (!token.refreshToken) {
      throw new Error("No refresh token available");
    }

    const url = `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/token`;

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.KEYCLOAK_CLIENT_ID!,
        client_secret: process.env.KEYCLOAK_CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      }),
      method: "POST",
      cache: "no-store",
    });

    const tokens = await response.json();

    if (!response.ok) {
      // If refresh token is invalid/expired, clear it and mark for re-authentication
      if (tokens.error === "invalid_grant" || tokens.error === "Token is not active") {
        console.warn("Refresh token expired or invalid, user needs to re-authenticate");
        return {
          ...token,
          error: "RefreshAccessTokenError",
          refreshToken: undefined,
          accessToken: undefined,
          idToken: undefined,
        };
      }
      throw tokens;
    }

    const updatedToken = {
      ...token,
      idToken: tokens.id_token,
      accessToken: tokens.access_token,
      expiresAt: Math.floor(Date.now() / 1000 + (tokens.expires_in || 3600)),
      refreshToken: tokens.refresh_token || token.refreshToken,
      error: undefined, // Clear any previous errors
    };

    return updatedToken;
  } catch (error) {
    console.error("Error refreshing access token", error);

    // Return token with error, but keep refresh token for retry
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

const { handlers, auth } = NextAuth(authOptions);

export { auth };
export const { GET, POST } = handlers;

