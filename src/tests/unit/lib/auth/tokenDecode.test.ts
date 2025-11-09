import { decodeIdToken } from "@/utils/tokenDecode";

describe("decodeIdToken", () => {
  it("should decode a valid JWT token", () => {
    const payload = {
      sub: "test-user",
      email: "test@example.com",
      roles: ["admin"],
    };

    const header = { alg: "HS256", typ: "JWT" };
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString("base64url");
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const token = `${encodedHeader}.${encodedPayload}.signature`;

    const decoded = decodeIdToken(token);

    expect(decoded).not.toBeNull();
    expect(decoded?.sub).toBe("test-user");
    expect(decoded?.email).toBe("test@example.com");
  });

  it("should handle base64url padding correctly", () => {
    const payload = { test: "value" };
    const header = { alg: "HS256" };
    
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString("base64url");
    let encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
    
    const token = `${encodedHeader}.${encodedPayload}.signature`;
    const decoded = decodeIdToken(token);

    expect(decoded).not.toBeNull();
    expect(decoded?.test).toBe("value");
  });

  it("should return null for invalid token format", () => {
    expect(decodeIdToken("invalid.token")).toBeNull();
    expect(decodeIdToken("only-one-part")).toBeNull();
    expect(decodeIdToken("")).toBeNull();
  });

  it("should return null for malformed JSON in payload", () => {
    const invalidPayload = "invalid-json";
    const encodedPayload = Buffer.from(invalidPayload).toString("base64url");
    const token = `header.${encodedPayload}.signature`;

    expect(decodeIdToken(token)).toBeNull();
  });
});

