"use client";

import { ReactNode } from "react";
import { Card, CardHeader, CardContent, Button } from "@/components/ui";

interface ConfirmationModalProps {
  title: string;
  message: string | ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ConfirmationModal({
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "info",
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmationModalProps) {
  const variantStyles = {
    danger: {
      icon: (
        <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      buttonVariant: "danger" as const,
    },
    warning: {
      icon: (
        <svg className="w-12 h-12 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      buttonVariant: "secondary" as const,
    },
    info: {
      icon: (
        <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      buttonVariant: "primary" as const,
    },
  };

  const { icon, buttonVariant } = variantStyles[variant];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9998] p-4 animate-in fade-in duration-200">
      <div className="animate-in zoom-in-95 duration-200">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader title={title} />
          <CardContent>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="flex-shrink-0">{icon}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {typeof message === "string" ? <p>{message}</p> : message}
              </div>
              <div className="flex gap-3 w-full pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onCancel}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {cancelText}
                </Button>
                <Button
                  type="button"
                  variant={buttonVariant}
                  onClick={onConfirm}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? "Processing..." : confirmText}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

