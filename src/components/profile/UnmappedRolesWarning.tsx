import { Badge } from "@/components/ui/Badge";
import { getUnmappedRoles } from "@/config/roleMappings";

interface UnmappedRolesWarningProps {
  realmRoles: string[];
  resourceRolesByResource: Array<{ resource: string; roles: string[] }>;
  groups: string[];
}

export function UnmappedRolesWarning({
  realmRoles,
  resourceRolesByResource,
  groups,
}: UnmappedRolesWarningProps) {
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  const allRoles: string[] = [];
  if (realmRoles && realmRoles.length > 0) allRoles.push(...realmRoles);
  resourceRolesByResource.forEach(({ roles }) => allRoles.push(...roles));
  if (groups.length > 0) allRoles.push(...groups);
  const unmapped = getUnmappedRoles(allRoles);

  if (unmapped.length === 0) {
    return null;
  }

  return (
    <div className="border-l-4 border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded">
      <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
        ⚠️ Unmapped Roles ({unmapped.length})
      </h3>
      <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-2">
        These Keycloak roles don't have mappings. Add them to{" "}
        <code className="bg-yellow-100 dark:bg-yellow-900 px-1 rounded">
          src/config/roleMappings.ts
        </code>
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

