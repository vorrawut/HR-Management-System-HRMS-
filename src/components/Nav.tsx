"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import Login from "./Login";
import Logout from "./Logout";
import { usePermissions } from "@/contexts/PermissionContext";

export default function Nav() {
  const { data: session, status } = useSession();
  const { highestRole, hasRole } = usePermissions();

  const isEmployee = hasRole("employee");
  const isManager = hasRole("manager");
  const isAdmin = hasRole("admin");

  return (
    <nav className="flex items-center gap-4 p-4 border-b border-gray-200 dark:border-gray-800">
      <Link
        href="/"
        className="text-lg font-semibold text-black dark:text-white"
      >
        Home
      </Link>
      {status === "authenticated" && (
        <>
          <Link
            href="/profile"
            className="text-lg font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            Profile
          </Link>
          {isEmployee && (
            <Link
              href="/Secured"
              className="text-lg font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Dashboard
            </Link>
          )}
          {isManager && (
            <Link
              href="/manager"
              className="text-lg font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Approvals
            </Link>
          )}
          {isAdmin && (
            <>
              <Link
                href="/admin"
                className="text-lg font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                Admin Panel
              </Link>
              <Link
                href="/manager"
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
            <Logout />
          </div>
        ) : (
          <Login />
        )}
      </div>
    </nav>
  );
}

