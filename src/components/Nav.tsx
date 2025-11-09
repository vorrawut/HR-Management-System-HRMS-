"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import Login from "./Login";
import Logout from "./Logout";

export default function Nav() {
  const { data: session, status } = useSession();

  return (
    <nav className="flex items-center gap-4 p-4 border-b border-gray-200 dark:border-gray-800">
      <Link
        href="/"
        className="text-lg font-semibold text-black dark:text-white"
      >
        Home
      </Link>
      {status === "authenticated" && (
        <Link
          href="/Secured"
          className="text-lg font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          Secured Page
        </Link>
      )}
      <div className="ml-auto">
        {status === "loading" ? (
          <div className="text-gray-500">Loading...</div>
        ) : status === "authenticated" ? (
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {session?.user?.name || session?.user?.email}
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

