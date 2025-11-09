"use client";

import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { InfoField } from "@/components/ui/InfoField";
import { Badge } from "@/components/ui/Badge";
import type { Session } from "next-auth";
import type { Role } from "@/lib/permissions/roles";
import { useToken } from "@/contexts/TokenContext";

interface UserInfoCardProps {
  session: Session | null;
  highestRole: Role | null;
}

export function UserInfoCard({ session, highestRole }: UserInfoCardProps) {
  const { fullTokenPayload } = useToken();
  
  // Extract user fields from full token payload
  const givenName = (fullTokenPayload?.given_name as string | undefined) || "";
  const familyName = (fullTokenPayload?.family_name as string | undefined) || "";
  const preferredUsername = (fullTokenPayload?.preferred_username as string | undefined) || "";
  const emailVerified = (fullTokenPayload?.email_verified as boolean | undefined) ?? false;
  
  return (
    <Card>
      <CardHeader title="User Information" />
      <CardContent className="space-y-3 text-sm">
        <InfoField
          label="Name"
          value={session?.user?.name || "N/A"}
        />
        {givenName && (
          <InfoField
            label="First Name"
            value={givenName}
          />
        )}
        {familyName && (
          <InfoField
            label="Last Name"
            value={familyName}
          />
        )}
        <InfoField
          label="Email"
          value={session?.user?.email || "N/A"}
        />
        <InfoField
          label="Username"
          value={preferredUsername || "N/A"}
        />
        <InfoField
          label="Highest Role"
          value={
            highestRole ? (
              <Badge variant="blue" size="xs">
                {highestRole.charAt(0).toUpperCase() + highestRole.slice(1)}
              </Badge>
            ) : (
              "N/A"
            )
          }
        />
        <InfoField
          label="Email Verified"
          value={
            emailVerified ? (
              <span className="text-green-600 dark:text-green-400">✓ Verified</span>
            ) : (
              <span className="text-red-600 dark:text-red-400">✗ Not Verified</span>
            )
          }
        />
      </CardContent>
    </Card>
  );
}

