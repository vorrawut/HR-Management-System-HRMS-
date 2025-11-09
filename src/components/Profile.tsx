"use client";

import { useSession } from "next-auth/react";
import { usePermissions } from "@/contexts/PermissionContext";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { UserInfoCard } from "@/components/profile/UserInfoCard";
import { TokenInfoCard } from "@/components/profile/TokenInfoCard";
import { RolesPermissionsPanel } from "@/components/profile/RolesPermissionsPanel";
import { TokenDetailsPanel } from "@/components/profile/TokenDetailsPanel";

export default function Profile() {
  const { data: session, status } = useSession();
  const { highestRole } = usePermissions();

  if (status === "loading") {
    return <LoadingState />;
  }

  if (status === "unauthenticated") {
    return <ErrorState message="Please log in to view your profile." />;
  }

  return (
    <div className="flex min-h-screen flex-col items-start p-8">
      <div className="max-w-5xl w-full mx-auto space-y-6">
        <PageHeader title="Profile" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <UserInfoCard
            session={session}
            highestRole={highestRole}
          />
          <TokenInfoCard />
        </div>

        <RolesPermissionsPanel />

        <TokenDetailsPanel />
      </div>
    </div>
  );
}
