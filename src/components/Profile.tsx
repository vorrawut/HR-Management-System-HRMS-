"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PageHeader, LoadingState } from "@/components/ui";
import { useToast } from "@/contexts/ToastContext";
import { UserInfoCard } from "@/components/profile/UserInfoCard";
import { TokenInfoCard } from "@/components/profile/TokenInfoCard";
import { RolesPermissionsPanel } from "@/components/profile/RolesPermissionsPanel";
import { TokenDetailsPanel } from "@/components/profile/TokenDetailsPanel";
import { PAGE_ROUTES } from "@/lib/routes";

export default function Profile() {
  const { status } = useSession();
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    if (status === "unauthenticated") {
      toast.showWarning("Please log in to view your profile.");
      router.push(PAGE_ROUTES.LOGIN);
    }
  }, [status, router, toast]);

  if (status === "loading") {
    return <LoadingState />;
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-start p-8">
      <div className="max-w-5xl w-full mx-auto space-y-6">
        <PageHeader title="Profile" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <UserInfoCard />
          <TokenInfoCard />
        </div>

        <RolesPermissionsPanel />

        <TokenDetailsPanel />
      </div>
    </div>
  );
}
