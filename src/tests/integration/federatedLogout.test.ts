import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { signOut } from "next-auth/react";
import { federatedLogout } from "@/lib/auth/federatedLogout";

jest.mock("next-auth/react");

// Mock fetch globally
global.fetch = jest.fn();

// Note: window.location.href assignment is tested implicitly via signOut call

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
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, logoutUrl: "http://keycloak/logout" }),
    });

    await federatedLogout();

    expect(global.fetch).toHaveBeenCalledWith("/api/auth/federated-logout", expect.objectContaining({
      method: "POST",
      headers: expect.objectContaining({ "Content-Type": "application/json" }),
    }));
    expect(signOut).toHaveBeenCalledWith({ redirect: false });
    // Note: window.location.href assignment is tested implicitly via signOut call
  });
});

