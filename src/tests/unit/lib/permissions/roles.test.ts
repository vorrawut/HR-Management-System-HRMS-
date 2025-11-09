import { describe, it, expect } from "@jest/globals";
import {
  hasRole,
  hasAnyRole,
  hasAllRoles,
  getHighestRole,
  normalizeRoles,
} from "@/lib/permissions/roles";

describe("Role utilities", () => {
  describe("normalizeRoles", () => {
    it("should normalize an array of roles", () => {
      expect(normalizeRoles(["admins", "employees"])).toEqual(["admin", "employee"]);
      expect(normalizeRoles(["managers", "admins"])).toEqual(["manager", "admin"]);
    });

    it("should filter out unknown roles", () => {
      expect(normalizeRoles(["admins", "unknown", "employees"])).toEqual(["admin", "employee"]);
    });

    it("should handle empty arrays", () => {
      expect(normalizeRoles([])).toEqual([]);
    });
  });

  describe("hasRole", () => {
    it("should return true if user has the exact role", () => {
      expect(hasRole(["employee"], "employee")).toBe(true);
      expect(hasRole(["manager"], "manager")).toBe(true);
      expect(hasRole(["admin"], "admin")).toBe(true);
    });

    it("should work with Keycloak group names", () => {
      expect(hasRole(["employees"], "employee")).toBe(true);
      expect(hasRole(["managers"], "manager")).toBe(true);
      expect(hasRole(["admins"], "admin")).toBe(true);
    });

    it("should return true if user has a higher role in hierarchy", () => {
      expect(hasRole(["manager"], "employee")).toBe(true);
      expect(hasRole(["admin"], "employee")).toBe(true);
      expect(hasRole(["admin"], "manager")).toBe(true);
    });

    it("should work with Keycloak group names in hierarchy", () => {
      expect(hasRole(["managers"], "employee")).toBe(true);
      expect(hasRole(["admins"], "employee")).toBe(true);
      expect(hasRole(["admins"], "manager")).toBe(true);
    });

    it("should return false if user doesn't have the role", () => {
      expect(hasRole(["employee"], "manager")).toBe(false);
      expect(hasRole(["employee"], "admin")).toBe(false);
      expect(hasRole(["manager"], "admin")).toBe(false);
    });

    it("should return false for empty or undefined roles", () => {
      expect(hasRole([], "employee")).toBe(false);
      expect(hasRole(undefined, "employee")).toBe(false);
    });

    it("should be case insensitive", () => {
      expect(hasRole(["EMPLOYEE"], "employee")).toBe(true);
      expect(hasRole(["Manager"], "manager")).toBe(true);
      expect(hasRole(["ADMIN"], "admin")).toBe(true);
    });
  });

  describe("hasAnyRole", () => {
    it("should return true if user has any of the required roles", () => {
      expect(hasAnyRole(["employee"], ["employee", "manager"])).toBe(true);
      expect(hasAnyRole(["manager"], ["employee", "manager"])).toBe(true);
      expect(hasAnyRole(["admin"], ["employee", "manager"])).toBe(true);
    });

    it("should work with Keycloak group names", () => {
      expect(hasAnyRole(["employees"], ["employee", "manager"])).toBe(true);
      expect(hasAnyRole(["managers"], ["employee", "manager"])).toBe(true);
      expect(hasAnyRole(["admins"], ["employee", "manager"])).toBe(true);
    });

    it("should return false if user has none of the required roles", () => {
      expect(hasAnyRole(["employee"], ["manager", "admin"])).toBe(false);
    });

    it("should return false for empty or undefined roles", () => {
      expect(hasAnyRole([], ["employee"])).toBe(false);
      expect(hasAnyRole(undefined, ["employee"])).toBe(false);
    });
  });

  describe("hasAllRoles", () => {
    it("should return true if user has all required roles", () => {
      expect(hasAllRoles(["employee", "manager"], ["employee"])).toBe(true);
      expect(hasAllRoles(["admin"], ["employee", "manager", "admin"])).toBe(
        true
      );
    });

    it("should work with Keycloak group names", () => {
      expect(hasAllRoles(["employees", "managers"], ["employee"])).toBe(true);
      expect(hasAllRoles(["admins"], ["employee", "manager", "admin"])).toBe(true);
    });

    it("should return false if user is missing any required role", () => {
      expect(hasAllRoles(["employee"], ["employee", "manager"])).toBe(false);
      expect(hasAllRoles(["manager"], ["employee", "admin"])).toBe(false);
    });

    it("should return false for empty or undefined roles", () => {
      expect(hasAllRoles([], ["employee"])).toBe(false);
      expect(hasAllRoles(undefined, ["employee"])).toBe(false);
    });
  });

  describe("getHighestRole", () => {
    it("should return admin if user has admin role", () => {
      expect(getHighestRole(["admin"])).toBe("admin");
      expect(getHighestRole(["employee", "admin"])).toBe("admin");
      expect(getHighestRole(["manager", "admin"])).toBe("admin");
    });

    it("should work with Keycloak group names", () => {
      expect(getHighestRole(["admins"])).toBe("admin");
      expect(getHighestRole(["employees", "admins"])).toBe("admin");
      expect(getHighestRole(["managers", "admins"])).toBe("admin");
    });

    it("should return manager if user has manager but not admin", () => {
      expect(getHighestRole(["manager"])).toBe("manager");
      expect(getHighestRole(["employee", "manager"])).toBe("manager");
    });

    it("should work with Keycloak group names for manager", () => {
      expect(getHighestRole(["managers"])).toBe("manager");
      expect(getHighestRole(["employees", "managers"])).toBe("manager");
    });

    it("should return employee if user only has employee role", () => {
      expect(getHighestRole(["employee"])).toBe("employee");
    });

    it("should work with Keycloak group names for employee", () => {
      expect(getHighestRole(["employees"])).toBe("employee");
    });

    it("should return null for empty or undefined roles", () => {
      expect(getHighestRole([])).toBe(null);
      expect(getHighestRole(undefined)).toBe(null);
    });

    it("should return null for unknown roles", () => {
      expect(getHighestRole(["unknown"])).toBe(null);
    });
  });
});
