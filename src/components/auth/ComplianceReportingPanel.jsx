import { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Sliders,
  ShieldCheck,
  Hash,
  Layers,
  Database,
  Lock,
  Search
} from "lucide-react";
import {
  getActiveConfig,
  updateConfig,
  generateComplianceReport,
  getAllReportLogs
} from "../../services/ComplianceReportingService";
import "../../pages/auth/auth.css";

export default function ComplianceReportingPanel() {
  const [config, setConfig] = useState(null);
  const [reportLogs, setReportLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Config Form State
  const [defaultFramework, setDefaultFramework] = useState("SOC2_TYPE_2");
  const [exportFormat, setExportFormat] = useState("PDF");
  const [includeAuditLogs, setIncludeAuditLogs] = useState(true);
  const [includeTelemetryMetrics, setIncludeTelemetryMetrics] = useState(true);
  const [retentionPeriodDays, setRetentionPeriodDays] = useState(365);

  // Generate Report Form State
  const [reportTitle, setReportTitle] = useState("");
  const [selectedFramework, setSelectedFramework] = useState("SOC2_TYPE_2");
  const [selectedFormat, setSelectedFormat] = useState("PDF");

  const loadReportingData = useCallback(async () => {
    setLoading(true);
    try {
      const [conf, logs] = await Promise.all([
        getActiveConfig().catch(() => null),
        getAllReportLogs().catch(() => [])
      ]);

      if (conf) {
        setConfig(conf);
        setDefaultFramework(conf.defaultFramework || "SOC2_TYPE_2");
        setExportFormat(conf.exportFormat || "PDF");
        setIncludeAuditLogs(conf.includeAuditLogs);
        setIncludeTelemetryMetrics(conf.includeTelemetryMetrics);
        setRetentionPeriodDays(conf.retentionPeriodDays || 365);
      }

      setReportLogs(logs);
    } catch (err) {
      console.error("Failed to load compliance reporting data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReportingData();
  }, [loadReportingData]);

  const handleUpdateConfig = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const updated = await updateConfig({
        configName: "MASTER_REPORT_CONFIG",
        defaultFramework,
        exportFormat,
        includeAuditLogs,
        includeTelemetryMetrics,
        retentionPeriodDays: Number(retentionPeriodDays)
      });

      setConfig(updated);
      setMessage({ type: "success", text: "Compliance Report Configuration saved!" });
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to save configuration." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateReport = async (e) => {
    e.preventDefault();
    if (!reportTitle.trim()) return;

    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const generated = await generateComplianceReport({
        reportTitle: reportTitle.trim(),
        framework: selectedFramework,
        exportFormat: selectedFormat
      });

      setReportTitle("");
      setMessage({
        type: "success",
        text: `Compliance Report ${generated.reportId} generated cleanly! Checksum: ${generated.sha256Checksum.substring(0, 16)}...`
      });
      await loadReportingData();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to generate report export." });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="authority-panel-wrapper">
      {/* Header Card */}
      <header className="authority-header-card">
        <div className="authority-header-main">
          <div className="authority-icon-badge bg-blue-500/20 text-blue-400">
            <FileCheck size={28} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="authority-title">Executive Compliance Reporting & Audit Export Subsystem</h2>
              <span className="authority-ver-badge bg-blue-500/20 text-blue-300">
                AUDIT ENGINE: CERTIFIED ({reportLogs.length} EXPORTS)
              </span>
            </div>
            <p className="authority-subtitle">
              Automated SOC2 Type II, HIPAA, and ISO 27001 audit bundle export engine with cryptographic SHA-256 evidence hashes
            </p>
          </div>
        </div>

        <div className="authority-header-actions">
          <button
            type="button"
            className="authority-btn authority-btn-secondary"
            onClick={loadReportingData}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Sync Logs
          </button>
        </div>
      </header>

      {/* Message Alert */}
      {message.text && (
        <div className={`authority-alert ${message.type === "error" ? "authority-alert-error" : "authority-alert-success"}`}>
          {message.type === "error" ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
          <span>{message.text}</span>
          <button type="button" className="ml-auto text-xs opacity-70 hover:opacity-100" onClick={() => setMessage({ type: "", text: "" })}>
            Dismiss
          </button>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Generate Report & Config */}
        <div className="space-y-6 lg:col-span-1">
          {/* Generate Report Card */}
          <div className="authority-card">
            <div className="card-header justify-between">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-blue-400" />
                <h3>Generate Certified Audit Report</h3>
              </div>
            </div>

            <form onSubmit={handleGenerateReport} className="card-body space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Report Title / Bundle Name:</label>
                <input
                  type="text"
                  placeholder="e.g. Q3 2026 SOC2 Audit Evidence"
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Target Framework:</label>
                  <select
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    value={selectedFramework}
                    onChange={(e) => setSelectedFramework(e.target.value)}
                  >
                    <option value="SOC2_TYPE_2">SOC 2 TYPE II</option>
                    <option value="HIPAA_SECURITY">HIPAA SECURITY</option>
                    <option value="ISO_27001">ISO 27001 ISMS</option>
                    <option value="GDPR_PRIVACY">GDPR PRIVACY</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Export Format:</label>
                  <select
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    value={selectedFormat}
                    onChange={(e) => setSelectedFormat(e.target.value)}
                  >
                    <option value="PDF">PDF BUNDLE</option>
                    <option value="CSV">CSV ARCHIVE</option>
                    <option value="JSON">JSON MATRIX</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="authority-btn authority-btn-primary w-full text-xs mt-2"
                disabled={actionLoading}
              >
                Generate Certified Audit Export
              </button>
            </form>
          </div>

          {/* Report Config Settings Card */}
          <div className="authority-card">
            <div className="card-header justify-between">
              <div className="flex items-center gap-2">
                <Sliders size={18} className="text-blue-400" />
                <h3>Template & Retention Rules</h3>
              </div>
            </div>

            <form onSubmit={handleUpdateConfig} className="card-body space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Default Framework:</label>
                  <select
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    value={defaultFramework}
                    onChange={(e) => setDefaultFramework(e.target.value)}
                  >
                    <option value="SOC2_TYPE_2">SOC 2 TYPE II</option>
                    <option value="HIPAA_SECURITY">HIPAA SECURITY</option>
                    <option value="ISO_27001">ISO 27001</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Default Format:</label>
                  <select
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value)}
                  >
                    <option value="PDF">PDF</option>
                    <option value="CSV">CSV</option>
                    <option value="JSON">JSON</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Retention Period (Days):</label>
                <input
                  type="number"
                  min="30"
                  max="3650"
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  value={retentionPeriodDays}
                  onChange={(e) => setRetentionPeriodDays(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2 pt-1">
                <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 cursor-pointer">
                  <span className="text-slate-300 font-semibold">Include Immutable Audit Logs</span>
                  <input
                    type="checkbox"
                    className="rounded text-blue-500 focus:ring-blue-500 h-4 w-4"
                    checked={includeAuditLogs}
                    onChange={(e) => setIncludeAuditLogs(e.target.checked)}
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 cursor-pointer">
                  <span className="text-slate-300 font-semibold">Include Telemetry Streams</span>
                  <input
                    type="checkbox"
                    className="rounded text-blue-500 focus:ring-blue-500 h-4 w-4"
                    checked={includeTelemetryMetrics}
                    onChange={(e) => setIncludeTelemetryMetrics(e.target.checked)}
                  />
                </label>
              </div>

              <button
                type="submit"
                className="authority-btn authority-btn-secondary w-full text-xs mt-2"
                disabled={actionLoading}
              >
                Save Template Rules
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Historical Audit Report Exports */}
        <div className="authority-card lg:col-span-2 space-y-4">
          <div className="card-header justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-400" />
              <h3>Generated Compliance Report History ({reportLogs.length})</h3>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-700/50 bg-slate-800/30">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3">Report ID</th>
                  <th className="p-3">Title & Framework</th>
                  <th className="p-3">Records</th>
                  <th className="p-3">SHA-256 Hash</th>
                  <th className="p-3 text-right">Download</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {reportLogs.map((r, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/50">
                    <td className="p-3 font-bold text-blue-300">{r.reportId}</td>
                    <td className="p-3 font-sans">
                      <div className="font-semibold text-white">{r.reportTitle}</div>
                      <div className="text-[10px] text-blue-400 font-mono">{r.framework} • {r.exportFormat}</div>
                    </td>
                    <td className="p-3 font-bold text-emerald-400">{r.recordCount.toLocaleString()} items</td>
                    <td className="p-3 text-[10px] text-slate-400 truncate max-w-[140px]" title={r.sha256Checksum}>
                      {r.sha256Checksum ? r.sha256Checksum.substring(0, 14) + "..." : "N/A"}
                    </td>
                    <td className="p-3 text-right font-sans">
                      <a
                        href={r.downloadUri}
                        onClick={(e) => e.preventDefault()}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-[10px] font-bold shadow transition"
                      >
                        <Download size={12} /> {r.exportFormat}
                      </a>
                    </td>
                  </tr>
                ))}
                {reportLogs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-500 font-sans">
                      No compliance report export bundles generated yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
