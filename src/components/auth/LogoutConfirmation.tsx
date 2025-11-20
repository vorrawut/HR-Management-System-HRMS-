"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { secureLogout } from "@/lib/auth/logout";
import { LogoutHeader } from "./LogoutHeader";
import { PAGE_ROUTES } from "@/lib/routes";

export function LogoutConfirmation() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      // secureLogout handles all cleanup and redirects
      await secureLogout({ redirect: true, callbackUrl: PAGE_ROUTES.LOGIN });
    } catch (error) {
      // Fallback redirect if secureLogout fails
      router.push(PAGE_ROUTES.LOGIN);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <Card className="backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 border-gray-200/50 dark:border-gray-700/50 shadow-2xl">
      <CardHeader title="Sign Out" />
      <CardContent className="space-y-6">
        <LogoutHeader />

        <div className="flex gap-3">
          <Button
            onClick={handleCancel}
            variant="secondary"
            size="lg"
            fullWidth
            disabled={loading}
            className="hover:shadow-lg transition-all duration-200"
          >
            Cancel
          </Button>
          <Button
            onClick={handleLogout}
            variant="danger"
            size="lg"
            fullWidth
            disabled={loading}
            className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Signing out...
              </span>
            ) : (
              "Sign Out"
            )}
          </Button>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            This will sign you out from both this application and Keycloak.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
