import { decodeIdToken, type DecodedToken } from "@/utils/tokenDecode";
import { normalizeRoles } from "./roles";

function extractRolesFromPayload(payload: DecodedToken): {
  realmRoles: string[];
  resourceRoles: string[];
  groups: string[];
} {
  const realmAccess = payload.realm_access as { roles?: string[] } | undefined;
  const realmRoles = realmAccess?.roles || [];

  const resourceAccess = payload.resource_access as Record<string, { roles?: string[] }> | undefined;
  const resourceRoles: string[] = [];

  if (resourceAccess) {
    Object.values(resourceAccess).forEach((resource) => {
      if (resource?.roles) {
        resourceRoles.push(...resource.roles);
      }
    });
  }

  const groups = (payload.groups as string[] | undefined) || [];

  return { realmRoles, resourceRoles, groups };
}

export function extractAndNormalizeRoles(
  token: string | undefined,
  profile?: { realm_access?: { roles?: string[] }; resource_access?: Record<string, { roles?: string[] }> }
): { normalizedRoles: string[] } {
  let realmRoles: string[] = [];
  let resourceRoles: string[] = [];
  let groups: string[] = [];

  if (token) {
    const payload = decodeIdToken(token);
    if (payload) {
      const extracted = extractRolesFromPayload(payload);
      realmRoles = extracted.realmRoles;
      resourceRoles = extracted.resourceRoles;
      groups = extracted.groups;
    }
  }

  if (profile) {
    const profileRealmRoles = profile.realm_access?.roles || [];
    const profileResourceRoles = profile.resource_access?.[process.env.KEYCLOAK_CLIENT_ID || ""]?.roles || [];

    if (profileRealmRoles.length > 0) {
      realmRoles = [...new Set([...realmRoles, ...profileRealmRoles])];
    }
    if (profileResourceRoles.length > 0) {
      resourceRoles = [...new Set([...resourceRoles, ...profileResourceRoles])];
    }
  }

  const extractedRoles = [...realmRoles, ...resourceRoles, ...groups];
  const normalizedRoles = normalizeRoles(extractedRoles);

  return { normalizedRoles };
}

