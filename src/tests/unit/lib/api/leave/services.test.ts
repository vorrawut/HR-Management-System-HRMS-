import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import {
  createLeaveRequest,
  getLeaveRequests,
  getLeaveRequest,
  updateLeaveRequest,
  cancelLeaveRequest,
  getPendingLeaveRequests,
  approveLeaveRequest,
  rejectLeaveRequest,
  type LeaveRequest,
} from "@/lib/api/leave/services";
import { API_ROUTES } from "@/lib/routes";

// Mock fetch globally
global.fetch = jest.fn();

describe("Leave Services", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createLeaveRequest", () => {
    it("should create a leave request successfully", async () => {
      const mockLeave: LeaveRequest = {
        id: "123",
        employeeId: "emp-1",
        employeeName: "John Doe",
        employeeEmail: "john@example.com",
        leaveType: "annual",
        reason: "Vacation",
        startDate: "2024-01-01T00:00:00Z",
        endDate: "2024-01-05T00:00:00Z",
        days: 5,
        status: "pending",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockLeave }),
      });

      const result = await createLeaveRequest({
        leaveType: "annual",
        reason: "Vacation",
        startDate: "2024-01-01",
        endDate: "2024-01-05",
      });

      expect(result).toEqual(mockLeave);
      expect(global.fetch).toHaveBeenCalledWith(
        API_ROUTES.LEAVE.BASE,
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
        })
      );
    });

    it("should throw error on failure", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        json: async () => ({ error: "Invalid request" }),
      });

      await expect(
        createLeaveRequest({
          leaveType: "annual",
          reason: "Vacation",
          startDate: "2024-01-01",
          endDate: "2024-01-05",
        })
      ).rejects.toThrow("Invalid request");
    });
  });

  describe("getLeaveRequests", () => {
    it("should fetch all leave requests", async () => {
      const mockLeaves: LeaveRequest[] = [
        {
          id: "123",
          employeeId: "emp-1",
          employeeName: "John Doe",
          employeeEmail: "john@example.com",
          leaveType: "annual",
          reason: "Vacation",
          startDate: "2024-01-01T00:00:00Z",
          endDate: "2024-01-05T00:00:00Z",
          days: 5,
          status: "pending",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockLeaves }),
      });

      const result = await getLeaveRequests();

      expect(result).toEqual(mockLeaves);
      expect(global.fetch).toHaveBeenCalledWith(
        API_ROUTES.LEAVE.LIST,
        expect.objectContaining({
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
        })
      );
    });
  });

  describe("getLeaveRequest", () => {
    it("should fetch a single leave request", async () => {
      const mockLeave: LeaveRequest = {
        id: "123",
        employeeId: "emp-1",
        employeeName: "John Doe",
        employeeEmail: "john@example.com",
        leaveType: "annual",
        reason: "Vacation",
        startDate: "2024-01-01T00:00:00Z",
        endDate: "2024-01-05T00:00:00Z",
        days: 5,
        status: "pending",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockLeave }),
      });

      const result = await getLeaveRequest("123");

      expect(result).toEqual(mockLeave);
      expect(global.fetch).toHaveBeenCalledWith(
        API_ROUTES.LEAVE.DETAIL("123"),
        expect.objectContaining({
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
        })
      );
    });
  });

  describe("updateLeaveRequest", () => {
    it("should update a leave request", async () => {
      const mockLeave: LeaveRequest = {
        id: "123",
        employeeId: "emp-1",
        employeeName: "John Doe",
        employeeEmail: "john@example.com",
        leaveType: "sick",
        reason: "Updated reason",
        startDate: "2024-01-01T00:00:00Z",
        endDate: "2024-01-05T00:00:00Z",
        days: 5,
        status: "pending",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockLeave }),
      });

      const result = await updateLeaveRequest("123", {
        leaveType: "sick",
        reason: "Updated reason",
      });

      expect(result).toEqual(mockLeave);
      expect(global.fetch).toHaveBeenCalledWith(
        API_ROUTES.LEAVE.DETAIL("123"),
        expect.objectContaining({
          method: "PUT",
        })
      );
    });
  });

  describe("cancelLeaveRequest", () => {
    it("should cancel a leave request", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      await cancelLeaveRequest("123");

      expect(global.fetch).toHaveBeenCalledWith(
        API_ROUTES.LEAVE.DETAIL("123"),
        expect.objectContaining({
          method: "DELETE",
        })
      );
    });
  });

  describe("getPendingLeaveRequests", () => {
    it("should fetch pending leave requests for managers", async () => {
      const mockLeaves: LeaveRequest[] = [
        {
          id: "123",
          employeeId: "emp-1",
          employeeName: "John Doe",
          employeeEmail: "john@example.com",
          leaveType: "annual",
          reason: "Vacation",
          startDate: "2024-01-01T00:00:00Z",
          endDate: "2024-01-05T00:00:00Z",
          days: 5,
          status: "pending",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockLeaves }),
      });

      const result = await getPendingLeaveRequests();

      expect(result).toEqual(mockLeaves);
      expect(global.fetch).toHaveBeenCalledWith(
        API_ROUTES.MANAGER.LEAVE.LIST,
        expect.objectContaining({
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
        })
      );
    });
  });

  describe("approveLeaveRequest", () => {
    it("should approve a leave request", async () => {
      const mockLeave: LeaveRequest = {
        id: "123",
        employeeId: "emp-1",
        employeeName: "John Doe",
        employeeEmail: "john@example.com",
        leaveType: "annual",
        reason: "Vacation",
        startDate: "2024-01-01T00:00:00Z",
        endDate: "2024-01-05T00:00:00Z",
        days: 5,
        status: "approved",
        managerComment: "Approved",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockLeave }),
      });

      const result = await approveLeaveRequest("123", { comment: "Approved" });

      expect(result).toEqual(mockLeave);
      expect(global.fetch).toHaveBeenCalledWith(
        API_ROUTES.MANAGER.LEAVE.APPROVE("123"),
        expect.objectContaining({
          method: "PUT",
        })
      );
    });
  });

  describe("rejectLeaveRequest", () => {
    it("should reject a leave request", async () => {
      const mockLeave: LeaveRequest = {
        id: "123",
        employeeId: "emp-1",
        employeeName: "John Doe",
        employeeEmail: "john@example.com",
        leaveType: "annual",
        reason: "Vacation",
        startDate: "2024-01-01T00:00:00Z",
        endDate: "2024-01-05T00:00:00Z",
        days: 5,
        status: "rejected",
        managerComment: "Not enough leave balance",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockLeave }),
      });

      const result = await rejectLeaveRequest("123", {
        comment: "Not enough leave balance",
      });

      expect(result).toEqual(mockLeave);
      expect(global.fetch).toHaveBeenCalledWith(
        API_ROUTES.MANAGER.LEAVE.REJECT("123"),
        expect.objectContaining({
          method: "PUT",
        })
      );
    });
  });
});

