"use client";

import { createContext, useContext, useMemo, ReactNode } from "react";
import { useSession } from "next-auth/react";
import { useToken } from "./TokenContext";
import type { PermissionContextValue } from "@/lib/permissions/types";
import {
  normalizeRoles,
  getHighestRole,
  hasRole as checkHasRole,
  hasAnyRole as checkHasAnyRole,
  hasAllRoles as checkHasAllRoles,
  type Role,
} from "@/lib/permissions/roles";
import {
  extractAllPermissions,
  getResourceRolesByResource,
} from "@/lib/permissions/extraction";

const PermissionContext = createContext<PermissionContextValue | null>(null);

export function usePermissions() {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error("usePermissions must be used within PermissionProvider");
  }
  return context;
}

interface PermissionProviderProps {
  children: ReactNode;
}

export function PermissionProvider({ children }: PermissionProviderProps) {
  const { data: session } = useSession();
  const { fullTokenPayload, loading: tokenLoading, error: tokenError } = useToken();

  const value = useMemo<PermissionContextValue>(() => {
    const realmAccess = fullTokenPayload?.realm_access as { roles?: string[] } | undefined;
    const realmRoles = realmAccess && Array.isArray(realmAccess.roles) ? realmAccess.roles : [];

    const resourceRolesByResource = getResourceRolesByResource(
      fullTokenPayload as { resource_access?: Record<string, { roles?: string[] }>; groups?: string[] } | null
    );

    const groups =
      fullTokenPayload && Array.isArray(fullTokenPayload.groups)
        ? (fullTokenPayload.groups as string[])
        : [];

    const allPermissions = extractAllPermissions(
      fullTokenPayload as { realm_access?: { roles?: string[] }; resource_access?: Record<string, { roles?: string[] }> } | null
    );

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

    const normalizedRoles: Role[] = fullTokenPayload && !tokenLoading
      ? normalizeRoles(allRoles)
      : normalizeRoles(session?.roles || []);

    const highestRole = getHighestRole(normalizedRoles);

    return {
      normalizedRoles,
      allPermissions,
      realmRoles,
      resourceRolesByResource,
      groups,
      highestRole,
      hasRole: (role: Role) => checkHasRole(normalizedRoles, role),
      hasAnyRole: (roles: Role[]) => checkHasAnyRole(normalizedRoles, roles),
      hasAllRoles: (roles: Role[]) => checkHasAllRoles(normalizedRoles, roles),
      loading: tokenLoading,
      error: tokenError,
    };
  }, [fullTokenPayload, tokenLoading, tokenError, session?.roles]);

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}

