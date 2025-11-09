import { Badge } from "@/components/ui/Badge";

interface ResourceRolesSectionProps {
  resourceRolesByResource: Array<{ resource: string; roles: string[] }>;
}

export function ResourceRolesSection({ resourceRolesByResource }: ResourceRolesSectionProps) {
  if (resourceRolesByResource.length === 0) {
    return null;
  }

  return (
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
  );
}

