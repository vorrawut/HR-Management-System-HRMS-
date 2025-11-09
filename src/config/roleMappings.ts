import type { Role } from "@/lib/permissions/roles";

/**
 * ROLE MAPPING CONFIGURATION
 * 
 * This file maps Keycloak role names to our internal application roles.
 * 
 * When Keycloak roles change:
 * 1. Add new mappings here for new Keycloak roles
 * 2. Remove mappings for roles that no longer exist
 * 3. Update internal roles if business logic changes
 * 
 * Internal Roles:
 * - "admin": Full system access
 * - "manager": Management access
 * - "employee": Standard user access
 */

export interface RoleMappingConfig {
  keycloakRole: string;
  internalRole: Role;
  description?: string;
  source?: "realm" | "resource" | "group";
}

/**
 * EXPLICIT ROLE MAPPINGS
 * 
 * Add Keycloak role names here that should map to internal roles.
 * These are checked first (exact match, case-insensitive).
 * 
 * Format: { keycloakRole: "keycloak-role-name", internalRole: "admin|manager|employee" }
 */
export const ROLE_MAPPINGS: RoleMappingConfig[] = [
  // ============================================
  // REALM ROLES (from realm_access.roles)
  // ============================================
  // Add realm roles here if they should map to internal roles
  // Example: { keycloakRole: "offline_access", internalRole: "employee", source: "realm" },
  
  // ============================================
  // RESOURCE ROLES (from resource_access.{resource}.roles)
  // ============================================
  
  // Realm Management Roles (from resource_access.realm-management.roles)
  { 
    keycloakRole: "realm-admin", 
    internalRole: "admin", 
    description: "Keycloak realm administrator role",
    source: "resource"
  },
  { keycloakRole: "realm-manager", internalRole: "manager", source: "resource" },
  { keycloakRole: "realm-employee", internalRole: "employee", source: "resource" },
  
  // Application Client Roles (from resource_access.{client-id}.roles)
  // Add your application-specific roles here
  // Example: { keycloakRole: "app-admin", internalRole: "admin", source: "resource" },
  // Example: { keycloakRole: "app-manager", internalRole: "manager", source: "resource" },
  
  // ============================================
  // GROUP-BASED ROLES (from groups)
  // ============================================
  // If you use Keycloak groups that map to roles, add them here
  // Example: { keycloakRole: "/admins", internalRole: "admin", source: "group" },
  // Example: { keycloakRole: "/managers", internalRole: "manager", source: "group" },
  
  // ============================================
  // COMMON VARIATIONS (fallback patterns)
  // ============================================
  { keycloakRole: "admin", internalRole: "admin" },
  { keycloakRole: "admins", internalRole: "admin" },
  { keycloakRole: "administrator", internalRole: "admin" },
  { keycloakRole: "administrators", internalRole: "admin" },
  
  { keycloakRole: "manager", internalRole: "manager" },
  { keycloakRole: "managers", internalRole: "manager" },
  { keycloakRole: "management", internalRole: "manager" },
  
  { keycloakRole: "employee", internalRole: "employee" },
  { keycloakRole: "employees", internalRole: "employee" },
  { keycloakRole: "user", internalRole: "employee", description: "Default user role" },
  { keycloakRole: "users", internalRole: "employee" },
  { keycloakRole: "staff", internalRole: "employee" },
];

/**
 * PATTERN-BASED MAPPINGS (regex patterns)
 * 
 * Use these for flexible matching when exact names vary.
 * Only add patterns here if you can't use explicit mappings above.
 */
export const ROLE_PATTERNS: Array<{
  pattern: RegExp;
  internalRole: Role;
  description?: string;
}> = [
  // Match any role starting with "realm-admin" (case-insensitive)
  { pattern: /^realm-admin/i, internalRole: "admin", description: "Roles starting with 'realm-admin'" },
  { pattern: /^realm-manager/i, internalRole: "manager", description: "Roles starting with 'realm-manager'" },
  { pattern: /^realm-employee/i, internalRole: "employee", description: "Roles starting with 'realm-employee'" },
  
  // Fallback: match roles containing keywords (use sparingly)
  // { pattern: /.*admin.*/i, internalRole: "admin", description: "Roles containing 'admin'" },
  // { pattern: /.*manager.*/i, internalRole: "manager", description: "Roles containing 'manager'" },
];

/**
 * Maps a Keycloak role to internal role using explicit mappings first, then patterns
 */
export function mapKeycloakRoleToInternal(keycloakRole: string): Role | null {
  const normalized = keycloakRole.trim();
  
  // 1. Check explicit mappings (exact match, case-insensitive)
  for (const mapping of ROLE_MAPPINGS) {
    if (mapping.keycloakRole.toLowerCase() === normalized.toLowerCase()) {
      return mapping.internalRole;
    }
  }
  
  // 2. Check pattern-based mappings
  for (const patternMapping of ROLE_PATTERNS) {
    if (patternMapping.pattern.test(normalized)) {
      return patternMapping.internalRole;
    }
  }
  
  return null;
}

/**
 * Maps multiple Keycloak roles to internal roles
 * Returns unique, deduplicated array
 */
export function mapKeycloakRolesToInternal(keycloakRoles: string[]): Role[] {
  const mappedRoles = keycloakRoles
    .map((role) => mapKeycloakRoleToInternal(role))
    .filter((role): role is Role => role !== null);
  
  return Array.from(new Set(mappedRoles));
}

/**
 * Get all unmapped roles (for debugging/visibility)
 * Useful to see which Keycloak roles don't have mappings
 */
export function getUnmappedRoles(keycloakRoles: string[]): string[] {
  return keycloakRoles.filter((role) => mapKeycloakRoleToInternal(role) === null);
}

