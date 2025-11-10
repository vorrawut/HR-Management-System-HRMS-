"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/contexts/ToastContext";
import { PAGE_ROUTES, getLoginRedirectUrl } from "@/lib/routes";
import Link from "next/link";

interface LoginFormProps {
  error: string | null;
}

export function LoginForm({ error }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const callbackUrl = getLoginRedirectUrl(searchParams.get("callbackUrl"));

  useEffect(() => {
    if (error) {
      toast.showError(error);
    }
  }, [error, toast]);

  const handleLogin = async () => {
    try {
      setLoading(true);
      await signIn("keycloak", {
        callbackUrl,
        redirect: true,
      });
    } catch (err) {
      setLoading(false);
    }
  };

  return (
    <Card className="backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 border-gray-200/50 dark:border-gray-700/50 shadow-2xl">
      <CardHeader title="Sign In" />
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Button
            onClick={handleLogin}
            variant="primary"
            size="lg"
            fullWidth
            disabled={loading}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
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
                Signing in...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                  />
                </svg>
                Sign in with Keycloak
              </span>
            )}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                Need help?
              </span>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/reset-password"
              className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            >
              Reset password or first-time login
            </Link>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            By signing in, you agree to our{" "}
            <Link
              href="#"
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              terms of service
            </Link>{" "}
            and{" "}
            <Link
              href="#"
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              privacy policy
            </Link>
            .
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
