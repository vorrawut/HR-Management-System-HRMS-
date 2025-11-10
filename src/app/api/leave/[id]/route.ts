import { NextRequest } from "next/server";
import { withErrorHandling, errorResponse, successResponse } from "@/lib/api/utils";
import { auth } from "@/app/api/auth/[...nextauth]/route";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8081";

async function handler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  
  if (!session) {
    return errorResponse("Unauthorized", 401);
  }

  const accessToken = session.accessToken as string;
  if (!accessToken) {
    return errorResponse("Missing access token", 401);
  }

  const { id } = await params;
  const url = `${BACKEND_URL}/api/v1/leave/${id}`;
  const method = request.method;

  try {
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: method !== "GET" && method !== "DELETE" ? await request.text() : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      return errorResponse(error.message || error.error || "Request failed", response.status);
    }

    if (method === "DELETE") {
      return successResponse(null, 204);
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

export const GET = withErrorHandling(handler);
export const PUT = withErrorHandling(handler);
export const DELETE = withErrorHandling(handler);
