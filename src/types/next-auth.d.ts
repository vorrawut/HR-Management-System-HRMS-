import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
    };
    accessToken?: string;
    error?: string;
    roles?: string[];
    tokenPayload?: {
      exp?: number;
      iat?: number;
      sub?: string;
      email?: string;
      name?: string;
      preferred_username?: string;
      email_verified?: boolean;
      realm_access?: { roles?: string[] };
      resource_access?: Record<string, { roles?: string[] }>;
      groups?: string[];
    };
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    idToken?: string;
    expiresAt?: number; // Unix timestamp in seconds
    error?: string;
    roles?: string[];
  }
}

