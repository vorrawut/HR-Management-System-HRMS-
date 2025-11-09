"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import Link from "next/link";

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const getErrorMessage = (errorCode: string | null): string => {
    switch (errorCode) {
      case "Configuration":
        return "There's a problem with the server configuration. Please contact support.";
      case "AccessDenied":
        return "Access denied. You don't have permission to access this application.";
      case "Verification":
        return "The verification token has expired or has already been used.";
      case "CredentialsSignin":
        return "Invalid credentials. Please check your username and password.";
      case "OAuthSignin":
        return "Error occurred during OAuth sign in. Please try again.";
      case "OAuthCallback":
        return "Error occurred during OAuth callback. Please try again.";
      case "OAuthCreateAccount":
        return "Could not create OAuth account. Please contact support.";
      case "EmailCreateAccount":
        return "Could not create email account. Please contact support.";
      case "Callback":
        return "Error occurred during callback. Please try again.";
      case "OAuthAccountNotLinked":
        return "This account is already linked to another user.";
      case "EmailSignin":
        return "Error sending email. Please try again.";
      case "CredentialsSignin":
        return "Invalid credentials. Please check your username and password.";
      case "SessionRequired":
        return "Please sign in to access this page.";
      default:
        return "An unexpected error occurred during authentication. Please try again.";
    }
  };

  const errorMessage = getErrorMessage(error);
  const isPasswordResetError = error?.toLowerCase().includes("password") || 
                               error?.toLowerCase().includes("temporary");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-8 dark:bg-black">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader title="Authentication Error" />
          <CardContent className="space-y-4">
            <ErrorState message={errorMessage} />

            {isPasswordResetError && (
              <div className="rounded-md bg-yellow-50 p-4 dark:bg-yellow-900/20">
                <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">
                  Password Reset Required
                </p>
                <p className="mt-2 text-sm text-yellow-700 dark:text-yellow-400">
                  It looks like you need to reset your password. This usually happens on your first login after an administrator creates your account.
                </p>
                <div className="mt-4">
                  <Link href="/reset-password">
                    <Button variant="primary" size="md" fullWidth>
                      Go to Password Reset
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Link href="/login" className="flex-1">
                <Button variant="primary" size="lg" fullWidth>
                  Try Again
                </Button>
              </Link>
              <Link href="/" className="flex-1">
                <Button variant="secondary" size="lg" fullWidth>
                  Go Home
                </Button>
              </Link>
            </div>

            {error && process.env.NODE_ENV === "development" && (
              <div className="mt-4 rounded-md bg-gray-100 p-3 dark:bg-gray-800">
                <p className="text-xs font-mono text-gray-600 dark:text-gray-400">
                  Error code: {error}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <LoadingState />
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  );
}

