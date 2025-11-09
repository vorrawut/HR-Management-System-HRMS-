import { Badge } from "@/components/ui/Badge";

interface GroupsSectionProps {
  groups: string[];
}

export function GroupsSection({ groups }: GroupsSectionProps) {
  if (groups.length === 0) {
    return null;
  }

  return (
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
  );
}

