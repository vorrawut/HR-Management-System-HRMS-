import { NextRequest, NextResponse } from "next/server";
import { auth } from "../[...nextauth]/route";
import { getToken } from "next-auth/jwt";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json({ error: "No active session" }, { status: 401 });
    }

    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    const idToken = token?.idToken as string | undefined;

    if (!idToken || !process.env.KEYCLOAK_ISSUER) {
      return NextResponse.json(
        { error: "Missing idToken or Keycloak issuer" },
        { status: 400 }
      );
    }

    const endSessionUrl = `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/logout`;
    const redirectUri = encodeURIComponent(process.env.NEXTAUTH_URL || "http://localhost:3000");
    const logoutUrl = `${endSessionUrl}?id_token_hint=${idToken}&post_logout_redirect_uri=${redirectUri}`;

    return NextResponse.json({
      success: true,
      logoutUrl,
    });
  } catch (error) {
    console.error("Error in federated logout:", error);
    return NextResponse.json(
      { error: "Failed to perform federated logout" },
      { status: 500 }
    );
  }
}

