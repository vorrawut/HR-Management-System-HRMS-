import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { signOut } from "next-auth/react";
import { federatedLogout } from "@/utils/federatedLogout";

jest.mock("next-auth/react");

// Mock fetch globally
global.fetch = jest.fn();

describe("federatedLogout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call signOut on error", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

    await federatedLogout();

    expect(signOut).toHaveBeenCalledWith({
      callbackUrl: "/",
      redirect: true,
    });
  });

  it("should call federated logout endpoint when session exists", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        json: async () => ({ accessToken: "mock-token" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

    await federatedLogout();

    expect(global.fetch).toHaveBeenCalledWith("/api/auth/session");
    expect(signOut).toHaveBeenCalled();
  });
});

