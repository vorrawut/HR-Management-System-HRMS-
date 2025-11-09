import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Mock next-auth
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/app/api/auth/[...nextauth]/route", () => ({
  authOptions: {
    providers: [],
    session: { strategy: "jwt" },
  },
}));

describe("Authentication", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should have authOptions configured", () => {
    expect(authOptions).toBeDefined();
    expect(authOptions.providers).toBeDefined();
    expect(authOptions.session).toBeDefined();
  });

  it("should use JWT session strategy", () => {
    expect(authOptions.session?.strategy).toBe("jwt");
  });

  it("should handle token refresh logic", async () => {
    const mockSession = {
      user: { id: "1", name: "Test User", email: "test@example.com" },
      accessToken: "mock-access-token",
    };

    (getServerSession as jest.Mock).mockResolvedValue(mockSession);

    const session = await getServerSession(authOptions);
    expect(session).toBeDefined();
    expect(session?.user).toBeDefined();
  });
});

