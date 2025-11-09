"use client";

import { useSession } from "next-auth/react";
import { usePermissions } from "@/contexts/PermissionContext";
import { Card, CardContent } from "@/components/ui";
import { PageHeader } from "@/components/ui";
import { WelcomeCard, FeatureCard, RolesDisplay } from "@/components/dashboard";

export default function AdminDashboard() {
  const { data: session } = useSession();
  const { highestRole } = usePermissions();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-4xl w-full space-y-6">
        <PageHeader title="Admin Dashboard" backHref="/" />
        <Card>
          <CardContent className="space-y-4">
            <WelcomeCard session={session} highestRole={highestRole} />

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h3 className="text-lg font-semibold mb-4 text-black dark:text-white">
                Admin Features
              </h3>
              <div className="space-y-3">
                <FeatureCard
                  title="User Management"
                  description="Invite new users, assign roles, and manage access control."
                  note="(Future integration with Keycloak REST API)"
                />
                <FeatureCard
                  title="System Settings"
                  description="Configure application settings and permissions."
                />
                <FeatureCard
                  title="Audit Logs"
                  description="View system activity and user actions."
                  note="(Optional extension)"
                />
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <RolesDisplay session={session} variant="blue" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

