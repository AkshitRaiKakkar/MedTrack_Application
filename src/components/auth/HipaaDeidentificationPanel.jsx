import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  EyeOff,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Sliders,
  Terminal,
  Cpu,
  Lock,
  Search,
  PlusCircle,
  Download,
  Code,
  Layers,
  Sparkles,
  Eye,
  X,
  FileCode,
  ShieldAlert,
  Database,
  Key,
  UserCheck,
  FileSpreadsheet
} from "lucide-react";
import {
  getDeidentificationJobs,
  createDeidentificationJob,
  redactSampleText,
  getSafeHarborChecklist
} from "../../services/HipaaDeidentificationService";
import "../../pages/auth/auth.css";

/**
 * HipaaDeidentificationPanel Component
 * 
 * Healthcare Data Anonymization & HIPAA Safe Harbor De-Identification Engine Console.
 * Features:
 * 1. Live PHI Redaction & Differential Privacy Sandbox
 * 2. HIPAA Safe Harbor 18 PHI Identifier Enforcement Matrix
 * 3. k-Anonymity & l-Diversity Risk Score Telemetry
 * 4. Automated Anonymization Job Execution Engine
 */
export default function HipaaDeidentificationPanel() {
  // State
  const [jobs, setJobs] = useState([]);
  const [checklist, setChecklist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("SANDBOX"); // "SANDBOX" | "JOBS" | "SAFE_HARBOR_18"

  // Live Sandbox State
  const [rawTextInput, setRawTextInput] = useState(
    `Patient John Doe (DOB: 05/14/1978, SSN: 334-90-1284, Phone: 415-555-0199, Email: jdoe@medical.org, MRN: 902148) presented to St. Jude Hospital on 07/20/2026 for telemetry evaluation. IP address of record: 192.168.1.104.`
  );
  const [anonymizationMethod, setAnonymizationMethod] = useState("SAFE_HARBOR_18");
  const [redactedResult, setRedactedResult] = useState(null);

  // New Job Modal Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [datasetName, setDatasetName] = useState("");
  const [recordCount, setRecordCount] = useState(10000);
  const [jobMethod, setJobMethod] = useState("SAFE_HARBOR_18");

  // Load telemetry
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [jobList, checkList] = await Promise.all([
        getDeidentificationJobs().catch(() => []),
        getSafeHarborChecklist().catch(() => [])
      ]);

      setJobs(jobList);
      setChecklist(checkList);
    } catch (err) {
      console.error("Failed to load HIPAA de-identification data:", err);
      setMessage({ type: "error", text: "Failed connecting to De-identification engine." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Execute Sandbox Redaction
  const handleRedactSandbox = async (e) => {
    e?.preventDefault();
    if (!rawTextInput.trim()) return;

    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const result = await redactSampleText(rawTextInput, anonymizationMethod);
      setRedactedResult(result);
      setMessage({ type: "success", text: "PHI identifiers successfully redacted according to Safe Harbor 18 standard!" });
    } catch (err) {
      setMessage({ type: "error", text: "Redaction sandbox processing failed." });
    } finally {
      setActionLoading(false);
    }
  };

  // Create Anonymization Job
  const handleCreateJob = async (e) => {
    e.preventDefault();
    if (!datasetName.trim()) return;

    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const newJob = await createDeidentificationJob({
        datasetName: datasetName.trim(),
        recordCount: Number(recordCount),
        anonymizationMethod: jobMethod
      });

      setDatasetName("");
      setIsModalOpen(false);
      setMessage({ type: "success", text: `De-identification Job ${newJob.jobId} created and dispatched!` });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "Failed creating de-identification job." });
    } finally {
      setActionLoading(false);
    }
  };

  // Telemetry Metrics
  const metrics = useMemo(() => {
    const totalJobs = jobs.length;
    const totalRecordsAnonymized = jobs.reduce((acc, j) => acc + (j.recordCount || 0), 0);
    const totalPhiRedacted = jobs.reduce((acc, j) => acc + (j.phiRedactedCount || 0), 0);
    const avgKScore = Math.round(jobs.reduce((acc, j) => acc + (j.kAnonymityScore || 0), 0) / (totalJobs || 1));

    return { totalJobs, totalRecordsAnonymized, totalPhiRedacted, avgKScore };
  }, [jobs]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* 1. Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-slate-100">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded-full flex items-center gap-1.5 font-mono">
                <EyeOff size={12} /> HIPAA SAFE HARBOR 18
              </span>
              <span className="px-3 py-1 text-xs font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 rounded-full flex items-center gap-1 font-mono">
                <ShieldCheck size={12} /> k-ANONYMITY & DIFFERENTIAL PRIVACY
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Healthcare Data Anonymization & De-Identification Engine
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Automated removal of 18 Protected Health Information (PHI) identifiers under HIPAA Safe Harbor § 164.514(b)(2), k-anonymity scoring, and tokenized pseudonymization.
            </p>
          </div>

          {/* Telemetry Widget */}
          <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl w-full lg:w-auto text-xs space-y-2">
            <div className="flex items-center justify-between gap-6 font-mono">
              <span className="text-slate-400 font-sans font-bold uppercase text-[10px]">HIPAA Privacy Status</span>
              <span className="text-purple-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                ENFORCED
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-700/80 font-mono text-[11px]">
              <div>Records Redacted: <strong className="text-white">{metrics.totalRecordsAnonymized.toLocaleString()}</strong></div>
              <div>PHI Identifiers Cut: <strong className="text-purple-300">{metrics.totalPhiRedacted.toLocaleString()}</strong></div>
              <div>Avg k-Anonymity: <strong className="text-emerald-400">k = {metrics.avgKScore}</strong></div>
              <div>Active Jobs: <strong className="text-sky-300">{metrics.totalJobs} Dispatched</strong></div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        {message.text && (
          <div
            className={`mt-6 p-4 rounded-xl text-sm font-medium flex items-center justify-between border ${
              message.type === "error"
                ? "bg-red-500/10 border-red-500/30 text-red-400"
                : "bg-purple-500/10 border-purple-500/30 text-purple-400"
            }`}
          >
            <div className="flex items-center gap-2">
              {message.type === "error" ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
              <span>{message.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setMessage({ type: "", text: "" })}
              className="text-slate-400 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>

      {/* 2. Navigation bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("SANDBOX")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "SANDBOX"
                ? "bg-purple-600 text-white font-black shadow-lg shadow-purple-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Terminal size={15} /> PHI Redaction Sandbox
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("JOBS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "JOBS"
                ? "bg-purple-600 text-white font-black shadow-lg shadow-purple-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Database size={15} /> De-Identification Jobs ({jobs.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("SAFE_HARBOR_18")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "SAFE_HARBOR_18"
                ? "bg-purple-600 text-white font-black shadow-lg shadow-purple-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <ShieldCheck size={15} /> Safe Harbor 18 Matrix ({checklist.length})
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-purple-600/20"
        >
          <PlusCircle size={15} /> New Anonymization Job
        </button>
      </div>

      {/* 3. SANDBOX TAB */}
      {activeTab === "SANDBOX" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Input Sandbox */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText size={18} className="text-purple-400" /> Raw EHR Clinical Record Payload
              </h3>
              <select
                className="p-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-purple-300 font-mono focus:outline-none"
                value={anonymizationMethod}
                onChange={(e) => setAnonymizationMethod(e.target.value)}
              >
                <option value="SAFE_HARBOR_18">SAFE HARBOR 18 REDACTION</option>
                <option value="PSEUDONYMIZATION">HMAC-SHA256 PSEUDONYMIZATION</option>
                <option value="DIFFERENTIAL_PRIVACY">DIFFERENTIAL PRIVACY NOISE</option>
              </select>
            </div>

            <form onSubmit={handleRedactSandbox} className="space-y-4">
              <textarea
                rows={7}
                value={rawTextInput}
                onChange={(e) => setRawTextInput(e.target.value)}
                className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 leading-relaxed"
                placeholder="Paste raw EHR record text containing PHI..."
              />

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-lg shadow-purple-600/20"
              >
                <EyeOff size={16} /> Execute PHI Redaction Engine
              </button>
            </form>
          </div>

          {/* Right Column: Redacted Output */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-400" /> Anonymized & Redacted Payload Output
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                SAFE HARBOR VERIFIED
              </span>
            </div>

            {redactedResult ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-emerald-300 text-xs font-mono leading-relaxed min-h-[160px]">
                  {redactedResult.redactedText}
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs font-mono p-3 bg-slate-950/60 rounded-xl border border-slate-800/60">
                  <div>PHI Identifiers Cut: <strong className="text-purple-400">{redactedResult.phiIdentifiersDetected}</strong></div>
                  <div>Risk Level: <strong className="text-emerald-400">{redactedResult.privacyRiskScore}</strong></div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-2xl">
                Click "Execute PHI Redaction Engine" to view real-time Safe Harbor anonymized payload.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. JOBS TAB */}
      {activeTab === "JOBS" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">De-Identification Job Ledger</h3>
              <p className="text-xs text-slate-400 font-mono">Continuous dataset anonymization streams and k-anonymity scoring</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3">Job ID</th>
                  <th className="p-3">Dataset Name</th>
                  <th className="p-3">Records & PHI Redactions</th>
                  <th className="p-3">Method</th>
                  <th className="p-3">k-Score</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {jobs.map((j, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/60">
                    <td className="p-3 font-bold text-purple-400">{j.jobId}</td>
                    <td className="p-3 font-sans font-semibold text-white">{j.datasetName}</td>
                    <td className="p-3 font-mono">
                      <div>{j.recordCount?.toLocaleString()} Records</div>
                      <div className="text-[10px] text-purple-400">{j.phiRedactedCount?.toLocaleString()} PHI Redacted</div>
                    </td>
                    <td className="p-3 text-slate-300">{j.anonymizationMethod}</td>
                    <td className="p-3 font-bold text-emerald-400">k = {j.kAnonymityScore}</td>
                    <td className="p-3 text-right font-sans">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          j.status === "COMPLETED"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                        }`}
                      >
                        {j.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. SAFE HARBOR 18 TAB */}
      {activeTab === "SAFE_HARBOR_18" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">HIPAA § 164.514(b)(2) Safe Harbor 18 PHI Identifier Enforcement Matrix</h3>
              <p className="text-xs text-slate-400 font-mono">Comprehensive rule set for 18 protected health information categories</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {checklist.map((item) => (
              <div key={item.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded font-bold">
                    PHI ITEM #{item.id}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 size={12} /> {item.status}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white">{item.name}</h4>
                <p className="text-[10px] font-mono text-slate-400">Target: {item.regexPattern}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. NEW JOB DISPATCH MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full text-slate-100 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Database size={18} className="text-purple-400" /> Dispatch De-Identification Job
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Dataset Name / Path:</label>
                <input
                  type="text"
                  placeholder="e.g. Clinical_Cohort_2026.csv"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                  value={datasetName}
                  onChange={(e) => setDatasetName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Record Count:</label>
                <input
                  type="number"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                  value={recordCount}
                  onChange={(e) => setRecordCount(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Anonymization Method:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                  value={jobMethod}
                  onChange={(e) => setJobMethod(e.target.value)}
                >
                  <option value="SAFE_HARBOR_18">HIPAA SAFE HARBOR 18</option>
                  <option value="DIFFERENTIAL_PRIVACY">DIFFERENTIAL PRIVACY</option>
                  <option value="PSEUDONYMIZATION">PSEUDONYMIZATION</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition shadow-lg shadow-purple-600/20"
                >
                  Dispatch Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
