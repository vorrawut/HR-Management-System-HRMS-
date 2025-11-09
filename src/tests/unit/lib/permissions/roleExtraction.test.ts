import { extractAndNormalizeRoles } from "@/lib/permissions/roleExtraction";
import { decodeIdToken } from "@/utils/tokenDecode";

describe("extractAndNormalizeRoles", () => {
  const mockTokenPayload = {
    exp: 1762694357,
    iat: 1762694057,
    sub: "test-user",
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
    groups: ["/admins", "/managers"],
  };

  function createMockIdToken(payload: Record<string, unknown>): string {
    const header = { alg: "HS256", typ: "JWT" };
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString("base64url");
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
    return `${encodedHeader}.${encodedPayload}.signature`;
  }

  describe("Extraction from ID Token", () => {
    it("should extract and normalize roles from ID token", () => {
      const idToken = createMockIdToken(mockTokenPayload);
      const { normalizedRoles } = extractAndNormalizeRoles(idToken);

      expect(normalizedRoles).toContain("admin");
      expect(normalizedRoles.length).toBeGreaterThan(0);
    });

    it("should extract realm roles from token", () => {
      const idToken = createMockIdToken(mockTokenPayload);
      const { normalizedRoles } = extractAndNormalizeRoles(idToken);

      const decoded = decodeIdToken(idToken);
      const realmRoles = (decoded?.realm_access as { roles?: string[] })?.roles || [];
      
      expect(realmRoles.length).toBeGreaterThan(0);
      expect(realmRoles).toContain("offline_access");
    });

    it("should extract resource roles from all resources", () => {
      const idToken = createMockIdToken(mockTokenPayload);
      const { normalizedRoles } = extractAndNormalizeRoles(idToken);

      const decoded = decodeIdToken(idToken);
      const resourceAccess = decoded?.resource_access as Record<string, { roles?: string[] }> | undefined;
      
      expect(resourceAccess).toBeDefined();
      expect(resourceAccess?.["realm-management"]?.roles).toContain("realm-admin");
      expect(resourceAccess?.["next"]?.roles).toContain("uma_protection");
    });

    it("should extract groups from token", () => {
      const idToken = createMockIdToken(mockTokenPayload);
      const { normalizedRoles } = extractAndNormalizeRoles(idToken);

      const decoded = decodeIdToken(idToken);
      const groups = decoded?.groups as string[] | undefined;
      
      expect(groups).toBeDefined();
      expect(Array.isArray(groups)).toBe(true);
    });

    it("should handle token without roles", () => {
      const tokenWithoutRoles = {
        sub: "test-user",
        email: "test@example.com",
      };
      const idToken = createMockIdToken(tokenWithoutRoles);
      const { normalizedRoles } = extractAndNormalizeRoles(idToken);

      expect(normalizedRoles).toEqual([]);
    });

    it("should handle token without realm_access", () => {
      const tokenWithoutRealm = {
        sub: "test-user",
        resource_access: {
          next: { roles: ["realm-admin"] },
        },
      };
      const idToken = createMockIdToken(tokenWithoutRealm);
      const { normalizedRoles } = extractAndNormalizeRoles(idToken);

      expect(normalizedRoles).toContain("admin");
    });

    it("should handle token without resource_access", () => {
      const tokenWithoutResource = {
        sub: "test-user",
        realm_access: {
          roles: ["offline_access"],
        },
      };
      const idToken = createMockIdToken(tokenWithoutResource);
      const { normalizedRoles } = extractAndNormalizeRoles(idToken);

      expect(normalizedRoles).toEqual([]);
    });

    it("should handle token without groups", () => {
      const tokenWithoutGroups = {
        ...mockTokenPayload,
        groups: undefined,
      };
      const idToken = createMockIdToken(tokenWithoutGroups);
      const { normalizedRoles } = extractAndNormalizeRoles(idToken);

      expect(normalizedRoles).toContain("admin");
    });
  });

  describe("Extraction from Profile", () => {
    it("should extract roles from profile when provided", () => {
      const profile = {
        realm_access: {
          roles: ["realm-admin"],
        },
        resource_access: {
          next: {
            roles: ["realm-manager"],
          },
        },
      };

      const { normalizedRoles } = extractAndNormalizeRoles(undefined, profile);

      expect(normalizedRoles).toContain("admin");
      expect(normalizedRoles.length).toBeGreaterThan(0);
    });

    it("should merge roles from token and profile", () => {
      const idToken = createMockIdToken({
        realm_access: { roles: ["realm-admin"] },
      });

      const profile = {
        realm_access: {
          roles: ["realm-manager"],
        },
      };

      const { normalizedRoles } = extractAndNormalizeRoles(idToken, profile);

      expect(normalizedRoles).toContain("admin");
      expect(normalizedRoles).toContain("manager");
    });

    it("should deduplicate roles from token and profile", () => {
      const idToken = createMockIdToken({
        realm_access: { roles: ["realm-admin"] },
      });

      const profile = {
        realm_access: {
          roles: ["realm-admin"],
        },
      };

      const { normalizedRoles } = extractAndNormalizeRoles(idToken, profile);

      expect(normalizedRoles).toEqual(["admin"]);
    });
  });

  describe("Edge Cases", () => {
    it("should handle undefined idToken", () => {
      const { normalizedRoles } = extractAndNormalizeRoles(undefined);
      expect(normalizedRoles).toEqual([]);
    });

    it("should handle invalid idToken", () => {
      const { normalizedRoles } = extractAndNormalizeRoles("invalid.token");
      expect(normalizedRoles).toEqual([]);
    });

    it("should handle empty profile", () => {
      const { normalizedRoles } = extractAndNormalizeRoles(undefined, {});
      expect(normalizedRoles).toEqual([]);
    });

    it("should handle profile with empty roles", () => {
      const profile = {
        realm_access: { roles: [] },
        resource_access: {},
      };
      const { normalizedRoles } = extractAndNormalizeRoles(undefined, profile);
      expect(normalizedRoles).toEqual([]);
    });
  });

  describe("Real-world Token Structure", () => {
    it("should correctly extract and normalize all roles from actual token structure", () => {
      const realWorldToken = {
        exp: 1762694357,
        iat: 1762694057,
        sub: "6b4c547b-618f-4276-8093-282f46955594",
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
      };

      const idToken = createMockIdToken(realWorldToken);
      const { normalizedRoles } = extractAndNormalizeRoles(idToken);

      expect(normalizedRoles).toContain("admin");
      expect(normalizedRoles.length).toBe(1);
    });
  });
});

