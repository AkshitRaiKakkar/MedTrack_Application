import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders } from "../../utils/renderWithProviders";
import EquipmentCalibrationHub from "../../../pages/hospital/EquipmentCalibrationHub";

describe("EquipmentCalibrationHub Component", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("renders the main heading and metrics grid", () => {
    renderWithProviders(<EquipmentCalibrationHub onNavigate={() => {}} />);
    
    expect(screen.getByText("Equipment Calibration & Compliance Hub")).toBeInTheDocument();
    expect(screen.getByText("Total Tracked Assets")).toBeInTheDocument();
    expect(screen.getByText("Overall Compliance Rate")).toBeInTheDocument();
    expect(screen.getByText("Expiring in 30 Days")).toBeInTheDocument();
    expect(screen.getByText("Overdue / Non-Compliant")).toBeInTheDocument();
  });

  it("filters records based on search query", () => {
    renderWithProviders(<EquipmentCalibrationHub onNavigate={() => {}} />);

    const searchInput = screen.getByPlaceholderText(/Search by equipment name/i);
    fireEvent.change(searchInput, { target: { value: "CT Scanner" } });

    expect(screen.getByText("GE Revolution CT Scanner")).toBeInTheDocument();
    expect(screen.queryByText("Medtronic PB980 Ventilator")).not.toBeInTheDocument();
  });

  it("filters records by status button clicks", () => {
    renderWithProviders(<EquipmentCalibrationHub onNavigate={() => {}} />);

    const expiringButton = screen.getByRole("button", { name: /^Expiring Soon$/i });
    fireEvent.click(expiringButton);

    expect(screen.getByText("Philips IntelliVue Patient Monitor")).toBeInTheDocument();
    expect(screen.queryByText("GE Revolution CT Scanner")).not.toBeInTheDocument();
  });

  it("opens modal and allows registering a new calibration test", async () => {
    renderWithProviders(<EquipmentCalibrationHub onNavigate={() => {}} />);

    const recordButton = screen.getByText("Record Calibration Test");
    fireEvent.click(recordButton);

    expect(screen.getByText("Record New Calibration Test")).toBeInTheDocument();

    const nameInput = screen.getByPlaceholderText(/e.g. Alaris Infusion Pump 8100/i);
    const refInput = screen.getByPlaceholderText(/e.g. 100.0/i);
    const measuredInput = screen.getByPlaceholderText(/e.g. 100.12/i);

    fireEvent.change(nameInput, { target: { value: "Test Defibrillator X" } });
    fireEvent.change(refInput, { target: { value: "100" } });
    fireEvent.change(measuredInput, { target: { value: "100.1" } });

    const submitBtn = screen.getByText("Calculate & Register");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Test Defibrillator X")).toBeInTheDocument();
    });
  });
});
