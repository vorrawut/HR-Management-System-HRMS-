"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";
import { TokenProvider } from "@/contexts/TokenContext";
import { PermissionProvider } from "@/contexts/PermissionContext";
import { ToastProvider } from "@/contexts/ToastContext";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <TokenProvider>
        <PermissionProvider>
          <ToastProvider>{children}</ToastProvider>
        </PermissionProvider>
      </TokenProvider>
    </SessionProvider>
  );
}

