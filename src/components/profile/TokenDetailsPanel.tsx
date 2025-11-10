"use client";

import { useEffect } from "react";
import { Card, CardHeader, CardContent, LoadingState } from "@/components/ui";
import { useToken } from "@/contexts/TokenContext";
import { useToast } from "@/contexts/ToastContext";

export function TokenDetailsPanel() {
  const { fullTokenPayload, loading, error } = useToken();
  const toast = useToast();

  useEffect(() => {
    if (error) {
      toast.showError(error);
    }
  }, [error, toast]);

  if (loading) {
    return (
      <Card>
        <CardHeader title="Token Details" />
        <CardContent>
          <LoadingState message="Loading full token details..." />
        </CardContent>
      </Card>
    );
  }

  if (!fullTokenPayload) {
    return (
      <Card>
        <CardHeader title="Token Details" />
        <CardContent>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Token details are not available. Please refresh the page or log in again.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title="Token Details (Full Payload)" />
      <CardContent>
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded border border-gray-200 dark:border-gray-700">
          <pre className="text-xs text-gray-700 dark:text-gray-300 overflow-x-auto">
            {JSON.stringify(fullTokenPayload, null, 2)}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}

