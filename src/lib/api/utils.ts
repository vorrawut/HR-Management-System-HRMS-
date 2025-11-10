import { NextResponse } from "next/server";
import type { ApiResponse, ApiError } from "./types";

/**
 * Creates a successful API response
 */
export function successResponse<T>(
  data: T,
  status: number = 200
): NextResponse<ApiResponse<T>> {
  // 204 No Content must have no body
  if (status === 204) {
    return new NextResponse(null, { status: 204 });
  }
  
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  );
}

/**
 * Creates an error API response
 */
export function errorResponse(
  error: string,
  status: number = 400,
  message?: string
): NextResponse<ApiError> {
  return NextResponse.json(
    {
      error,
      message,
      statusCode: status,
    },
    { status }
  );
}

/**
 * Creates an unauthorized response
 */
export function unauthorizedResponse(
  message: string = "Unauthorized"
): NextResponse<ApiError> {
  return errorResponse("Unauthorized", 401, message);
}

/**
 * Creates a not found response
 */
export function notFoundResponse(
  message: string = "Resource not found"
): NextResponse<ApiError> {
  return errorResponse("Not Found", 404, message);
}

/**
 * Creates an internal server error response
 */
export function internalErrorResponse(
  message: string = "Internal server error"
): NextResponse<ApiError> {
  return errorResponse("Internal Server Error", 500, message);
}

/**
 * Wraps an async route handler with error handling
 */
export function withErrorHandling<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("[API Error]:", error);
      }
      
      const message =
        error instanceof Error ? error.message : "An unexpected error occurred";
      
      return internalErrorResponse(message);
    }
  };
}

