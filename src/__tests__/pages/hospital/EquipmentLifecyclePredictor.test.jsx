import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { renderWithProviders } from "../../utils/renderWithProviders";
import EquipmentLifecyclePredictor from "../../../pages/hospital/EquipmentLifecyclePredictor";

describe("EquipmentLifecyclePredictor Component", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("renders header and main KPI cards", () => {
    renderWithProviders(<EquipmentLifecyclePredictor onNavigate={() => {}} />);
    
    expect(screen.getByText("Equipment Lifecycle & Replacement Risk Predictor")).toBeInTheDocument();
    expect(screen.getByText("Total Fleet Capital Value")).toBeInTheDocument();
    expect(screen.getByText("Critical EOL Risk Count")).toBeInTheDocument();
    expect(screen.getByText("3-Year Capital Replacement")).toBeInTheDocument();
    expect(screen.getByText("Avg Fleet Risk Score")).toBeInTheDocument();
  });

  it("filters fleet items by search input", () => {
    renderWithProviders(<EquipmentLifecyclePredictor onNavigate={() => {}} />);

    const searchInput = screen.getByPlaceholderText(/Search by equipment name/i);
    fireEvent.change(searchInput, { target: { value: "Siemens Somatom" } });

    expect(screen.getByText("Siemens Somatom CT Scanner 64")).toBeInTheDocument();
    expect(screen.queryByText("GE Signa Pioneer MRI 3.0T")).not.toBeInTheDocument();
  });

  it("filters fleet items by risk level status buttons", () => {
    renderWithProviders(<EquipmentLifecyclePredictor onNavigate={() => {}} />);

    const criticalBtn = screen.getByText("Critical EOL Risk");
    fireEvent.click(criticalBtn);

    expect(screen.getByText("Siemens Somatom CT Scanner 64")).toBeInTheDocument();
    expect(screen.queryByText("Philips Azurion Cardiac Cath Lab")).not.toBeInTheDocument();
  });

  it("opens asset modal when Inspect EOL button is clicked", () => {
    renderWithProviders(<EquipmentLifecyclePredictor onNavigate={() => {}} />);

    const inspectButtons = screen.getAllByText(/Inspect EOL/i);
    fireEvent.click(inspectButtons[0]);

    expect(screen.getByText("Siemens Somatom CT Scanner 64")).toBeInTheDocument();
    expect(screen.getByText("Queue Capital Request")).toBeInTheDocument();
  });
});
