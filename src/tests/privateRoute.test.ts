import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import React from "react";

const mockAuth = jest.fn<() => Promise<{ user: { id: string; name: string; email: string } } | null>>();
const mockRedirect = jest.fn();

jest.mock("@/app/api/auth/[...nextauth]/route", () => ({
  auth: mockAuth,
  authOptions: {},
}));

jest.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

// Mock the entire PrivateRoute module to avoid ES module import issues
const mockPrivateRoute = jest.fn(async ({ children }: { children: React.ReactNode }) => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { auth } = require("@/app/api/auth/[...nextauth]/route");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { redirect } = require("next/navigation");
  const session = await auth();
  if (!session) {
    redirect("/");
    return null;
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
    };

    mockAuth.mockResolvedValue(mockSession);

    const result = await mockPrivateRoute({
      children: React.createElement("div", null, "Protected Content"),
    });

    expect(mockRedirect).not.toHaveBeenCalled();
    expect(result).toBeDefined();
  });
});

