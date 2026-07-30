import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders } from "../../utils/renderWithProviders";
import LoginPage from "../../../pages/auth/LoginPage";

const mockLoginUser = vi.fn();

vi.mock("../../../services/AuthService", () => ({
  loginUser: (...args) => mockLoginUser(...args),
}));

beforeEach(() => {
  sessionStorage.clear();
  mockLoginUser.mockReset();
});

it("renders role selection with three options", () => {
  renderWithProviders(<LoginPage onNavigate={() => {}} />);
  expect(screen.getByText("Welcome back!")).toBeInTheDocument();
  expect(screen.getByDisplayValue("hospital")).toBeInTheDocument();
  expect(screen.getByDisplayValue("technician")).toBeInTheDocument();
  expect(screen.getByDisplayValue("supplier")).toBeInTheDocument();
});

it("pre-fills hospital demo credentials by default", () => {
  renderWithProviders(<LoginPage onNavigate={() => {}} />);
  expect(screen.getByDisplayValue("hospital@medtrack.com")).toBeInTheDocument();
  expect(screen.getByDisplayValue("admin123")).toBeInTheDocument();
});

it("pre-fills technician credentials when role is changed", async () => {
  renderWithProviders(<LoginPage onNavigate={() => {}} />);
  const select = screen.getByDisplayValue("hospital");
  await userEvent.selectOptions(select, "technician");
  expect(screen.getByDisplayValue("tech@medtrack.com")).toBeInTheDocument();
  expect(screen.getByDisplayValue("tech123")).toBeInTheDocument();
});

it("pre-fills supplier credentials when role is changed", async () => {
  renderWithProviders(<LoginPage onNavigate={() => {}} />);
  const select = screen.getByDisplayValue("hospital");
  await userEvent.selectOptions(select, "supplier");
  expect(screen.getByDisplayValue("supplier@medtrack.com")).toBeInTheDocument();
  expect(screen.getByDisplayValue("supplier123")).toBeInTheDocument();
});

it("shows error message on failed login", async () => {
  mockLoginUser.mockRejectedValueOnce({
    response: { data: { message: "Invalid credentials." } },
  });

  const mockNavigate = vi.fn();
  renderWithProviders(<LoginPage onNavigate={mockNavigate} />);

  fireEvent.click(screen.getByRole("button", { name: /login/i }));

  await waitFor(() => {
    expect(screen.getByText("Invalid credentials.")).toBeInTheDocument();
  });
});

it("shows generic error when server is not reachable", async () => {
  mockLoginUser.mockRejectedValueOnce(new Error("Network Error"));

  renderWithProviders(<LoginPage onNavigate={() => {}} />);

  fireEvent.click(screen.getByRole("button", { name: /login/i }));

  await waitFor(() => {
    expect(screen.getByText("Server not responding. Please try again.")).toBeInTheDocument();
  });
});

it("shows Logging in... text while submitting", async () => {
  mockLoginUser.mockImplementationOnce(() => new Promise(() => {}));

  renderWithProviders(<LoginPage onNavigate={() => {}} />);

  fireEvent.click(screen.getByRole("button", { name: /login/i }));

  expect(screen.getByText("Logging in...")).toBeInTheDocument();
});

it("navigates to dashboard for hospital role on successful login", async () => {
  mockLoginUser.mockResolvedValueOnce({
    token: "tok-1",
    user: { id: "u1", name: "Admin", email: "a@b.com", phone: "555", organization: "Org", role: "HOSPITAL" },
  });

  const mockNavigate = vi.fn();
  renderWithProviders(<LoginPage onNavigate={mockNavigate} />);

  fireEvent.click(screen.getByRole("button", { name: /login/i }));

  await waitFor(() => {
    expect(mockNavigate).toHaveBeenCalledWith("dashboard");
  });
});

it("navigates to tasks for technician role", async () => {
  mockLoginUser.mockResolvedValueOnce({
    token: "tok-2",
    user: { id: "u2", name: "Tech", email: "t@b.com", phone: "555", organization: "Org", role: "TECHNICIAN" },
  });

  const mockNavigate = vi.fn();
  renderWithProviders(<LoginPage onNavigate={mockNavigate} />);

  const select = screen.getByDisplayValue("hospital");
  await userEvent.selectOptions(select, "technician");
  fireEvent.click(screen.getByRole("button", { name: /login/i }));

  await waitFor(() => {
    expect(mockNavigate).toHaveBeenCalledWith("tasks");
  });
});

it("navigates to orders for supplier role", async () => {
  mockLoginUser.mockResolvedValueOnce({
    token: "tok-3",
    user: { id: "u3", name: "Supp", email: "s@b.com", phone: "555", organization: "Org", role: "SUPPLIER" },
  });

  const mockNavigate = vi.fn();
  renderWithProviders(<LoginPage onNavigate={mockNavigate} />);

  const select = screen.getByDisplayValue("hospital");
  await userEvent.selectOptions(select, "supplier");
  fireEvent.click(screen.getByRole("button", { name: /login/i }));

  await waitFor(() => {
    expect(mockNavigate).toHaveBeenCalledWith("orders");
  });
});

it("renders Forgot Password link", () => {
  renderWithProviders(<LoginPage onNavigate={() => {}} />);
  expect(screen.getByText("Forgot Password?")).toBeInTheDocument();
});

it("navigates to forgot-password page when link is clicked", async () => {
  const mockNavigate = vi.fn();
  renderWithProviders(<LoginPage onNavigate={mockNavigate} />);

  await userEvent.click(screen.getByText("Forgot Password?"));
  expect(mockNavigate).toHaveBeenCalledWith("forgot-password");
});
