import { mapKeycloakRoleToInternal, mapKeycloakRolesToInternal } from "@/config/roleMappings";
import { normalizeRoles } from "@/lib/permissions/roles";
import { getResourceRolesByResource } from "@/lib/permissions/extraction";

describe("Role Mapping Integration", () => {
  const mockTokenPayload = {
    realm_access: {
      roles: ["offline_access", "default-roles-next", "uma_authorization"],
    },
    resource_access: {
      next: {
        roles: ["uma_protection"],
      },
      "realm-management": {
        roles: [
          "view-realm",
          "realm-admin",
          "manage-realm",
          "query-groups",
        ],
      },
      broker: {
        roles: ["read-token"],
      },
      account: {
        roles: ["manage-account", "view-profile"],
      },
    },
    groups: [],
  };

  it("should extract and normalize roles exactly like the component does", () => {
    const realmRoles = mockTokenPayload.realm_access.roles || [];
    const resourceRolesByResource = getResourceRolesByResource(mockTokenPayload as any);
    const groups: string[] = [];

    const allRoles: string[] = [];

    if (realmRoles.length > 0) {
      allRoles.push(...realmRoles);
    }

    resourceRolesByResource.forEach(({ roles }) => {
      allRoles.push(...roles);
    });

    if (groups.length > 0) {
      allRoles.push(...groups);
    }

    const normalized = normalizeRoles(allRoles);

    expect(allRoles).toContain("realm-admin");
    expect(normalized).toContain("admin");
    expect(normalized.length).toBeGreaterThan(0);
  });

  it("should map realm-admin correctly when extracted from resource_access", () => {
    const resourceRolesByResource = getResourceRolesByResource(mockTokenPayload as any);
    
    const realmManagementResource = resourceRolesByResource.find(
      (r) => r.resource === "realm-management"
    );

    expect(realmManagementResource).toBeDefined();
    expect(realmManagementResource?.roles).toContain("realm-admin");

    const mapped = mapKeycloakRolesToInternal(realmManagementResource?.roles || []);
    expect(mapped).toContain("admin");
  });

  it("should work with the exact same logic as RolesPermissionsPanel component", () => {
    const realmAccess = mockTokenPayload.realm_access as { roles?: string[] } | undefined;
    const realmRoles = realmAccess?.roles || [];

    const resourceRolesByResource = getResourceRolesByResource(mockTokenPayload as any);
    const groups: string[] = [];

    const allRoles: string[] = [];

    if (realmRoles.length > 0) {
      allRoles.push(...realmRoles);
    }

    resourceRolesByResource.forEach(({ roles }) => {
      allRoles.push(...roles);
    });

    if (groups.length > 0) {
      allRoles.push(...groups);
    }

    const normalized = normalizeRoles(allRoles);

    expect(allRoles.length).toBeGreaterThan(10);
    expect(allRoles).toContain("realm-admin");
    expect(normalized).toContain("admin");
    expect(normalized.length).toBe(1);
  });
});

