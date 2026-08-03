import { describe, it, expect, vi } from "vitest";
import {
  IMPORT_HEADERS,
  parseImportFile,
  rowsToCsv,
  exportEquipmentCsv,
  exportEquipmentXlsx,
} from "../../utils/equipmentImportExport";

const csvContent = `Equipment Code,Name,Model,Serial Number,Department,Category,Status,Purchase Date,Warranty Expiry
EQ-001,MRI Scanner,GE Signa,SN-9281,Radiology,IMAGING,Operational,2025-06-12,2027-06-12
,Ventilator,Philips,SN-9922,ICU,RESPIRATORY,Maintenance,2026-01-05,2028-01-05
`;

const makeFile = (name, content, type) =>
  new File([content], name, { type });

describe("parseImportFile", () => {
  it("parses a CSV file into rows keyed by canonical headers", async () => {
    const result = await parseImportFile(makeFile("equipment.csv", csvContent, "text/csv"));

    expect(result.error).toBeNull();
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toEqual({
      "Equipment Code": "EQ-001",
      Name: "MRI Scanner",
      Model: "GE Signa",
      "Serial Number": "SN-9281",
      Department: "Radiology",
      Category: "IMAGING",
      Status: "Operational",
      "Purchase Date": "2025-06-12",
      "Warranty Expiry": "2027-06-12",
    });
    // An omitted equipment code stays empty (backend auto-generates one).
    expect(result.rows[1]["Equipment Code"]).toBe("");
  });

  it("normalises header names case-insensitively", async () => {
    const loose = csvContent
      .replace("Equipment Code", "EquipmentCode")
      .replace("Serial Number", "serial no")
      .replace("Warranty Expiry", "WARRANTY");
    const result = await parseImportFile(makeFile("loose.csv", loose, "text/csv"));

    expect(result.rows[0]["Equipment Code"]).toBe("EQ-001");
    expect(result.rows[0]["Serial Number"]).toBe("SN-9281");
    expect(result.rows[0]["Warranty Expiry"]).toBe("2027-06-12");
    expect(result.unknownHeaders).toHaveLength(0);
  });

  it("flags unrecognised columns instead of dropping the file", async () => {
    const result = await parseImportFile(
      makeFile("weird.csv", "Name,Budget,Department\nMRI Scanner,1000,Radiology\n", "text/csv")
    );

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].Name).toBe("MRI Scanner");
    expect(result.unknownHeaders).toEqual(["Budget"]);
  });

  it("rejects unsupported file types", async () => {
    const result = await parseImportFile(makeFile("data.pdf", "x", "application/pdf"));
    expect(result.error).toContain("Unsupported file type");
    expect(result.rows).toHaveLength(0);
  });

  it("parses an Excel workbook", async () => {
    const XLSX = await import("xlsx");
    const worksheet = XLSX.utils.aoa_to_sheet([
      IMPORT_HEADERS,
      ["EQ-010", "Ultrasound", "Sonosite", "SN-X1", "Cardiology", "IMAGING", "Operational", "2025-01-01", ""],
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
    const result = await parseImportFile(
      new File([buffer], "assets.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
    );

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].Name).toBe("Ultrasound");
    expect(result.rows[0].Department).toBe("Cardiology");
  });
});

describe("rowsToCsv", () => {
  it("emits canonical headers with a UTF-8 BOM and CRLF records", () => {
    const csv = rowsToCsv([
      { Name: 'Ventilator, Portable', Department: "ICU", Status: "Operational" },
    ]);

    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain(IMPORT_HEADERS.join(","));
    expect(csv).toContain('"Ventilator, Portable"');
    expect(csv).toContain("\r\n");
  });
});

describe("exportEquipmentCsv", () => {
  it("downloads a CSV of the supplied (filtered) view", () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const createSpy = vi.fn(() => "blob:url");
    const revokeSpy = vi.fn();
    vi.stubGlobal("URL", { createObjectURL: createSpy, revokeObjectURL: revokeSpy });

    exportEquipmentCsv(
      [{ id: "EQ-1", name: "MRI Scanner", department: "Radiology", status: "Operational" }],
      "equipment_inventory_2026-08-03.csv"
    );

    expect(clickSpy).toHaveBeenCalled();
    expect(createSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
    vi.unstubAllGlobals();
  });
});
