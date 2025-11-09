interface PermissionsSummarySectionProps {
  allPermissions: string[];
}

export function PermissionsSummarySection({ allPermissions }: PermissionsSummarySectionProps) {
  if (allPermissions.length === 0) {
    return null;
  }

  return (
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
  );
}

