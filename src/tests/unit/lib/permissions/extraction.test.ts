import { extractAllPermissions, getResourceRolesByResource } from "@/lib/permissions/extraction";
import type { TokenPayload } from "@/types/token";

describe("Token Extraction Utilities", () => {
  const mockTokenPayload: Record<string, unknown> = {
    exp: 1762694357,
    iat: 1762694057,
    auth_time: 1762694057,
    jti: "f943181a-344e-4c71-aaed-3f8c59bc8450",
    iss: "http://localhost:8080/realms/next",
    aud: ["realm-management", "broker", "account"],
    sub: "6b4c547b-618f-4276-8093-282f46955594",
    typ: "Bearer",
    azp: "next",
    sid: "ac408082-f56e-41a3-9399-3f1f0ed817d6",
    acr: "1",
    "allowed-origins": ["*"],
    realm_access: {
      roles: [
        "offline_access",
        "default-roles-next",
        "uma_authorization",
      ],
    },
    resource_access: {
      next: {
        roles: ["uma_protection"],
      },
      "realm-management": {
        roles: [
          "view-realm",
          "view-identity-providers",
          "manage-identity-providers",
          "impersonation",
          "realm-admin",
          "create-client",
          "manage-users",
          "query-realms",
          "view-authorization",
          "query-clients",
          "query-users",
          "manage-events",
          "manage-realm",
          "view-events",
          "view-users",
          "view-clients",
          "manage-authorization",
          "manage-clients",
          "query-groups",
        ],
      },
      broker: {
        roles: ["read-token"],
      },
      account: {
        roles: [
          "manage-account",
          "view-applications",
          "view-consent",
          "view-groups",
          "manage-account-links",
          "manage-consent",
          "delete-account",
          "view-profile",
        ],
      },
    },
    scope: "openid email profile",
    email_verified: false,
    name: "FirstName LastName",
    preferred_username: "test",
    given_name: "FirstName",
    family_name: "LastName",
    email: "test@gmail.com",
  };

  describe("extractAllPermissions", () => {
    it("should extract all permissions from realm_access and resource_access", () => {
      const permissions = extractAllPermissions(mockTokenPayload);

      expect(permissions).toContain("offline_access");
      expect(permissions).toContain("default-roles-next");
      expect(permissions).toContain("uma_authorization");
      expect(permissions).toContain("uma_protection");
      expect(permissions).toContain("realm-admin");
      expect(permissions).toContain("view-realm");
      expect(permissions).toContain("read-token");
      expect(permissions).toContain("manage-account");
      expect(permissions).toContain("view-profile");

      expect(permissions.length).toBeGreaterThan(30);
    });

    it("should extract all roles from all resources", () => {
      const permissions = extractAllPermissions(mockTokenPayload);

      const realmRoles = ["offline_access", "default-roles-next", "uma_authorization"];
      const nextRoles = ["uma_protection"];
      const realmManagementRoles = [
        "view-realm",
        "view-identity-providers",
        "manage-identity-providers",
        "impersonation",
        "realm-admin",
        "create-client",
        "manage-users",
        "query-realms",
        "view-authorization",
        "query-clients",
        "query-users",
        "manage-events",
        "manage-realm",
        "view-events",
        "view-users",
        "view-clients",
        "manage-authorization",
        "manage-clients",
        "query-groups",
      ];
      const brokerRoles = ["read-token"];
      const accountRoles = [
        "manage-account",
        "view-applications",
        "view-consent",
        "view-groups",
        "manage-account-links",
        "manage-consent",
        "delete-account",
        "view-profile",
      ];

      const allExpectedRoles = [
        ...realmRoles,
        ...nextRoles,
        ...realmManagementRoles,
        ...brokerRoles,
        ...accountRoles,
      ];

      allExpectedRoles.forEach((role) => {
        expect(permissions).toContain(role);
      });

      expect(permissions.length).toBe(allExpectedRoles.length);
    });

    it("should return empty array for null token", () => {
      expect(extractAllPermissions(null)).toEqual([]);
    });

    it("should return empty array for token without roles", () => {
      const tokenWithoutRoles = {
        sub: "test",
        email: "test@example.com",
      };
      expect(extractAllPermissions(tokenWithoutRoles)).toEqual([]);
    });

    it("should handle missing realm_access gracefully", () => {
      const tokenWithoutRealm = {
        resource_access: {
          next: { roles: ["test-role"] },
        },
      };
      const permissions = extractAllPermissions(tokenWithoutRealm);
      expect(permissions).toContain("test-role");
      expect(permissions.length).toBe(1);
    });

    it("should handle missing resource_access gracefully", () => {
      const tokenWithoutResource = {
        realm_access: {
          roles: ["realm-role"],
        },
      };
      const permissions = extractAllPermissions(tokenWithoutResource);
      expect(permissions).toContain("realm-role");
      expect(permissions.length).toBe(1);
    });
  });

  describe("getResourceRolesByResource", () => {
    it("should extract roles grouped by resource", () => {
      const resourceRoles = getResourceRolesByResource(mockTokenPayload);

      expect(resourceRoles).toHaveLength(4);

      const nextResource = resourceRoles.find((r) => r.resource === "next");
      expect(nextResource).toBeDefined();
      expect(nextResource?.roles).toContain("uma_protection");
      expect(nextResource?.roles.length).toBe(1);

      const realmManagementResource = resourceRoles.find(
        (r) => r.resource === "realm-management"
      );
      expect(realmManagementResource).toBeDefined();
      expect(realmManagementResource?.roles).toContain("realm-admin");
      expect(realmManagementResource?.roles).toContain("view-realm");
      expect(realmManagementResource?.roles.length).toBe(19);

      const brokerResource = resourceRoles.find((r) => r.resource === "broker");
      expect(brokerResource).toBeDefined();
      expect(brokerResource?.roles).toContain("read-token");
      expect(brokerResource?.roles.length).toBe(1);

      const accountResource = resourceRoles.find((r) => r.resource === "account");
      expect(accountResource).toBeDefined();
      expect(accountResource?.roles).toContain("manage-account");
      expect(accountResource?.roles).toContain("view-profile");
      expect(accountResource?.roles.length).toBe(8);
    });

    it("should return empty array for null token", () => {
      expect(getResourceRolesByResource(null)).toEqual([]);
    });

    it("should return empty array for token without resource_access", () => {
      const tokenWithoutResource = {
        realm_access: { roles: ["test"] },
      };
      expect(getResourceRolesByResource(tokenWithoutResource)).toEqual([]);
    });

    it("should handle empty resource_access", () => {
      const tokenWithEmptyResource = {
        resource_access: {},
      };
      expect(getResourceRolesByResource(tokenWithEmptyResource)).toEqual([]);
    });

    it("should handle resources with empty roles array", () => {
      const tokenWithEmptyRoles = {
        resource_access: {
          test: { roles: [] },
        },
      };
      const result = getResourceRolesByResource(tokenWithEmptyRoles);
      expect(result).toHaveLength(1);
      expect(result[0].resource).toBe("test");
      expect(result[0].roles).toEqual([]);
    });

    it("should handle resources with missing roles property", () => {
      const tokenWithMissingRoles = {
        resource_access: {
          test: {},
        },
      };
      const result = getResourceRolesByResource(tokenWithMissingRoles);
      expect(result).toHaveLength(1);
      expect(result[0].resource).toBe("test");
      expect(result[0].roles).toEqual([]);
    });
  });
});

