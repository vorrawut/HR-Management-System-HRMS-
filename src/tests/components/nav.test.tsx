import { describe, it, expect, jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useSession } from "next-auth/react";
import Nav from "@/components/Nav";
import { TestWrapper } from "../utils/testHelpers";

jest.mock("next-auth/react");

describe("Nav Component", () => {
  it("should render login button when not authenticated", () => {
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      status: "unauthenticated",
    });

    render(
      <TestWrapper>
        <Nav />
      </TestWrapper>
    );

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
        roles: ["employee"],
      },
      status: "authenticated",
    });

    render(
      <TestWrapper>
        <Nav />
      </TestWrapper>
    );

    expect(screen.getByText("Logout")).toBeInTheDocument();
    expect(screen.getByText("Test User")).toBeInTheDocument();
    expect(screen.queryByText("Login with Keycloak")).not.toBeInTheDocument();
  });

  it("should show loading state", () => {
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      status: "loading",
    });

    render(
      <TestWrapper>
        <Nav />
      </TestWrapper>
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("should show role-based navigation links when authenticated", () => {
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          name: "Test User",
          email: "test@example.com",
        },
        roles: ["employee"],
      },
      status: "authenticated",
    });

    render(
      <TestWrapper>
        <Nav />
      </TestWrapper>
    );

    expect(screen.getByText("Profile")).toBeInTheDocument();
  });

  it("should show manager links when user has manager role", () => {
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          name: "Manager User",
          email: "manager@example.com",
        },
        roles: ["manager"],
      },
      status: "authenticated",
    });

    render(
      <TestWrapper>
        <Nav />
      </TestWrapper>
    );

    expect(screen.getByText("Approvals")).toBeInTheDocument();
  });

  it("should show admin links when user has admin role", () => {
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          name: "Admin User",
          email: "admin@example.com",
        },
        roles: ["admin"],
      },
      status: "authenticated",
    });

    render(
      <TestWrapper>
        <Nav />
      </TestWrapper>
    );

    expect(screen.getByText("Admin Panel")).toBeInTheDocument();
    expect(screen.getByText("Reports")).toBeInTheDocument();
  });
});

