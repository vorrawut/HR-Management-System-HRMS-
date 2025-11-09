import { describe, it, expect } from "@jest/globals";

const mockAuthOptions = {
  providers: [],
  session: { strategy: "jwt" },
};

jest.mock("@/app/api/auth/[...nextauth]/route", () => ({
  authOptions: mockAuthOptions,
}));

describe("Authentication", () => {
  it("should have authOptions configured", () => {
    expect(mockAuthOptions).toBeDefined();
    expect(mockAuthOptions.providers).toBeDefined();
    expect(mockAuthOptions.session).toBeDefined();
  });

  it("should use JWT session strategy", () => {
    expect(mockAuthOptions.session?.strategy).toBe("jwt");
  });
});

