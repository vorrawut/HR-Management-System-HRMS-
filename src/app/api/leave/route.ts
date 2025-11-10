import { NextRequest } from "next/server";
import { withErrorHandling, errorResponse, successResponse } from "@/lib/api/utils";
import { auth } from "@/app/api/auth/[...nextauth]/route";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8081";

async function handler(request: NextRequest) {
  const session = await auth();
  
  if (!session) {
    return errorResponse("Unauthorized", 401);
  }

  const accessToken = session.accessToken as string;
  if (!accessToken) {
    return errorResponse("Missing access token", 401);
  }

  const url = `${BACKEND_URL}/api/v1/leave`;
  const method = request.method;

  try {
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: method !== "GET" ? await request.text() : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      return errorResponse(error.message || error.error || "Request failed", response.status);
    }

    const data = await response.json();
    return successResponse(data, response.status);
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Internal server error",
      500
    );
  }
}

export const POST = withErrorHandling(handler);
export const GET = withErrorHandling(handler);

