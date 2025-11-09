"use client";

import { useSession } from "next-auth/react";
import { usePermissions } from "@/contexts/PermissionContext";
import { Card, CardContent } from "@/components/ui";
import { PageHeader } from "@/components/ui";
import { WelcomeCard, FeatureCard, RolesDisplay } from "@/components/dashboard";

export default function ManagerDashboard() {
  const { data: session } = useSession();
  const { highestRole } = usePermissions();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-4xl w-full space-y-6">
        <PageHeader title="Manager Dashboard" backHref="/" />
        <Card>
          <CardContent className="space-y-4">
            <WelcomeCard session={session} highestRole={highestRole} />

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h3 className="text-lg font-semibold mb-4 text-black dark:text-white">
                Manager Features
              </h3>
              <div className="space-y-3">
                <FeatureCard
                  title="Pending Approvals"
                  description="Review and approve/reject pending requests from employees."
                  note="(Mocked data - future API integration)"
                />
                <FeatureCard
                  title="Employee Reports"
                  description="View reports and analytics for your team members."
                />
                <FeatureCard
                  title="Team Management"
                  description="View subordinate data and manage team activities."
                />
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <RolesDisplay session={session} variant="green" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

