import "next-auth";
import "next-auth/jwt";
import type { TokenPayload } from "./token";

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
    tokenPayload?: TokenPayload;
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

