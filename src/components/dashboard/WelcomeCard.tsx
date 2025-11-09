import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { Session } from "next-auth";
import type { Role } from "@/lib/permissions/roles";

interface WelcomeCardProps {
  session: Session | null;
  highestRole: Role | null;
}

export function WelcomeCard({ session, highestRole }: WelcomeCardProps) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-2 text-black dark:text-white">
        Welcome, {session?.user?.name || session?.user?.email}
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Role: {highestRole ? (
          <Badge variant="blue" size="xs">
            {highestRole.charAt(0).toUpperCase() + highestRole.slice(1)}
          </Badge>
        ) : (
          "Unknown"
        )}
      </p>
    </div>
  );
}

