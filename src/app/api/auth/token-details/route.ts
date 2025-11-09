import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { decodeTokenPayload } from "@/lib/auth/tokenDecode";

/**
 * API route to fetch the full token payload
 * Returns all fields from the token (access_token + id_token merged)
 */
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    let fullPayload: Record<string, unknown> | null = null;

    if (token.fullTokenPayload) {
      fullPayload = { ...token.fullTokenPayload } as Record<string, unknown>;
    } else {
      fullPayload = decodeTokenPayload(
        token.accessToken as string | undefined,
        token.idToken as string | undefined
      );
    }

    if (!fullPayload) {
      return NextResponse.json(
        { error: "No token payload available" },
        { status: 401 }
      );
    }

    if (!fullPayload.realm_access && !fullPayload.resource_access && token.accessToken) {
      try {
        const userinfoUrl = `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/userinfo`;
        const userinfoResponse = await fetch(userinfoUrl, {
          headers: {
            Authorization: `Bearer ${token.accessToken}`,
          },
        });

        if (userinfoResponse.ok) {
          const userinfo = await userinfoResponse.json();
          if (userinfo.realm_access) {
            fullPayload.realm_access = userinfo.realm_access;
          }
          if (userinfo.resource_access) {
            fullPayload.resource_access = userinfo.resource_access;
          }
          if (userinfo.groups) {
            fullPayload.groups = userinfo.groups;
          }
        }
      } catch (error) {
        console.error("[token-details] Error fetching userinfo:", error);
      }
    }

    return NextResponse.json({ tokenPayload: fullPayload });
  } catch (error) {
    console.error("[token-details] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
