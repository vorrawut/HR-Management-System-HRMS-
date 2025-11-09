"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import Link from "next/link";

interface KeycloakConfig {
  issuer: string;
  clientId: string;
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [config, setConfig] = useState<KeycloakConfig | null>(null);

  const errorParam = searchParams.get("error");

  useEffect(() => {
    // Fetch Keycloak config from API
    fetch("/api/auth/keycloak-config")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setConfig(data);
        }
      })
      .catch(() => {
        setError("Failed to load configuration. Please contact support.");
      });

    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
  }, [errorParam]);

  const handleResetPassword = () => {
    if (!config) {
      setError("Configuration not loaded. Please wait and try again.");
      return;
    }

    setLoading(true);
    setError(null);
    setInfo(null);

    // Redirect to Keycloak's password reset page
    const resetUrl = `${config.issuer}/login-actions/reset-credentials?client_id=${config.clientId}`;
    window.location.href = resetUrl;
  };

  const handleFirstTimeLogin = () => {
    if (!config) {
      setError("Configuration not loaded. Please wait and try again.");
      return;
    }

    setLoading(true);
    setError(null);
    setInfo("Redirecting to Keycloak login. If this is your first login, you'll be prompted to reset your password.");

    // Redirect to Keycloak login - it will automatically show password reset if user has temporary password
    const redirectUri = encodeURIComponent(`${window.location.origin}/api/auth/callback/keycloak`);
    const loginUrl = `${config.issuer}/protocol/openid-connect/auth?client_id=${config.clientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid email profile`;
    
    window.location.href = loginUrl;
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-8 dark:bg-black">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-black dark:text-zinc-50">
            Reset Password
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Reset your password or set a new password for first-time login
          </p>
        </div>

        <Card>
          <CardHeader title="Password Reset" />
          <CardContent className="space-y-4">
            {error && <ErrorState message={error} />}
            {info && (
              <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                {info}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <h3 className="mb-2 text-sm font-semibold text-black dark:text-white">
                  First Time Login?
                </h3>
                <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                  If an administrator created your account, you'll need to set a new password on your first login.
                </p>
                <Button
                  onClick={handleFirstTimeLogin}
                  variant="primary"
                  size="lg"
                  fullWidth
                  disabled={loading}
                >
                  {loading ? "Redirecting..." : "Login & Set Password"}
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-2 text-gray-500 dark:bg-black dark:text-gray-400">
                    OR
                  </span>
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold text-black dark:text-white">
                  Forgot Your Password?
                </h3>
                <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                  Request a password reset link to be sent to your email.
                </p>
                <Button
                  onClick={handleResetPassword}
                  variant="secondary"
                  size="lg"
                  fullWidth
                  disabled={loading}
                >
                  {loading ? "Processing..." : "Request Reset Link"}
                </Button>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Need help? Contact your administrator or support team.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            ← Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <LoadingState />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}

