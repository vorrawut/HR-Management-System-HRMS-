import { ReactElement } from "react";
import { SessionProvider } from "next-auth/react";
import { TokenProvider } from "@/contexts/TokenContext";
import { PermissionProvider } from "@/contexts/PermissionContext";
import type { Session } from "next-auth";

interface TestWrapperProps {
  children: ReactElement;
  session?: Session | null;
}

/**
 * Wraps components with all necessary providers for testing
 */
export function TestWrapper({ children, session = null }: TestWrapperProps) {
  return (
    <SessionProvider session={session}>
      <TokenProvider>
        <PermissionProvider>{children}</PermissionProvider>
      </TokenProvider>
    </SessionProvider>
  );
}

