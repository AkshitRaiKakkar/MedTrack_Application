import * as XLSX from "xlsx";

/* =========================================================================
   Bulk equipment import / export helpers.

   The backend (/api/equipment/import) consumes one canonical CSV shape whose
   headers match EquipmentService.EQUIPMENT_CSV_HEADERS. This module is the
   single place that:
     - parses user-uploaded .csv / .xlsx / .xls files into that shape
     - converts the parsed rows back to the canonical CSV for upload
     - exports the currently filtered inventory view as CSV or Excel
   ========================================================================= */

export const IMPORT_HEADERS = [
  "Equipment Code",
  "Name",
  "Model",
  "Serial Number",
  "Department",
  "Category",
  "Status",
  "Purchase Date",
  "Warranty Expiry",
  "Purchase Cost",
  "Useful Life (Years)",
  "Depreciation Method",
  "Warranty Provider",
  "Warranty Contract Number",
  "Warranty Start Date",
  "Warranty Coverage Type",
  "Warranty Terms",
];

export const IMPORT_COLUMN_GUIDANCE = {
  "Equipment Code": "Optional. Stable ID like EQ-001. Omit to auto-generate.",
  Name: "Required. Asset name, e.g. MRI Scanner",
  Model: "Optional. Manufacturer model, e.g. GE Signa HDxt",
  "Serial Number": "Optional, but unique. Duplicates are rejected.",
  Department: "Required. e.g. Radiology, ICU, Emergency",
  Category: "Optional. IMAGING, SURGICAL, MONITORING, LABORATORY, RESPIRATORY or OTHER",
  Status: "Optional. Operational, Maintenance or Retired (default: Operational)",
  "Purchase Date": "Optional. YYYY-MM-DD, e.g. 2025-06-12",
  "Warranty Expiry": "Optional. Coverage end date, YYYY-MM-DD, e.g. 2027-06-12",
  "Purchase Cost": "Optional. Non-negative number, e.g. 250000.00",
  "Useful Life (Years)": "Optional. Positive whole years, e.g. 10",
  "Depreciation Method": "Optional. STRAIGHT_LINE or DECLINING_BALANCE (default: STRAIGHT_LINE)",
  "Warranty Provider": "Optional. Vendor backing the coverage, e.g. Siemens Healthineers",
  "Warranty Contract Number": "Optional. Contract or registration number",
  "Warranty Start Date": "Optional. Coverage start, YYYY-MM-DD",
  "Warranty Coverage Type": "Optional. FULL_PARTS_AND_LABOR, PARTS_ONLY or LABOR_ONLY",
  "Warranty Terms": "Optional. Exclusions and service notes",
};

const canonicalKey = (header) =>
  String(header).toLowerCase().replace(/[^a-z0-9]/g, "");

const CANONICAL_KEYS = new Map(IMPORT_HEADERS.map((h) => [canonicalKey(h), h]));

/** Alias-friendly lookup: "EquipmentCode" -> "Equipment Code", etc. */
const canonicalHeader = (header) => {
  const key = canonicalKey(header);
  if (CANONICAL_KEYS.has(key)) return CANONICAL_KEYS.get(key);
  if (key === "equipmentid") return "Equipment Code";
  if (key === "serialno" || key === "serial") return "Serial Number";
  if (key === "purchasedate" || key === "datepurchased") return "Purchase Date";
  if (key === "warrantyexpiry" || key === "warrantyexpiration" || key === "warranty") {
    return "Warranty Expiry";
  }
  if (key === "purchasecost" || key === "cost" || key === "price") return "Purchase Cost";
  if (key === "usefullife" || key === "usefullifeyears" || key === "life") return "Useful Life (Years)";
  if (key === "depreciationmethod" || key === "method") return "Depreciation Method";
  if (key === "warrantyprovider" || key === "provider") return "Warranty Provider";
  if (key === "warrantycontractnumber" || key === "contractnumber") return "Warranty Contract Number";
  if (key === "warrantystartdate" || key === "coverage start") return "Warranty Start Date";
  if (key === "warrantycoveragetype" || key === "coveragetype") return "Warranty Coverage Type";
  if (key === "warrantyterms" || key === "terms") return "Warranty Terms";
  return null;
};

/**
 * Reads a File as an ArrayBuffer.
 *
 * <p>{@code File.prototype.arrayBuffer} is not available everywhere (older Safari, jsdom), so a
 * FileReader is used when the native method is missing.</p>
 */
const readFileAsArrayBuffer = (file) => {
  if (typeof file.arrayBuffer === "function") {
    return file.arrayBuffer();
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Parses a user-uploaded spreadsheet (CSV, XLSX or XLS) into rows keyed by the
 * canonical import headers. Header names are matched case-insensitively and
 * tolerant of common aliases, so hospital spreadsheets rarely need editing.
 *
 * @param {File} file the uploaded file
 * @returns {Promise<{rows: Object[], unknownHeaders: string[], error: string|null}>}
 */
export const parseImportFile = (file) => {
  const extension = file.name.split(".").pop().toLowerCase();
  const supported = ["csv", "tsv", "xlsx", "xls"];
  if (!supported.includes(extension)) {
    return Promise.resolve({
      rows: [],
      unknownHeaders: [],
      error: "Unsupported file type. Please upload a .csv or .xlsx file.",
    });
  }

  return readFileAsArrayBuffer(file)
    .then((buffer) => {
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      if (!sheet) {
        return { rows: [], unknownHeaders: [], error: "The file contains no worksheet." };
      }

      // header: 1 -> rows as arrays; defval keeps empty cells as "".
      const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
      if (rawRows.length === 0) {
        return { rows: [], unknownHeaders: [], error: "The file contains no data rows." };
      }

      const headers = rawRows[0].map(String);
      const columnIndexes = new Map();
      const unknownHeaders = [];
      headers.forEach((header, index) => {
        const canonical = canonicalHeader(header);
        if (canonical) {
          // Later duplicate headers lose; the first occurrence wins.
          if (!columnIndexes.has(canonical)) columnIndexes.set(canonical, index);
        } else {
          unknownHeaders.push(header);
        }
      });

      const rows = [];
      const dateColumns = new Set(["Purchase Date", "Warranty Expiry"]);
      for (let i = 1; i < rawRows.length; i++) {
        const raw = rawRows[i];
        const row = {};
        let isEmpty = true;
        columnIndexes.forEach((index, canonical) => {
          let value = raw[index] !== undefined && raw[index] !== null ? raw[index] : "";
          if (dateColumns.has(canonical)) {
            value = normalizeDateValue(value);
          } else if (canonical === "Purchase Cost") {
            value = normalizeMoneyValue(value);
          } else {
            value = String(value).trim();
          }
          row[canonical] = value;
          if (value) isEmpty = false;
        });
        if (!isEmpty) rows.push(row);
      }

      return { rows, unknownHeaders, error: null };
    })
    .catch(() => ({
      rows: [],
      unknownHeaders: [],
      error: "Failed to read the file. Make sure it is a valid CSV or Excel file.",
    }));
};

/**
 * Normalises a money cell to a plain decimal string the backend's BigDecimal accepts.
 *
 * <p>Excel frequently formats costs as "$250,000.00". SheetJS hands formatted cells back as
 * locale strings and unformatted cells as numbers; both are converted to a bare number string
 * (e.g. "250000.00") so the import never trips over the currency decoration.</p>
 */
const normalizeMoneyValue = (value) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return "";
    return String(value);
  }
  const text = String(value).trim().replace(/[$,\s]/g, "");
  if (text === "" || text === "-" || text === "−") return "";
  return text;
};

/**
 * Normalises a spreadsheet date cell to the YYYY-MM-DD the backend expects.
 *
 * <p>SheetJS hands dates back as Excel serial numbers (e.g. 46550 for 2027-06-12) when the cell
 * carries a date format, and as locale-formatted strings in other cases. Both are converted to the
 * ISO date the import accepts; anything unrecognisable is passed through untouched so the backend
 * reports a clear per-row error instead of this layer silently guessing.</p>
 */
const normalizeDateValue = (value) => {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "number") {
    // Excel serial dates for 1970..2100 fall in this band. Excel's epoch starts at serial 1
    // (1900-01-01), so an out-of-band number is almost certainly not a date.
    if (value >= 20000 && value <= 80000) {
      const date = XLSX.SSF.parse_date_code(value);
      if (date) {
        return `${date.y}-${String(date.m).padStart(2, "0")}-${String(date.d).padStart(2, "0")}`;
      }
    }
    return "";
  }
  const text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return text;
};

/** Escapes one CSV field per RFC 4180 (quotes, commas, newlines). */
const escapeCsvField = (value) => {
  const text = value === null || value === undefined ? "" : String(value);
  if (/[",\n\r]/.test(text)) {
    return '"' + text.replace(/"/g, '""') + '"';
  }
  return text;
};

/**
 * Serialises parsed rows into the canonical CSV the backend imports.
 * A UTF-8 BOM is prepended so Excel on Windows reads non-ASCII names correctly.
 */
export const rowsToCsv = (rows) => {
  const lines = [IMPORT_HEADERS.map(escapeCsvField).join(",")];
  rows.forEach((row) => {
    lines.push(
      IMPORT_HEADERS.map((header) => escapeCsvField(row[header])).join(",")
    );
  });
  return "\uFEFF" + lines.join("\r\n");
};

/** Triggers a browser download of a Blob. */
const downloadBlob = (blob, filename) => {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

/** Maps an equipment item (as rendered in the list) to canonical export row. */
const equipmentToRow = (item) => ({
  "Equipment Code": item.equipmentCode || item.id,
  Name: item.name || "",
  Model: item.model || "",
  "Serial Number": item.serialNumber || "",
  Department: item.department || "",
  Category: item.category || "",
  Status: item.status || "",
  "Purchase Date": item.purchaseDate || "",
  "Warranty Expiry": item.warrantyExpiry || "",
  "Purchase Cost": item.purchaseCost !== undefined && item.purchaseCost !== null ? String(item.purchaseCost) : "",
  "Useful Life (Years)": item.usefulLifeYears !== undefined && item.usefulLifeYears !== null ? String(item.usefulLifeYears) : "",
  "Depreciation Method": item.depreciationMethod || "",
  "Warranty Provider": item.warrantyProvider || "",
  "Warranty Contract Number": item.warrantyContractNumber || "",
  "Warranty Start Date": item.warrantyStartDate || "",
  "Warranty Coverage Type": item.warrantyCoverageType || "",
  "Warranty Terms": item.warrantyTerms || "",
});

/**
 * Exports the given (already filtered) equipment list as CSV.
 *
 * @param {Array} equipment the filtered inventory view
 * @param {string} filename e.g. "equipment_inventory.csv"
 */
export const exportEquipmentCsv = (equipment, filename) => {
  const csv = rowsToCsv(equipment.map(equipmentToRow));
  downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8;" }), filename);
};

/**
 * Exports the given (already filtered) equipment list as an Excel workbook.
 *
 * @param {Array} equipment the filtered inventory view
 * @param {string} filename e.g. "equipment_inventory.xlsx"
 */
export const exportEquipmentXlsx = (equipment, filename) => {
  const worksheet = XLSX.utils.json_to_sheet(
    equipment.map(equipmentToRow),
    { header: IMPORT_HEADERS }
  );
  worksheet["!cols"] = IMPORT_HEADERS.map(() => ({ wch: 24 }));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Equipment");
  XLSX.writeFile(workbook, filename);
};

/**
 * Generates a blank template for download (CSV or XLSX) with column guidance.
 */
export const buildImportTemplate = (format) => {
  const sample = {
    "Equipment Code": "EQ-001",
    Name: "MRI Scanner",
    Model: "GE Signa HDxt",
    "Serial Number": "SN-9281",
    Department: "Radiology",
    Category: "IMAGING",
    Status: "Operational",
    "Purchase Date": "2025-06-12",
    "Warranty Expiry": "2027-06-12",
    "Purchase Cost": "250000.00",
    "Useful Life (Years)": "10",
    "Depreciation Method": "STRAIGHT_LINE",
    "Warranty Provider": "GE Healthcare",
    "Warranty Contract Number": "WC-2027-001",
    "Warranty Start Date": "2025-06-12",
    "Warranty Coverage Type": "FULL_PARTS_AND_LABOR",
    "Warranty Terms": "Covers parts and labor for 2 years; travel excluded.",
  };

  if (format === "xlsx") {
    const worksheet = XLSX.utils.json_to_sheet([sample], { header: IMPORT_HEADERS });
    worksheet["!cols"] = IMPORT_HEADERS.map(() => ({ wch: 24 }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
    XLSX.writeFile(workbook, "medtrack_equipment_template.xlsx");
    return;
  }

  const csv = rowsToCsv([sample]);
  downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8;" }), "medtrack_equipment_template.csv");
};
