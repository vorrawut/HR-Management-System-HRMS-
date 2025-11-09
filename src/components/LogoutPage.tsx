"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/LoadingState";
import { federatedLogout } from "@/lib/auth/federatedLogout";

export default function LogoutPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingState />
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/");
    return null;
  }

  const handleLogout = async () => {
    setLoading(true);
    try {
      await federatedLogout();
    } catch (error) {
      // Error is handled by federatedLogout, just redirect
      router.push("/");
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-8 dark:bg-black">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader title="Sign Out" />
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-gray-700 dark:text-gray-300">
                Are you sure you want to sign out?
              </p>
              {session?.user && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Signed in as <strong>{session.user.name || session.user.email}</strong>
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleCancel}
                variant="secondary"
                size="lg"
                fullWidth
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleLogout}
                variant="danger"
                size="lg"
                fullWidth
                disabled={loading}
              >
                {loading ? "Signing out..." : "Sign Out"}
              </Button>
            </div>

            <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                This will sign you out from both this application and Keycloak.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

