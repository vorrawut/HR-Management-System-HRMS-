import { getToken } from "next-auth/jwt";
import { auth } from "@/app/api/auth/[...nextauth]/route";

export interface FederatedLogoutResult {
  success: boolean;
  logoutUrl: string;
}

export interface FederatedLogoutError {
  error: string;
  status: number;
}

/**
 * Service for handling federated logout logic
 */
export async function getFederatedLogoutUrl(
  request: Request
): Promise<FederatedLogoutResult | FederatedLogoutError> {
  const session = await auth();

  if (!session) {
    return {
      error: "No active session",
      status: 401,
    };
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const idToken = token?.idToken as string | undefined;

  if (!idToken || !process.env.KEYCLOAK_ISSUER) {
    return {
      error: "Missing idToken or Keycloak issuer",
      status: 400,
    };
  }

  const endSessionUrl = `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/logout`;
  
  // Add timestamp to prevent caching and ensure fresh logout
  const timestamp = Date.now();
  const redirectUri = encodeURIComponent(
    `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/login?prompt=login&logout=${timestamp}`
  );
  
  // Construct logout URL with all required parameters for complete session termination
  // id_token_hint: Identifies the session to logout
  // post_logout_redirect_uri: Where to redirect after logout
  // client_id: Required for some Keycloak configurations
  const clientId = process.env.KEYCLOAK_CLIENT_ID || "";
  const logoutUrl = `${endSessionUrl}?` +
    `id_token_hint=${encodeURIComponent(idToken)}&` +
    `post_logout_redirect_uri=${redirectUri}` +
    (clientId ? `&client_id=${encodeURIComponent(clientId)}` : "");

  return {
    success: true,
    logoutUrl,
  };
}

