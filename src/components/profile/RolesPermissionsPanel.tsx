"use client";

import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { LoadingState } from "@/components/ui/LoadingState";
import { usePermissions } from "@/contexts/PermissionContext";
import { ApplicationRolesSection } from "./ApplicationRolesSection";
import { UnmappedRolesWarning } from "./UnmappedRolesWarning";
import { RealmRolesSection } from "./RealmRolesSection";
import { ResourceRolesSection } from "./ResourceRolesSection";
import { GroupsSection } from "./GroupsSection";
import { PermissionsSummarySection } from "./PermissionsSummarySection";

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
        <ApplicationRolesSection normalizedRoles={normalizedRoles} />
        <UnmappedRolesWarning
          realmRoles={realmRoles}
          resourceRolesByResource={resourceRolesByResource}
          groups={groups}
        />
        <RealmRolesSection realmRoles={realmRoles} />
        <ResourceRolesSection resourceRolesByResource={resourceRolesByResource} />
        <GroupsSection groups={groups} />
        <PermissionsSummarySection allPermissions={allPermissions} />
      </CardContent>
    </Card>
  );
}

