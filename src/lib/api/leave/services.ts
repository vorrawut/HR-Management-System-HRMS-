import { API_ROUTES } from "@/lib/routes";

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  leaveType: "annual" | "sick" | "personal" | "other";
  reason: string;
  startDate: string;
  endDate: string;
  days: number;
  status: "pending" | "approved" | "rejected" | "cancelled";
  managerComment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeaveRequest {
  leaveType: "annual" | "sick" | "personal" | "other";
  reason: string;
  startDate: string;
  endDate: string;
}

export interface UpdateLeaveRequest {
  leaveType?: "annual" | "sick" | "personal" | "other";
  reason?: string;
  startDate?: string;
  endDate?: string;
}

export interface ApproveLeaveRequest {
  comment?: string;
}

export interface RejectLeaveRequest {
  comment: string;
}

/**
 * Make a request to the Next.js API proxy (which forwards to Go backend)
 */
async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetch(endpoint, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include", // Include cookies for session
  });
}

/**
 * Employee Leave Services
 */
export async function createLeaveRequest(
  data: CreateLeaveRequest
): Promise<LeaveRequest> {
  const response = await apiRequest(API_ROUTES.LEAVE.BASE, {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || error.error || "Failed to create leave request");
  }

  const result = await response.json();
  return result.data || result;
}

export async function getLeaveRequests(): Promise<LeaveRequest[]> {
  const response = await apiRequest(API_ROUTES.LEAVE.LIST);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || error.error || "Failed to fetch leave requests");
  }

  const result = await response.json();
  // Handle different response formats
  if (Array.isArray(result)) {
    return result;
  }
  if (result.data && Array.isArray(result.data)) {
    return result.data;
  }
  // If result is a single object or unexpected format, return empty array
  return [];
}

export async function getLeaveRequest(id: string): Promise<LeaveRequest> {
  const response = await apiRequest(API_ROUTES.LEAVE.DETAIL(id));

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || error.error || "Failed to fetch leave request");
  }

  const result = await response.json();
  // Handle wrapped response format: { success: true, data: {...} }
  if (result.data) {
    return result.data;
  }
  return result;
}

export async function updateLeaveRequest(
  id: string,
  data: UpdateLeaveRequest
): Promise<LeaveRequest> {
  const response = await apiRequest(API_ROUTES.LEAVE.DETAIL(id), {
    method: "PUT",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || error.error || "Failed to update leave request");
  }

  const result = await response.json();
  // Handle wrapped response format: { success: true, data: {...} }
  if (result.data) {
    return result.data;
  }
  return result;
}

export async function cancelLeaveRequest(id: string): Promise<void> {
  const response = await apiRequest(API_ROUTES.LEAVE.DETAIL(id), {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || error.error || "Failed to cancel leave request");
  }
}

/**
 * Manager Leave Services
 */
export async function getPendingLeaveRequests(): Promise<LeaveRequest[]> {
  const response = await apiRequest(API_ROUTES.MANAGER.LEAVE.LIST);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || error.error || "Failed to fetch pending leave requests");
  }

  const result = await response.json();
  // Handle different response formats
  if (Array.isArray(result)) {
    return result;
  }
  if (result.data && Array.isArray(result.data)) {
    return result.data;
  }
  // If result is a single object or unexpected format, return empty array
  return [];
}

export async function approveLeaveRequest(
  id: string,
  data: ApproveLeaveRequest
): Promise<LeaveRequest> {
  const response = await apiRequest(API_ROUTES.MANAGER.LEAVE.APPROVE(id), {
    method: "PUT",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || error.error || "Failed to approve leave request");
  }

  const result = await response.json();
  // Handle wrapped response format: { success: true, data: {...} }
  if (result.data) {
    return result.data;
  }
  return result;
}

export async function rejectLeaveRequest(
  id: string,
  data: RejectLeaveRequest
): Promise<LeaveRequest> {
  const response = await apiRequest(API_ROUTES.MANAGER.LEAVE.REJECT(id), {
    method: "PUT",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || error.error || "Failed to reject leave request");
  }

  const result = await response.json();
  // Handle wrapped response format: { success: true, data: {...} }
  if (result.data) {
    return result.data;
  }
  return result;
}

