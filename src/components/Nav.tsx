"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import AuthButton from "./AuthButton";
import { usePermissions } from "@/contexts/PermissionContext";
import { PAGE_ROUTES } from "@/lib/routes";

export default function Nav() {
  const { data: session, status } = useSession();
  const { highestRole, hasRole } = usePermissions();

  const isEmployee = hasRole("employee");
  const isManager = hasRole("manager");
  const isAdmin = hasRole("admin");

  return (
    <nav className="flex items-center gap-4 p-4 border-b border-gray-200 dark:border-gray-800">
      <Link
        href={PAGE_ROUTES.HOME}
        className="text-lg font-semibold text-black dark:text-white"
      >
        Home
      </Link>
      {status === "authenticated" && (
        <>
          <Link
            href={PAGE_ROUTES.PROFILE}
            className="text-lg font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            Profile
          </Link>
            {isEmployee && (
              <>
                <Link
                  href={PAGE_ROUTES.SECURED}
                  className="text-lg font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  Dashboard
                </Link>
                <Link
                  href={PAGE_ROUTES.EMPLOYEE_LEAVES}
                  className="text-lg font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  My Leaves
                </Link>
              </>
            )}
            {isManager && (
              <>
                <Link
                  href={PAGE_ROUTES.MANAGER}
                  className="text-lg font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  Approvals
                </Link>
                <Link
                  href={PAGE_ROUTES.MANAGER_LEAVES}
                  className="text-lg font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  Leave Requests
                </Link>
              </>
            )}
          {isAdmin && (
            <>
              <Link
                href={PAGE_ROUTES.ADMIN}
                className="text-lg font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                Admin Panel
              </Link>
              <Link
                href={PAGE_ROUTES.MANAGER}
                className="text-lg font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                Reports
              </Link>
            </>
          )}
        </>
      )}
      <div className="ml-auto">
        {status === "loading" ? (
          <div className="text-gray-500">Loading...</div>
        ) : status === "authenticated" ? (
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {session?.user?.name || session?.user?.email}
              {highestRole && (
                <span className="ml-2 text-xs text-gray-500">
                  ({highestRole.charAt(0).toUpperCase() + highestRole.slice(1)})
                </span>
              )}
            </span>
            <AuthButton type="logout" />
          </div>
        ) : (
          <AuthButton type="login" />
        )}
      </div>
    </nav>
  );
}

