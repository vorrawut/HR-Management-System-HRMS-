import type { TokenPayload } from "@/types/token";

export function decodeToken(idToken: string): TokenPayload | null {
  if (!idToken) return null;
  try {
    const parts = idToken.split(".");
    if (parts.length !== 3) return null;
    let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }
    const decoded = atob(base64);
    const payload = JSON.parse(decoded) as TokenPayload;
    return payload;
  } catch {
    return null;
  }
}

export function formatTokenDate(timestamp?: number): string {
  if (!timestamp) return "N/A";
  return new Date(timestamp * 1000).toLocaleString();
}

/**
 * @deprecated Use @/lib/permissions/extraction instead
 * This function is kept for backward compatibility
 */
export { extractAllPermissions, getResourceRolesByResource } from "@/lib/permissions/extraction";
