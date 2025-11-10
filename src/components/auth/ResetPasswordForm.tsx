"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { useToast } from "@/contexts/ToastContext";
import { FirstTimeLoginSection } from "./FirstTimeLoginSection";
import { ForgotPasswordSection } from "./ForgotPasswordSection";
import { API_ROUTES } from "@/lib/routes";

interface KeycloakConfig {
  issuer: string;
  clientId: string;
}

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [config, setConfig] = useState<KeycloakConfig | null>(null);

  const errorParam = searchParams.get("error");

  useEffect(() => {
    fetch(API_ROUTES.AUTH.KEYCLOAK_CONFIG)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          toast.showError(data.error);
        } else {
          setConfig(data);
        }
      })
      .catch(() => {
        toast.showError("Failed to load configuration. Please contact support.");
      });

    if (errorParam) {
      toast.showError(decodeURIComponent(errorParam));
    }
  }, [errorParam, toast]);

  const handleResetPassword = () => {
    if (!config) {
      toast.showError("Configuration not loaded. Please wait and try again.");
      return;
    }

    setLoading(true);
    setInfo(null);

    const resetUrl = `${config.issuer}/login-actions/reset-credentials?client_id=${config.clientId}`;
    window.location.href = resetUrl;
  };

  const handleFirstTimeLogin = () => {
    if (!config) {
      toast.showError("Configuration not loaded. Please wait and try again.");
      return;
    }

    setLoading(true);
    toast.showInfo("Redirecting to Keycloak login. If this is your first login, you'll be prompted to reset your password.");
    setInfo("Redirecting to Keycloak login. If this is your first login, you'll be prompted to reset your password.");

    const redirectUri = encodeURIComponent(`${window.location.origin}/api/auth/callback/keycloak`);
    const loginUrl = `${config.issuer}/protocol/openid-connect/auth?client_id=${config.clientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid email profile`;
    
    window.location.href = loginUrl;
  };

  return (
    <Card className="backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 border-gray-200/50 dark:border-gray-700/50 shadow-2xl">
      <CardHeader title="Password Reset" />
      <CardContent className="space-y-6">
        {info && (
          <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4 text-sm text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            {info}
          </div>
        )}

        <div className="space-y-6">
          <FirstTimeLoginSection
            onFirstTimeLogin={handleFirstTimeLogin}
            loading={loading}
          />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                OR
              </span>
            </div>
          </div>

          <ForgotPasswordSection
            onResetPassword={handleResetPassword}
            loading={loading}
          />
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            Need help? Contact your administrator or support team.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
