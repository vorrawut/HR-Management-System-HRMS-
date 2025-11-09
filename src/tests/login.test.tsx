import { describe, it, expect, jest } from "@jest/globals";
import { render, screen, fireEvent } from "@testing-library/react";
import { signIn } from "next-auth/react";
import Login from "@/components/Login";

jest.mock("next-auth/react");

describe("Login Component", () => {
  it("should render login button", () => {
    render(<Login />);

    expect(screen.getByText("Login with Keycloak")).toBeInTheDocument();
  });

  it("should call signIn with keycloak provider when clicked", () => {
    render(<Login />);

    const button = screen.getByText("Login with Keycloak");
    fireEvent.click(button);

    expect(signIn).toHaveBeenCalledWith("keycloak", { callbackUrl: "/" });
  });
});

