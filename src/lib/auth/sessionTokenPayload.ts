import { decodeIdToken } from "@/utils/tokenDecode";

export function createMinimalTokenPayload(
  idToken: string | undefined
): {
  exp?: number;
  iat?: number;
  sub?: string;
  iss?: string;
  azp?: string;
  email?: string;
  name?: string;
  preferred_username?: string;
  email_verified?: boolean;
} | null {
  if (!idToken) {
    return null;
  }

  const payload = decodeIdToken(idToken);
  if (!payload) {
    return null;
  }

  return {
    exp: payload.exp as number | undefined,
    iat: payload.iat as number | undefined,
    sub: payload.sub as string | undefined,
    iss: payload.iss as string | undefined,
    azp: payload.azp as string | undefined,
    email: payload.email as string | undefined,
    name: payload.name as string | undefined,
    preferred_username: payload.preferred_username as string | undefined,
    email_verified: payload.email_verified as boolean | undefined,
  };
}

