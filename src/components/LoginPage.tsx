"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import Link from "next/link";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const errorParam = searchParams.get("error");
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  useEffect(() => {
    // Check if user is already logged in
    getSession().then((session) => {
      if (session) {
        router.push(callbackUrl);
      }
    });

    // Handle error messages from NextAuth
    if (errorParam) {
      switch (errorParam) {
        case "Configuration":
          setError("There's a problem with the server configuration. Please contact support.");
          break;
        case "AccessDenied":
          setError("Access denied. You don't have permission to access this application.");
          break;
        case "Verification":
          setError("The verification token has expired or has already been used.");
          break;
        case "Default":
          setError("An error occurred during authentication. Please try again.");
          break;
        default:
          setError("An unexpected error occurred. Please try again.");
      }
    }
  }, [errorParam, callbackUrl, router]);

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Redirect to Keycloak for authentication
      // Keycloak will handle password reset automatically if needed
      await signIn("keycloak", {
        callbackUrl,
        redirect: true,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-8 dark:bg-black">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-black dark:text-zinc-50">
            Welcome Back
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Sign in to your account to continue
          </p>
        </div>

        <Card>
          <CardHeader title="Sign In" />
          <CardContent className="space-y-4">
            {error && <ErrorState message={error} />}

            <div className="space-y-4">
              <Button
                onClick={handleLogin}
                variant="primary"
                size="lg"
                fullWidth
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign in with Keycloak"}
              </Button>

              <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                <p>
                  Don't have an account?{" "}
                  <Link
                    href="/reset-password"
                    className="text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Reset password
                  </Link>
                </p>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                By signing in, you agree to our terms of service and privacy policy.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <LoadingState />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}

