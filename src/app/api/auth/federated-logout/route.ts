import { NextRequest } from "next/server";
import { withErrorHandling, errorResponse, successResponse } from "@/lib/api/utils";
import { getFederatedLogoutUrl } from "@/lib/api/auth/services";
import { auth } from "../[...nextauth]/route";

async function handler(request: NextRequest) {
  // Verify user is authenticated before allowing logout
  const session = await auth();
  
  if (!session) {
    // If no session, return success anyway (already logged out)
    return successResponse({ logoutUrl: null });
  }

  // Convert NextRequest to Request for the service
  const serviceRequest = new Request(request.url, {
    method: request.method,
    headers: request.headers,
    body: request.body,
  });
  
  const result = await getFederatedLogoutUrl(serviceRequest);

  if ("error" in result) {
    return errorResponse(result.error, result.status);
  }

  return successResponse(result);
}

export const POST = withErrorHandling(handler);
