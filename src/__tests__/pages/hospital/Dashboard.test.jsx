import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders } from "../../utils/renderWithProviders";
import Dashboard from "../../../pages/hospital/Dashboard";

const mockGetAllEquipment = vi.fn();
const mockGetAllTasks = vi.fn();

vi.mock("../../../services/EquipmentService", () => ({
  getAllEquipment: (...args) => mockGetAllEquipment(...args),
}));

vi.mock("../../../services/MaintenanceService", () => ({
  getAllTasks: (...args) => mockGetAllTasks(...args),
}));

beforeEach(() => {
  sessionStorage.clear();
  mockGetAllEquipment.mockReset();
  mockGetAllTasks.mockReset();
});

it("shows loading spinner while fetching data", () => {
  mockGetAllEquipment.mockImplementation(() => new Promise(() => {}));
  mockGetAllTasks.mockImplementation(() => new Promise(() => {}));

  const { container } = renderWithProviders(
    <Dashboard onNavigate={() => {}} />,
    { authValue: { user: { id: "real-1", role: "hospital", name: "Admin" } } },
  );

  expect(container.querySelector(".animate-spin")).toBeInTheDocument();
});

it("renders demo data without API calls when user has demo- prefix", async () => {
  renderWithProviders(
    <Dashboard onNavigate={() => {}} />,
    { authValue: { user: { id: "demo-hosp-1", role: "hospital", name: "Admin" } } },
  );

  await waitFor(() => {
    expect(screen.getByText(/MedTrack/i)).toBeInTheDocument();
  });

  expect(mockGetAllEquipment).not.toHaveBeenCalled();
  expect(mockGetAllTasks).not.toHaveBeenCalled();
});

it("calls API endpoints for non-demo users", async () => {
  mockGetAllEquipment.mockResolvedValue([]);
  mockGetAllTasks.mockResolvedValue([]);

  renderWithProviders(
    <Dashboard onNavigate={() => {}} />,
    { authValue: { user: { id: "real-1", role: "hospital", name: "Admin" } } },
  );

  await waitFor(() => {
    expect(mockGetAllEquipment).toHaveBeenCalled();
    expect(mockGetAllTasks).toHaveBeenCalled();
  });
});

it("renders without crashing when API calls fail", async () => {
  mockGetAllEquipment.mockRejectedValue(new Error("API error"));
  mockGetAllTasks.mockRejectedValue(new Error("API error"));

  renderWithProviders(
    <Dashboard onNavigate={() => {}} />,
    { authValue: { user: { id: "real-1", role: "hospital", name: "Admin" } } },
  );

  await waitFor(() => {
    expect(mockGetAllEquipment).toHaveBeenCalled();
  });
});
