import {
  mapKeycloakRoleToInternal,
  mapKeycloakRolesToInternal,
  getUnmappedRoles,
} from "@/config/roleMappings";

describe("Role Mapping", () => {
  describe("mapKeycloakRoleToInternal", () => {
    it("should map realm-admin to admin", () => {
      expect(mapKeycloakRoleToInternal("realm-admin")).toBe("admin");
    });

    it("should map realm-manager to manager", () => {
      expect(mapKeycloakRoleToInternal("realm-manager")).toBe("manager");
    });

    it("should map realm-employee to employee", () => {
      expect(mapKeycloakRoleToInternal("realm-employee")).toBe("employee");
    });

    it("should be case-insensitive", () => {
      expect(mapKeycloakRoleToInternal("REALM-ADMIN")).toBe("admin");
      expect(mapKeycloakRoleToInternal("Realm-Admin")).toBe("admin");
      expect(mapKeycloakRoleToInternal("realm-ADMIN")).toBe("admin");
    });

    it("should handle common admin variations", () => {
      expect(mapKeycloakRoleToInternal("admin")).toBe("admin");
      expect(mapKeycloakRoleToInternal("admins")).toBe("admin");
      expect(mapKeycloakRoleToInternal("administrator")).toBe("admin");
      expect(mapKeycloakRoleToInternal("administrators")).toBe("admin");
    });

    it("should handle common manager variations", () => {
      expect(mapKeycloakRoleToInternal("manager")).toBe("manager");
      expect(mapKeycloakRoleToInternal("managers")).toBe("manager");
      expect(mapKeycloakRoleToInternal("management")).toBe("manager");
    });

    it("should handle common employee variations", () => {
      expect(mapKeycloakRoleToInternal("employee")).toBe("employee");
      expect(mapKeycloakRoleToInternal("employees")).toBe("employee");
      expect(mapKeycloakRoleToInternal("user")).toBe("employee");
      expect(mapKeycloakRoleToInternal("users")).toBe("employee");
      expect(mapKeycloakRoleToInternal("staff")).toBe("employee");
    });

    it("should use pattern matching for realm-admin variants", () => {
      expect(mapKeycloakRoleToInternal("realm-admin-role")).toBe("admin");
      expect(mapKeycloakRoleToInternal("realm-admin-super")).toBe("admin");
    });

    it("should use pattern matching for realm-manager variants", () => {
      expect(mapKeycloakRoleToInternal("realm-manager-role")).toBe("manager");
    });

    it("should use pattern matching for realm-employee variants", () => {
      expect(mapKeycloakRoleToInternal("realm-employee-role")).toBe("employee");
    });

    it("should return null for unmapped roles", () => {
      expect(mapKeycloakRoleToInternal("unknown-role")).toBeNull();
      expect(mapKeycloakRoleToInternal("offline_access")).toBeNull();
      expect(mapKeycloakRoleToInternal("uma_authorization")).toBeNull();
      expect(mapKeycloakRoleToInternal("view-realm")).toBeNull();
    });

    it("should trim whitespace", () => {
      expect(mapKeycloakRoleToInternal("  realm-admin  ")).toBe("admin");
      expect(mapKeycloakRoleToInternal("\trealm-admin\n")).toBe("admin");
    });
  });

  describe("mapKeycloakRolesToInternal", () => {
    it("should map multiple roles correctly", () => {
      const keycloakRoles = ["realm-admin", "realm-manager", "realm-employee"];
      const mapped = mapKeycloakRolesToInternal(keycloakRoles);
      expect(mapped).toEqual(["admin", "manager", "employee"]);
    });

    it("should deduplicate mapped roles", () => {
      const keycloakRoles = ["realm-admin", "admin", "administrator"];
      const mapped = mapKeycloakRolesToInternal(keycloakRoles);
      expect(mapped).toEqual(["admin"]);
    });

    it("should filter out unmapped roles", () => {
      const keycloakRoles = ["realm-admin", "unknown-role", "realm-manager"];
      const mapped = mapKeycloakRolesToInternal(keycloakRoles);
      expect(mapped).toEqual(["admin", "manager"]);
    });

    it("should return empty array for empty input", () => {
      expect(mapKeycloakRolesToInternal([])).toEqual([]);
    });

    it("should return empty array when all roles are unmapped", () => {
      const keycloakRoles = ["unknown-role-1", "unknown-role-2"];
      expect(mapKeycloakRolesToInternal(keycloakRoles)).toEqual([]);
    });

    it("should handle mixed case roles", () => {
      const keycloakRoles = ["REALM-ADMIN", "realm-manager", "Realm-Employee"];
      const mapped = mapKeycloakRolesToInternal(keycloakRoles);
      expect(mapped).toEqual(["admin", "manager", "employee"]);
    });
  });

  describe("getUnmappedRoles", () => {
    it("should return roles that are not mapped", () => {
      const keycloakRoles = ["realm-admin", "unknown-role", "offline_access"];
      const unmapped = getUnmappedRoles(keycloakRoles);
      expect(unmapped).toEqual(["unknown-role", "offline_access"]);
    });

    it("should return empty array when all roles are mapped", () => {
      const keycloakRoles = ["realm-admin", "realm-manager", "admin"];
      expect(getUnmappedRoles(keycloakRoles)).toEqual([]);
    });

    it("should return empty array for empty input", () => {
      expect(getUnmappedRoles([])).toEqual([]);
    });

    it("should return all roles when none are mapped", () => {
      const keycloakRoles = ["unknown-1", "unknown-2", "unknown-3"];
      expect(getUnmappedRoles(keycloakRoles)).toEqual(keycloakRoles);
    });
  });

  describe("token roles", () => {
    it("should correctly map roles from actual Keycloak token", () => {
      const tokenRoles = [
        "offline_access",
        "default-roles-next",
        "uma_authorization",
        "uma_protection",
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
        "read-token",
        "manage-account",
        "view-applications",
        "view-consent",
        "view-groups",
        "manage-account-links",
        "manage-consent",
        "delete-account",
        "view-profile",
      ];

      const mapped = mapKeycloakRolesToInternal(tokenRoles);
      
      expect(mapped).toContain("admin");
      expect(mapped.length).toBe(1);
      
      const unmapped = getUnmappedRoles(tokenRoles);
      expect(unmapped).not.toContain("realm-admin");
      expect(unmapped).toContain("offline_access");
      expect(unmapped).toContain("view-realm");
      expect(unmapped.length).toBeGreaterThan(30);
    });
  });
});

