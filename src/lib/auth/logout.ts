/**
 * Comprehensive logout utility that securely clears all authentication data
 * including tokens, cookies, and client-side state
 */

import { signOut } from "next-auth/react";
import { API_ROUTES, PAGE_ROUTES } from "@/lib/routes";

/**
 * Clears all client-side storage (localStorage, sessionStorage)
 * Only clears auth-related keys to avoid affecting other app data
 */
function clearClientStorage(): void {
  if (typeof window === "undefined") return;

  try {
    // Clear any auth-related localStorage items
    const authKeys = [
      "nextauth.session",
      "nextauth.csrf",
      "auth_token",
      "access_token",
      "id_token",
      "refresh_token",
    ];

    authKeys.forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch {
        // Ignore errors (may not exist or in private mode)
      }
    });

    // Clear any auth-related sessionStorage items
    authKeys.forEach((key) => {
      try {
        sessionStorage.removeItem(key);
      } catch {
        // Ignore errors
      }
    });
  } catch (error) {
    // Ignore errors (may be in private browsing mode)
    if (process.env.NODE_ENV === "development") {
      console.warn("[Logout] Failed to clear client storage:", error);
    }
  }
}

/**
 * Clears all cookies related to authentication
 * This is a fallback - NextAuth's signOut should handle this, but we ensure it's done
 * Note: Keycloak cookies are on Keycloak's domain and cannot be cleared from JavaScript
 * They must be cleared via the Keycloak logout endpoint
 */
function clearAuthCookies(): void {
  if (typeof document === "undefined") return;

  try {
    const cookies = document.cookie.split(";");

    // List of cookie patterns to clear
    const authCookiePatterns = [
      "next-auth",
      "nextauth",
      "__Secure-next-auth",
      "__Host-next-auth",
      "authjs",
      "keycloak", // Try to clear any Keycloak cookies on our domain
    ];

    cookies.forEach((cookie) => {
      const cookieName = cookie.split("=")[0].trim();
      const shouldClear = authCookiePatterns.some((pattern) =>
        cookieName.toLowerCase().includes(pattern.toLowerCase())
      );

      if (shouldClear) {
        // Clear cookie by setting it to expire in the past
        // Try multiple domain/path combinations for thoroughness
        const domains = ["", window.location.hostname, `.${window.location.hostname}`];
        const paths = ["/", "/api", "/api/auth"];

        domains.forEach((domain) => {
          paths.forEach((path) => {
            const domainPart = domain ? `; domain=${domain}` : "";
            // Try with and without Secure flag
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}${domainPart}; SameSite=Lax`;
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}${domainPart}; SameSite=Strict`;
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}${domainPart}; SameSite=Lax; Secure`;
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}${domainPart}; SameSite=Strict; Secure`;
          });
        });
      }
    });
  } catch (error) {
    // Ignore errors
    if (process.env.NODE_ENV === "development") {
      console.warn("[Logout] Failed to clear cookies:", error);
    }
  }
}

/**
 * Performs federated logout with Keycloak
 * Returns the logout URL if successful
 */
async function performFederatedLogout(): Promise<string | null> {
  try {
    const response = await fetch(API_ROUTES.AUTH.FEDERATED_LOGOUT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Include cookies for session
    });

    if (response.ok) {
      const data = await response.json();
      return data.logoutUrl || null;
    }

    return null;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Logout] Federated logout failed:", error);
    }
    return null;
  }
}

/**
 * Comprehensive logout function that securely clears all authentication data
 * 
 * Steps:
 * 1. Clear client-side storage (localStorage, sessionStorage)
 * 2. Clear auth cookies explicitly
 * 3. Sign out from NextAuth (clears NextAuth session cookies)
 * 4. Perform federated logout with Keycloak if available
 * 5. Redirect to login page
 * 
 * @param options - Logout options
 * @param options.redirect - Whether to redirect after logout (default: true)
 * @param options.callbackUrl - URL to redirect to after logout (default: login page)
 */
export async function secureLogout(options?: {
  redirect?: boolean;
  callbackUrl?: string;
}): Promise<void> {
  const { redirect = true, callbackUrl = PAGE_ROUTES.LOGIN } = options || {};

  try {
    // Step 1: Clear client-side storage first
    clearClientStorage();

    // Step 2: Clear auth cookies explicitly (before signOut)
    clearAuthCookies();

    // Step 3: Get federated logout URL before signing out (we need the session)
    const logoutUrl = await performFederatedLogout();

    // Step 4: Sign out from NextAuth (this clears NextAuth session cookies)
    await signOut({ redirect: false });

    // Step 5: Clear cookies again after signOut (ensure everything is cleared)
    clearAuthCookies();

    // Step 6: If we have a Keycloak logout URL, redirect there for federated logout
    if (logoutUrl) {
      // Set a flag in sessionStorage to force login screen after logout
      // This ensures Keycloak shows login screen even if SSO session exists
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem("force_login", "true");
        } catch {
          // Ignore if sessionStorage is not available
        }
      }
      
      // Use window.location.replace to prevent back button navigation
      window.location.replace(logoutUrl);
      return;
    }

    // Step 7: If no federated logout, set flag and redirect to login page
    if (redirect) {
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem("force_login", "true");
        } catch {
          // Ignore if sessionStorage is not available
        }
      }
      window.location.replace(callbackUrl);
    }
  } catch (error) {
    // Even if there's an error, try to clear everything and redirect
    clearClientStorage();
    clearAuthCookies();

    if (process.env.NODE_ENV === "development") {
      console.error("[Logout] Error during secure logout:", error);
    }

    // Fallback: Force redirect to login
    if (redirect) {
      try {
        await signOut({ callbackUrl, redirect: true });
      } catch {
        // Last resort: direct navigation
        if (typeof window !== "undefined") {
          window.location.replace(callbackUrl);
        }
      }
    }
  }
}

