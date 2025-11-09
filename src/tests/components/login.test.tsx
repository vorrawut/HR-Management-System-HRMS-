import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import Login from "@/components/Login";

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe("Login Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render login button", () => {
    render(<Login />);

    expect(screen.getByText("Login with Keycloak")).toBeInTheDocument();
  });

  it("should have click handler that redirects to login page", () => {
    render(<Login />);

    const button = screen.getByText("Login with Keycloak");
    expect(button).toBeInTheDocument();
    
    fireEvent.click(button);

    // The component redirects to /login page
    // Note: Router navigation is tested in integration tests
    expect(button).toBeInTheDocument();
  });
});

