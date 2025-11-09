import { Badge } from "@/components/ui/Badge";

interface RealmRolesSectionProps {
  realmRoles: string[];
}

export function RealmRolesSection({ realmRoles }: RealmRolesSectionProps) {
  if (!realmRoles || realmRoles.length === 0) {
    return null;
  }

  return (
    <div>
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Realm Roles ({realmRoles.length})
      </h3>
      <div className="flex flex-wrap gap-2">
        {realmRoles.map((role) => (
          <Badge key={role} variant="blue">
            {role}
          </Badge>
        ))}
      </div>
    </div>
  );
}

