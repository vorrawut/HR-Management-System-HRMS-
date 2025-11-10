"use client";

import { Suspense } from "react";
import { LoadingState } from "@/components/ui/LoadingState";
import { LoginHeader, LoginForm, useLoginError } from "@/components/auth";

function LoginContent() {
  useLoginError(); // Shows toast notifications for errors

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8 dark:from-gray-900 dark:via-black dark:to-gray-900">
      <div className="w-full max-w-md">
        <LoginHeader />
        <LoginForm error={null} />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-black dark:to-gray-900">
        <LoadingState />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
