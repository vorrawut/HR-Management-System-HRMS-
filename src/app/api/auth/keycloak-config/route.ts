import { NextResponse } from "next/server";

/**
 * API route to get Keycloak configuration for client-side use
 * Only exposes safe, non-sensitive configuration
 */
export async function GET() {
  const issuer = process.env.KEYCLOAK_ISSUER;
  const clientId = process.env.KEYCLOAK_CLIENT_ID;

  if (!issuer || !clientId) {
    return NextResponse.json(
      { error: "Keycloak configuration not found" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    issuer,
    clientId,
  });
}

