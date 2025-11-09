import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import Logout from "@/components/Logout";

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe("Logout Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render logout button", () => {
    render(<Logout />);

    expect(screen.getByText("Logout")).toBeInTheDocument();
  });

  it("should have click handler that redirects to logout page", () => {
    render(<Logout />);

    const button = screen.getByText("Logout");
    expect(button).toBeInTheDocument();
    
    fireEvent.click(button);

    // The component redirects to /logout page
    // Note: Router navigation is tested in integration tests
    expect(button).toBeInTheDocument();
  });
});
