import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { PrivateRoute } from "@/helpers/PrivateRoute";
import React from "react";

jest.mock("next-auth");
jest.mock("next/navigation");

describe("PrivateRoute", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should redirect when session is not available", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    await PrivateRoute({ children: React.createElement("div", null, "Protected Content") });

    expect(redirect).toHaveBeenCalledWith("/");
  });

  it("should render children when session is available", async () => {
    const mockSession = {
      user: {
        id: "1",
        name: "Test User",
        email: "test@example.com",
      },
    };

    (getServerSession as jest.Mock).mockResolvedValue(mockSession);

    const result = await PrivateRoute({
      children: React.createElement("div", null, "Protected Content"),
    });

    expect(redirect).not.toHaveBeenCalled();
    expect(result).toBeDefined();
  });
});

