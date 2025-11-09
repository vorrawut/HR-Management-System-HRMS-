import { auth } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { hasAnyRole, type Role } from "@/lib/permissions/roles";

interface PrivateRouteProps {
  children: ReactNode;
  roles?: Role[];
}

export async function PrivateRoute({ children, roles }: PrivateRouteProps) {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  if (roles && roles.length > 0) {
    const userRoles = session.roles || [];
    if (!hasAnyRole(userRoles, roles)) {
      redirect("/unauthorized");
    }
  }

  return <>{children}</>;
}

