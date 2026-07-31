import { screen } from "@testing-library/react";
import { it, expect, vi, beforeEach } from "vitest";
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

// Page components are registered as `lazy(() => import(...))` so each one ships as its own chunk
// rather than being pulled into the main bundle. That makes the first render a Suspense fallback and
// the real page a microtask later, so these assertions use the async `findBy*` queries; the
// synchronous `getBy*` form would only ever see the loader. UnauthorizedPage is the exception - it
// is declared inline in AppRoutes rather than lazily imported - so it is asserted synchronously.

it("redirects to LoginPage when no user", async () => {
  renderWithProviders(
    <AppRouter currentPage="dashboard" onNavigate={() => {}} />,
    { authValue: { user: null } }
  );
  expect(await screen.findByText("Welcome back!")).toBeInTheDocument();
});

it("renders Dashboard component when hospital user is authenticated", async () => {
  renderWithProviders(
    <AppRouter currentPage="dashboard" onNavigate={() => {}} />,
    { authValue: { user: { id: "u1", role: "hospital", name: "Hospital Admin" } } }
  );
  expect(await screen.findAllByText(/MedTrack/i)).not.toHaveLength(0);
});

it("renders landing page without authentication", async () => {
  renderWithProviders(
    <AppRouter currentPage="landing" onNavigate={() => {}} />,
    { authValue: { user: null } }
  );
  expect(await screen.findAllByText(/MedTrack/i)).not.toHaveLength(0);
});

it("shows UnauthorizedPage when technician tries to access hospital route", () => {
  renderWithProviders(
    <AppRouter currentPage="add-equipment" onNavigate={() => {}} />,
    { authValue: { user: { id: "u1", role: "technician", name: "Tech" } } }
  );
  expect(screen.getByText("Access Denied")).toBeInTheDocument();
});

it("shows 404 page for unknown routes", async () => {
  renderWithProviders(
    <AppRouter currentPage="non-existent-route" onNavigate={() => {}} />,
    { authValue: { user: null } }
  );
  expect(await screen.findByText("404")).toBeInTheDocument();
});

it("shows NotFoundPage as default fallback", async () => {
  renderWithProviders(
    <AppRouter currentPage="some-unknown-page" onNavigate={() => {}} />,
    { authValue: { user: { id: "u1", role: "hospital" } } }
  );
  expect(await screen.findByText("404")).toBeInTheDocument();
});
