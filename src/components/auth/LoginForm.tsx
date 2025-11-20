"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/contexts/ToastContext";
import { PAGE_ROUTES, getLoginRedirectUrl, API_ROUTES } from "@/lib/routes";
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
      
      // Check if we should force login screen (after logout or from query param)
      const searchParams = new URLSearchParams(window.location.search);
      const forceLoginFromQuery = searchParams.get("prompt") === "login" || searchParams.get("logout");
      const forceLoginFromStorage = typeof window !== "undefined" 
        ? sessionStorage.getItem("force_login") === "true"
        : false;
      const forceLogin = forceLoginFromQuery || forceLoginFromStorage;
      
      // Clear the flag and query params
      if (forceLogin && typeof window !== "undefined") {
        try {
          sessionStorage.removeItem("force_login");
          // Remove prompt and logout from URL to prevent re-triggering
          if (forceLoginFromQuery) {
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete("prompt");
            newUrl.searchParams.delete("logout");
            window.history.replaceState({}, "", newUrl.toString());
          }
        } catch {
          // Ignore if sessionStorage is not available
        }
      }
      
      // If force_login flag is set, we need to manually construct the Keycloak URL
      // with prompt=login to force the login screen
      if (forceLogin) {
        try {
          // Fetch Keycloak config from API
          const configResponse = await fetch(API_ROUTES.AUTH.KEYCLOAK_CONFIG);
          const config = await configResponse.json();
          
          if (config.error || !config.issuer || !config.clientId) {
            // Fallback to normal login if config fetch fails
            await signIn("keycloak", { callbackUrl, redirect: true });
            return;
          }
          
          const redirectUri = encodeURIComponent(
            `${window.location.origin}/api/auth/callback/keycloak`
          );
          const callbackUri = encodeURIComponent(callbackUrl);
          
          // Add timestamp to prevent caching
          const timestamp = Date.now();
          
          // Construct Keycloak authorization URL with prompt=login
          // This forces Keycloak to show the login screen even if SSO session exists
          // Using prompt=login ensures user must re-authenticate
          const authUrl = `${config.issuer}/protocol/openid-connect/auth?` +
            `client_id=${encodeURIComponent(config.clientId)}&` +
            `redirect_uri=${redirectUri}&` +
            `response_type=code&` +
            `scope=openid email profile&` +
            `prompt=login&` + // Force login screen
            `kc_idp_hint=&` + // Clear any identity provider hint
            `state=${encodeURIComponent(JSON.stringify({ callbackUrl: callbackUri, ts: timestamp }))}`;
          
          // Use replace to prevent back button navigation
          window.location.replace(authUrl);
          return;
        } catch (configError) {
          // Fallback to normal login if config fetch fails
          await signIn("keycloak", { callbackUrl, redirect: true });
          return;
        }
      }
      
      // Normal login flow - but still add prompt=select_account to show account selection
      // This is less aggressive than prompt=login but still prevents silent auto-login
      try {
        const configResponse = await fetch(API_ROUTES.AUTH.KEYCLOAK_CONFIG);
        const config = await configResponse.json();
        
        if (!config.error && config.issuer && config.clientId) {
          const redirectUri = encodeURIComponent(
            `${window.location.origin}/api/auth/callback/keycloak`
          );
          const callbackUri = encodeURIComponent(callbackUrl);
          const timestamp = Date.now();
          
          // Use prompt=select_account to show account selection screen
          // This prevents silent auto-login while being less aggressive than prompt=login
          const authUrl = `${config.issuer}/protocol/openid-connect/auth?` +
            `client_id=${encodeURIComponent(config.clientId)}&` +
            `redirect_uri=${redirectUri}&` +
            `response_type=code&` +
            `scope=openid email profile&` +
            `prompt=select_account&` + // Show account selection
            `state=${encodeURIComponent(JSON.stringify({ callbackUrl: callbackUri, ts: timestamp }))}`;
          
          window.location.href = authUrl;
          return;
        }
      } catch {
        // Fallback to NextAuth signIn if config fetch fails
      }
      
      // Fallback to normal NextAuth login
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
