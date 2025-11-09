import { describe, it, expect, jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import { useSession } from "next-auth/react";
import Nav from "@/components/Nav";

jest.mock("next-auth/react");

describe("Nav Component", () => {
  it("should render login button when not authenticated", () => {
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      status: "unauthenticated",
    });

    render(<Nav />);

    expect(screen.getByText("Login with Keycloak")).toBeInTheDocument();
    expect(screen.queryByText("Logout")).not.toBeInTheDocument();
  });

  it("should render logout button and username when authenticated", () => {
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          name: "Test User",
          email: "test@example.com",
        },
      },
      status: "authenticated",
    });

    render(<Nav />);

    expect(screen.getByText("Logout")).toBeInTheDocument();
    expect(screen.getByText("Test User")).toBeInTheDocument();
    expect(screen.queryByText("Login with Keycloak")).not.toBeInTheDocument();
  });

  it("should show loading state", () => {
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      status: "loading",
    });

    render(<Nav />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("should show secured page link when authenticated", () => {
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          name: "Test User",
          email: "test@example.com",
        },
      },
      status: "authenticated",
    });

    render(<Nav />);

    expect(screen.getByText("Secured Page")).toBeInTheDocument();
  });
});

