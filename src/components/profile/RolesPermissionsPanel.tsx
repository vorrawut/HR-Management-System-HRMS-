"use client";

import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LoadingState } from "@/components/ui/LoadingState";
import { usePermissions } from "@/contexts/PermissionContext";
import { getUnmappedRoles } from "@/config/roleMappings";

export function RolesPermissionsPanel() {
  const {
    normalizedRoles,
    allPermissions,
    realmRoles,
    resourceRolesByResource,
    groups,
    loading,
  } = usePermissions();
  
  if (loading) {
    return (
      <Card>
        <CardHeader title="Roles & Permissions" />
        <CardContent>
          <LoadingState message="Loading roles and permissions..." />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title="Roles & Permissions" />
      <CardContent className="space-y-4">
        {/* Application Roles */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Application Roles (Normalized)
          </h3>
          <div className="flex flex-wrap gap-2">
            {normalizedRoles.length > 0 ? (
              normalizedRoles.map((role) => (
                <Badge key={role} variant="purple">
                  {role}
                </Badge>
              ))
            ) : (
              <div className="space-y-2">
                <span className="text-gray-500 dark:text-gray-400 text-sm block">
                  No application roles assigned. Please log out and log back in to refresh roles.
                </span>
                {process.env.NODE_ENV === "development" && (
                  <details className="text-xs text-gray-400 dark:text-gray-500">
                    <summary className="cursor-pointer">Debug Info</summary>
                    <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto">
                      {JSON.stringify({
                        normalizedRolesLength: normalizedRoles.length,
                        normalizedRoles,
                        realmRolesCount: realmRoles.length,
                        resourceRolesCount: resourceRolesByResource.reduce((sum, r) => sum + r.roles.length, 0),
                        groupsCount: groups.length,
                      }, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Unmapped Roles Warning (Development Only) */}
        {process.env.NODE_ENV === "development" && !loading && (() => {
          const allRoles: string[] = [];
          if (realmRoles && realmRoles.length > 0) allRoles.push(...realmRoles);
          resourceRolesByResource.forEach(({ roles }) => allRoles.push(...roles));
          if (groups.length > 0) allRoles.push(...groups);
          const unmapped = getUnmappedRoles(allRoles);
          
          if (unmapped.length > 0) {
            return (
              <div className="border-l-4 border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded">
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                  ⚠️ Unmapped Roles ({unmapped.length})
                </h3>
                <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-2">
                  These Keycloak roles don't have mappings. Add them to <code className="bg-yellow-100 dark:bg-yellow-900 px-1 rounded">src/config/roleMappings.ts</code>
                </p>
                <div className="flex flex-wrap gap-2">
                  {unmapped.map((role) => (
                    <Badge key={role} variant="orange">
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>
            );
          }
          return null;
        })()}

        {/* Realm Roles */}
        {realmRoles && realmRoles.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Realm Roles ({realmRoles?.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {realmRoles?.map((role) => (
                <Badge key={role} variant="blue">
                  {role}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Resource Roles */}
        {resourceRolesByResource.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Resource Roles & Permissions
            </h3>
            <div className="space-y-3">
              {resourceRolesByResource.map(({ resource, roles }) => (
                <div
                  key={resource}
                  className="border-l-2 border-green-400 dark:border-green-600 pl-3"
                >
                  <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase">
                    {resource} ({roles.length} {roles.length === 1 ? "permission" : "permissions"})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {roles.map((role) => (
                      <Badge key={`${resource}-${role}`} variant="green">
                        {role}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Groups */}
        {groups.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Groups ({groups.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {groups.map((group) => (
                <Badge key={group} variant="orange">
                  {group}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* All Permissions Summary */}
        {allPermissions.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              All Permissions Summary ({allPermissions.length} total)
            </h3>
            <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {allPermissions.join(", ")}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

