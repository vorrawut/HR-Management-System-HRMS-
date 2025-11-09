"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";
import { TokenProvider } from "@/contexts/TokenContext";
import { PermissionProvider } from "@/contexts/PermissionContext";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <TokenProvider>
        <PermissionProvider>{children}</PermissionProvider>
      </TokenProvider>
    </SessionProvider>
  );
}

