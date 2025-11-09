import type { Role } from "./roles";

export interface PermissionContextValue {
  normalizedRoles: Role[];
  allPermissions: string[];
  realmRoles: string[];
  resourceRolesByResource: Array<{ resource: string; roles: string[] }>;
  groups: string[];
  highestRole: Role | null;
  hasRole: (role: Role) => boolean;
  hasAnyRole: (roles: Role[]) => boolean;
  hasAllRoles: (roles: Role[]) => boolean;
  loading: boolean;
  error: string | null;
}

