import { NextRequest } from "next/server";
import { withErrorHandling, errorResponse, successResponse } from "@/lib/api/utils";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { hasAnyRole } from "@/lib/permissions/roles";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8081";

async function handler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  
  if (!session) {
    return errorResponse("Unauthorized", 401);
  }

  const userRoles = session.roles || [];
  if (!hasAnyRole(userRoles, ["manager", "admin"])) {
    return errorResponse("Forbidden", 403);
  }

  const accessToken = session.accessToken as string;
  if (!accessToken) {
    return errorResponse("Missing access token", 401);
  }

  const { id } = await params;
  const url = `${BACKEND_URL}/api/v1/manager/leave/${id}/approve`;

  try {
    const body = await request.text();
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      return errorResponse(error.message || error.error || "Request failed", response.status);
    }

    const data = await response.json();
    return successResponse(data);
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Internal server error",
      500
    );
  }
}

export const PUT = withErrorHandling(handler);
