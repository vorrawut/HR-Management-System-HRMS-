/**
 * Page route constants
 * Use these constants instead of hardcoded strings for page navigation
 */

export const PAGE_ROUTES = {
  // Public routes
  HOME: "/",
  LOGIN: "/login",
  LOGOUT: "/logout",
  RESET_PASSWORD: "/reset-password",
  UNAUTHORIZED: "/unauthorized",
  
  // Auth routes
  AUTH_ERROR: "/auth/error",
  
  // Protected routes
  PROFILE: "/profile",
  SECURED: "/Secured",
  
  // Role-based routes
  ADMIN: "/admin",
  MANAGER: "/manager",
  
  // Leave Management routes
  EMPLOYEE_LEAVES: "/employee/leaves",
  EMPLOYEE_LEAVES_NEW: "/employee/leaves/new",
  MANAGER_LEAVES: "/manager/leaves",
} as const;

export type PageRoute = typeof PAGE_ROUTES[keyof typeof PAGE_ROUTES];

/**
 * Helper to check if a route requires authentication
 */
export function isProtectedRoute(pathname: string): boolean {
  const protectedRoutes: readonly string[] = [
    PAGE_ROUTES.HOME,
    PAGE_ROUTES.PROFILE,
    PAGE_ROUTES.SECURED,
    PAGE_ROUTES.ADMIN,
    PAGE_ROUTES.MANAGER,
  ];
  
  return protectedRoutes.includes(pathname);
}

/**
 * Helper to get the redirect URL after login
 */
export function getLoginRedirectUrl(callbackUrl?: string | null): string {
  return callbackUrl && callbackUrl !== PAGE_ROUTES.LOGIN
    ? callbackUrl
    : PAGE_ROUTES.HOME;
}

