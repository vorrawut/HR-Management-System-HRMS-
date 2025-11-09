import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { render, screen, fireEvent } from "@testing-library/react";
import Logout from "@/components/Logout";
import { federatedLogout } from "@/utils/federatedLogout";

jest.mock("next-auth/react");
jest.mock("@/utils/federatedLogout");

// Mock fetch globally
global.fetch = jest.fn();

describe("Logout Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({ accessToken: "mock-token" }),
    });
  });

  it("should render logout button", () => {
    render(<Logout />);

    expect(screen.getByText("Logout")).toBeInTheDocument();
  });

  it("should call federatedLogout when clicked", async () => {
    (federatedLogout as jest.Mock).mockResolvedValue(undefined);

    render(<Logout />);

    const button = screen.getByText("Logout");
    fireEvent.click(button);

    // Wait for async operations
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(federatedLogout).toHaveBeenCalled();
  });
});

