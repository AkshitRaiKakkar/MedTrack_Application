import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders } from "../utils/renderWithProviders";
import AppRouter from "../../routes/AppRoutes";

vi.mock("../../services/AuthService", () => ({
  loginUser: vi.fn(),
  getAuthorityVersion: vi.fn(),
  forgotPassword: vi.fn(),
  verifyOtp: vi.fn(),
  resetPassword: vi.fn(),
  incrementAuthorityVersion: vi.fn(),
  bumpGlobalAuthorityVersion: vi.fn(),
  getAuthorityAuditLogs: vi.fn(),
}));

beforeEach(() => {
  sessionStorage.clear();
});

it("redirects to LoginPage when no user", () => {
  renderWithProviders(
    <AppRouter currentPage="dashboard" onNavigate={() => {}} />,
    { authValue: { user: null } }
  );
  expect(screen.getByText("Welcome back!")).toBeInTheDocument();
});

it("renders Dashboard component when hospital user is authenticated", () => {
  renderWithProviders(
    <AppRouter currentPage="dashboard" onNavigate={() => {}} />,
    { authValue: { user: { id: "u1", role: "hospital", name: "Hospital Admin" } } }
  );
  expect(screen.getByText(/MedTrack/i)).toBeInTheDocument();
});

it("renders landing page without authentication", () => {
  renderWithProviders(
    <AppRouter currentPage="landing" onNavigate={() => {}} />,
    { authValue: { user: null } }
  );
  expect(screen.getByText(/MedTrack/i)).toBeInTheDocument();
});

it("shows UnauthorizedPage when technician tries to access hospital route", () => {
  renderWithProviders(
    <AppRouter currentPage="add-equipment" onNavigate={() => {}} />,
    { authValue: { user: { id: "u1", role: "technician", name: "Tech" } } }
  );
  expect(screen.getByText("Access Denied")).toBeInTheDocument();
});

it("shows 404 page for unknown routes", () => {
  renderWithProviders(
    <AppRouter currentPage="non-existent-route" onNavigate={() => {}} />,
    { authValue: { user: null } }
  );
  expect(screen.getByText("404")).toBeInTheDocument();
});

it("shows NotFoundPage as default fallback", () => {
  renderWithProviders(
    <AppRouter currentPage="some-unknown-page" onNavigate={() => {}} />,
    { authValue: { user: { id: "u1", role: "hospital" } } }
  );
  expect(screen.getByText("404")).toBeInTheDocument();
});
