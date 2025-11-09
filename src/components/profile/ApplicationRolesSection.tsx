import { Badge } from "@/components/ui/Badge";
import type { Role } from "@/lib/permissions/roles";

interface ApplicationRolesSectionProps {
  normalizedRoles: Role[];
}

export function ApplicationRolesSection({ normalizedRoles }: ApplicationRolesSectionProps) {
  return (
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
          <span className="text-gray-500 dark:text-gray-400 text-sm block">
            No application roles assigned. Please log out and log back in to refresh roles.
          </span>
        )}
      </div>
    </div>
  );
}

