import type { TokenPayload } from "@/types/token";

export function extractAllPermissions(
  tokenPayload: TokenPayload | Record<string, unknown> | null
): string[] {
  if (!tokenPayload) return [];

  const permissions: string[] = [];

  const realmAccess = tokenPayload.realm_access as { roles?: string[] } | undefined;
  if (realmAccess && typeof realmAccess === "object" && "roles" in realmAccess) {
    const realmRoles = Array.isArray(realmAccess.roles) ? realmAccess.roles : [];
    permissions.push(...realmRoles);
  }

  const resourceAccess = tokenPayload.resource_access as Record<string, { roles?: string[] }> | undefined;
  if (resourceAccess && typeof resourceAccess === "object") {
    Object.values(resourceAccess).forEach((resource) => {
      if (resource && typeof resource === "object" && "roles" in resource) {
        const roles = Array.isArray(resource.roles) ? resource.roles : [];
        permissions.push(...roles);
      }
    });
  }

  return permissions;
}

export function getResourceRolesByResource(
  tokenPayload: TokenPayload | Record<string, unknown> | null
) {
  if (!tokenPayload) return [];

  const resourceAccess = tokenPayload.resource_access as Record<string, { roles?: string[] }> | undefined;

  if (!resourceAccess || typeof resourceAccess !== "object") {
    return [];
  }

  return Object.entries(resourceAccess).map(([resource, data]) => {
    const roles =
      data && typeof data === "object" && "roles" in data
        ? Array.isArray(data.roles)
          ? data.roles
          : []
        : [];
    return {
      resource,
      roles,
    };
  });
}

