import { decodeIdToken } from "@/utils/tokenDecode";

/**
 * Decodes and merges token payloads from access_token and id_token
 * Access token typically contains roles, id_token contains user info
 */
export function decodeTokenPayload(
  accessToken?: string,
  idToken?: string
): Record<string, unknown> | null {
  let payload: Record<string, unknown> | null = null;

  if (accessToken) {
    payload = decodeIdToken(accessToken);
  }

  if (idToken) {
    const idTokenPayload = decodeIdToken(idToken);
    if (idTokenPayload) {
      payload = payload ? { ...payload, ...idTokenPayload } : idTokenPayload;
    }
  }

  return payload;
}

