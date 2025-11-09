import type { JWT } from "next-auth/jwt";
import type { Session, Account, Profile } from "next-auth";
import { AUTH_CONSTANTS } from "./constants";
import { extractAndNormalizeRoles } from "@/lib/permissions/roleExtraction";
import { createMinimalTokenPayload } from "./sessionTokenPayload";
import { refreshAccessToken } from "./refresh";
import { decodeTokenPayload } from "./tokenDecode";
import type { KeycloakProfile } from "./types";

export async function jwtCallback({
  token,
  account,
  profile,
}: {
  token: JWT;
  account?: Account | null;
  profile?: Profile;
}): Promise<JWT> {
  if (account) {
    token.idToken = account.id_token;
    token.accessToken = account.access_token;
    token.refreshToken = account.refresh_token;
    token.expiresAt = account.expires_at;

    const fullPayload = decodeTokenPayload(account.access_token, account.id_token);
    if (fullPayload) {
      token.fullTokenPayload = fullPayload;
    }

    const tokenForExtraction = account.access_token || account.id_token;
    const { normalizedRoles } = extractAndNormalizeRoles(
      tokenForExtraction,
      profile as KeycloakProfile | undefined
    );

    token.roles = normalizedRoles;
    return token;
  }

  const isTokenValid =
    token.expiresAt &&
    Date.now() < token.expiresAt * 1000 - AUTH_CONSTANTS.TOKEN_REFRESH_BUFFER_MS;

  if (isTokenValid) {
    return token;
  }

  const refreshedToken = await refreshAccessToken(token);
  const refreshedPayload = decodeTokenPayload(
    refreshedToken.accessToken as string | undefined,
    refreshedToken.idToken as string | undefined
  );

  if (refreshedPayload && (refreshedPayload.realm_access || refreshedPayload.resource_access)) {
    refreshedToken.fullTokenPayload = refreshedPayload;
  } else if (token.fullTokenPayload) {
    refreshedToken.fullTokenPayload = token.fullTokenPayload;
  }

  return refreshedToken;
}

export async function sessionCallback({
  session,
  token,
}: {
  session: Session;
  token: JWT;
}): Promise<Session> {
  if (!token) {
    return session;
  }

  session.accessToken = token.accessToken as string;
  session.error = token.error as string | undefined;
  session.roles = (token.roles as string[]) || [];

  const minimalPayload = createMinimalTokenPayload(token.idToken as string | undefined);
  if (minimalPayload) {
    session.tokenPayload = minimalPayload;
  }

  return session;
}

