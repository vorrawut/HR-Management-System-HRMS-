"use client";

import { useSession } from "next-auth/react";

export default function SecuredPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-red-600">Access Denied. Please log in.</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-6">
        <h1 className="text-3xl font-bold text-black dark:text-white">
          Secured Page
        </h1>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-black dark:text-white">
            Welcome, {session?.user?.name || session?.user?.email}!
          </h2>
          <div className="space-y-2 text-gray-700 dark:text-gray-300">
            <p>
              <strong>Email:</strong> {session?.user?.email}
            </p>
            {session?.user?.name && (
              <p>
                <strong>Name:</strong> {session?.user?.name}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

