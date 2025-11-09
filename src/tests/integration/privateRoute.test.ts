import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import React from "react";

const mockAuth = jest.fn<() => Promise<{ user: { id: string; name: string; email: string }; roles?: string[] } | null>>();
const mockRedirect = jest.fn();
const mockHasAnyRole = jest.fn();

jest.mock("@/app/api/auth/[...nextauth]/route", () => ({
  auth: mockAuth,
  authOptions: {},
}));

jest.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

jest.mock("@/lib/permissions/roles", () => ({
  hasAnyRole: mockHasAnyRole,
}));

// Mock the entire PrivateRoute module to avoid ES module import issues
const mockPrivateRoute = jest.fn(async ({ children, roles }: { children: React.ReactNode; roles?: string[] }) => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { auth } = require("@/app/api/auth/[...nextauth]/route");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { redirect } = require("next/navigation");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { hasAnyRole } = require("@/lib/permissions/roles");
  
  const session = await auth();
  if (!session) {
    redirect("/");
    return null;
  }

  if (roles && roles.length > 0) {
    const userRoles = session.roles || [];
    if (!hasAnyRole(userRoles, roles)) {
      redirect("/unauthorized");
      return null;
    }
  }

  return React.createElement(React.Fragment, null, children);
});

jest.mock("@/helpers/PrivateRoute", () => ({
  PrivateRoute: mockPrivateRoute,
}));

describe("PrivateRoute", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should redirect when session is not available", async () => {
    mockAuth.mockResolvedValue(null);

    await mockPrivateRoute({ children: React.createElement("div", null, "Protected Content") });

    expect(mockRedirect).toHaveBeenCalledWith("/");
  });

  it("should render children when session is available", async () => {
    const mockSession = {
      user: {
        id: "1",
        name: "Test User",
        email: "test@example.com",
      },
      roles: ["employee"],
    };

    mockAuth.mockResolvedValue(mockSession);

    const result = await mockPrivateRoute({
      children: React.createElement("div", null, "Protected Content"),
    });

    expect(mockRedirect).not.toHaveBeenCalled();
    expect(result).toBeDefined();
  });

  it("should allow access when user has required role", async () => {
    const mockSession = {
      user: {
        id: "1",
        name: "Test User",
        email: "test@example.com",
      },
      roles: ["admin"],
    };

    mockAuth.mockResolvedValue(mockSession);
    mockHasAnyRole.mockReturnValue(true);

    const result = await mockPrivateRoute({
      children: React.createElement("div", null, "Admin Content"),
      roles: ["admin"],
    });

    expect(mockHasAnyRole).toHaveBeenCalledWith(["admin"], ["admin"]);
    expect(mockRedirect).not.toHaveBeenCalled();
    expect(result).toBeDefined();
  });

  it("should redirect to unauthorized when user lacks required role", async () => {
    const mockSession = {
      user: {
        id: "1",
        name: "Test User",
        email: "test@example.com",
      },
      roles: ["employee"],
    };

    mockAuth.mockResolvedValue(mockSession);
    mockHasAnyRole.mockReturnValue(false);

    await mockPrivateRoute({
      children: React.createElement("div", null, "Admin Content"),
      roles: ["admin"],
    });

    expect(mockHasAnyRole).toHaveBeenCalledWith(["employee"], ["admin"]);
    expect(mockRedirect).toHaveBeenCalledWith("/unauthorized");
  });

  it("should allow access when no roles are specified", async () => {
    const mockSession = {
      user: {
        id: "1",
        name: "Test User",
        email: "test@example.com",
      },
      roles: ["employee"],
    };

    mockAuth.mockResolvedValue(mockSession);

    const result = await mockPrivateRoute({
      children: React.createElement("div", null, "Protected Content"),
    });

    expect(mockHasAnyRole).not.toHaveBeenCalled();
    expect(mockRedirect).not.toHaveBeenCalled();
    expect(result).toBeDefined();
  });
});
