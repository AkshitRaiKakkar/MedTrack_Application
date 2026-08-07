import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
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

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }) => <div data-testid="chart">{children}</div>,
  BarChart: ({ children }) => <div>{children}</div>,
  CartesianGrid: () => null,
  Tooltip: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Bar: () => null,
}));

describe("Dashboard equipment watchlist", () => {
  beforeEach(() => {
    mockGetAllEquipment.mockReset();
    mockGetAllTasks.mockReset();
  });

  it("renders equipment and maintenance sections from paginated API payloads", async () => {
    mockGetAllEquipment.mockResolvedValue({
      content: [
        {
          id: "EQ-100",
          equipmentCode: "EQ-100",
          name: "Infusion Pump",
          model: "Sigma 9000",
          department: "ICU",
          category: "INFUSION",
          status: "NEEDS_MAINTENANCE",
          warrantyStatus: "EXPIRING_SOON",
          warrantyExpiry: "2026-09-01",
          lastMaintenanceDate: "2026-07-16",
        },
      ],
    });

    mockGetAllTasks.mockResolvedValue({
      content: [
        {
          id: 7,
          taskCode: "MNT-007",
          description: "Replace pump battery",
          equipment: "Infusion Pump",
          assignedTechnician: "Alex Singh",
          status: "Scheduled",
          deadline: "2026-08-08",
          priority: "High",
        },
      ],
    });

    renderWithProviders(<Dashboard onNavigate={() => {}} />, {
      authValue: { user: { id: "real-1", role: "hospital", name: "Admin" } },
    });

    const watchlistHeading = await screen.findByText("Equipment watchlist");
    const watchlistSection = watchlistHeading.closest("section");

    expect(watchlistSection).not.toBeNull();
    expect(within(watchlistSection).getByText("Infusion Pump")).toBeInTheDocument();
    expect(screen.getByText("Replace pump battery")).toBeInTheDocument();
    expect(within(watchlistSection).getAllByText("Needs Attention").length).toBeGreaterThan(0);
    expect(within(watchlistSection).getByText("Warranty Expiring Soon")).toBeInTheDocument();
  });

  it("filters the equipment watchlist by search query and status chip", async () => {
    const user = userEvent.setup();

    mockGetAllEquipment.mockResolvedValue({
      content: [
        {
          id: "EQ-200",
          equipmentCode: "EQ-200",
          name: "MRI Scanner",
          model: "Voyager 3T",
          department: "Radiology",
          status: "OPERATIONAL",
          warrantyStatus: "ACTIVE",
        },
        {
          id: "EQ-201",
          equipmentCode: "EQ-201",
          name: "Ventilator Pro",
          model: "V680",
          department: "ICU",
          status: "OUT_OF_SERVICE",
          warrantyStatus: "EXPIRED",
        },
      ],
    });

    mockGetAllTasks.mockResolvedValue({ content: [] });

    renderWithProviders(<Dashboard onNavigate={() => {}} />, {
      authValue: { user: { id: "real-1", role: "hospital", name: "Admin" } },
    });

    const watchlistHeading = await screen.findByText("Equipment watchlist");
    const watchlistSection = watchlistHeading.closest("section");
    const searchInput = await screen.findByPlaceholderText("Search by name, code, model, or department");

    await user.type(searchInput, "mri");

    await waitFor(() => {
      expect(within(watchlistSection).getByText("MRI Scanner")).toBeInTheDocument();
      expect(within(watchlistSection).queryByText("Ventilator Pro")).not.toBeInTheDocument();
    });

    await user.clear(searchInput);
    await user.click(screen.getByRole("button", { name: "Needs Attention" }));

    await waitFor(() => {
      expect(within(watchlistSection).getByText("Ventilator Pro")).toBeInTheDocument();
      expect(within(watchlistSection).queryByText("MRI Scanner")).not.toBeInTheDocument();
    });
  });

  it("normalizes paginated maintenance responses instead of calling map on the raw payload", async () => {
    mockGetAllEquipment.mockResolvedValue({ content: [] });
    mockGetAllTasks.mockResolvedValue({
      content: [
        {
          id: 44,
          taskCode: "MNT-044",
          description: "Ventilator airflow recalibration",
          equipment: "Ventilator Pro",
          assignedTechnician: "Nisha Kapoor",
          status: "In Progress",
          deadline: "2026-08-08",
          priority: "Critical",
        },
      ],
    });

    renderWithProviders(<Dashboard onNavigate={() => {}} />, {
      authValue: { user: { id: "real-1", role: "hospital", name: "Admin" } },
    });

    expect(await screen.findByText("Ventilator airflow recalibration")).toBeInTheDocument();
    expect(screen.getByText("In Progress")).toBeInTheDocument();
    expect(screen.getByText("Due tomorrow")).toBeInTheDocument();
  });
});
