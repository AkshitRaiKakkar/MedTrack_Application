import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ShieldAlert,
  Lock,
  Eye,
  EyeOff,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Search,
  Download,
  Terminal,
  Clock,
  Sparkles,
  Zap,
  FileCode,
  Layers,
  Database,
  Filter,
  X,
  Play
} from "lucide-react";
import {
  getDlpRules,
  getDlpIncidents,
  toggleDlpRule,
  simulateTextMasking
} from "../../services/DlpPrivacyGuardService";
import "../../pages/auth/auth.css";

/**
 * DlpPrivacyGuardPanel Component
 * 
 * Data Loss Prevention (DLP) & HIPAA Privacy Guard Command Center.
 * Features:
 * 1. Live PHI/PII Data Redaction & Masking Telemetry Monitor
 * 2. Interactive Real-Time PHI Masking Simulator Sandbox
 * 3. DLP Regex & Heuristic Policy Rule Matrix
 * 4. Exfiltration Incident Stream with Blocked Telemetry Details
 * 5. Forensic Incident Inspector & Audit Export Ledger
 */
export default function DlpPrivacyGuardPanel() {
  // State
  const [rules, setRules] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("RULES"); // "RULES" | "INCIDENTS" | "SIMULATOR"
  const [searchTerm, setSearchTerm] = useState("");
  const [notification, setNotification] = useState({ type: "", message: "" });

  // Simulator State
  const [simInput, setSimInput] = useState("Patient John Doe (MRN-98412034) with SSN 482-19-9012 diagnosed under ICD-10 code E11.9.");
  const [simResult, setSimResult] = useState(null);

  // Modal State
  const [inspectIncident, setInspectIncident] = useState(null);

  // Load DLP Telemetry
  const loadDlpData = useCallback(async () => {
    setLoading(true);
    try {
      const [rulesData, incidentsData] = await Promise.all([
        getDlpRules(),
        getDlpIncidents()
      ]);
      setRules(rulesData || []);
      setIncidents(incidentsData || []);
    } catch (err) {
      console.error("Failed loading DLP telemetry:", err);
      setNotification({ type: "error", message: "Failed loading DLP privacy guard data." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDlpData();
  }, [loadDlpData]);

  // Metrics
  const metrics = useMemo(() => {
    const totalRules = rules.length;
    const activeRules = rules.filter((r) => r.status === "ACTIVE").length;
    const totalRedactions = rules.reduce((acc, curr) => acc + (curr.matchCount || 0), 0);
    const blockedExfiltrations = incidents.filter((i) => i.actionTaken === "BLOCKED_EXFILTRATION").length;
    return { totalRules, activeRules, totalRedactions, blockedExfiltrations };
  }, [rules, incidents]);

  // Filtered Rules
  const filteredRules = useMemo(() => {
    return rules.filter(
      (r) =>
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.dataCategory.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [rules, searchTerm]);

  // Toggle Rule Handler
  const handleToggleRule = async (ruleId, currentStatus) => {
    setActionLoading(true);
    const nextStatus = currentStatus === "ACTIVE" ? "DISABLED" : "ACTIVE";
    try {
      await toggleDlpRule(ruleId, nextStatus);
      setRules((prev) =>
        prev.map((r) => (r.id === ruleId ? { ...r, status: nextStatus } : r))
      );
      setNotification({
        type: "success",
        message: `DLP Policy ${ruleId} updated to ${nextStatus}.`
      });
    } catch (err) {
      setNotification({ type: "error", message: "Failed updating DLP rule status." });
    } finally {
      setActionLoading(false);
    }
  };

  // Run Masking Simulator
  const handleRunSimulator = async () => {
    if (!simInput.trim()) return;
    setActionLoading(true);
    try {
      const res = await simulateTextMasking(simInput);
      setSimResult(res);
    } catch (err) {
      setNotification({ type: "error", message: "Failed running masking simulation." });
    } finally {
      setActionLoading(false);
    }
  };

  // Export Audit Ledger
  const handleExportAudit = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ rules, incidents }, null, 2));
    const dlAnchor = document.createElement("a");
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `MedTrack_DLP_HIPAA_Ledger_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
    setNotification({ type: "success", message: "DLP privacy audit ledger exported successfully." });
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* 1. Header Banner & Diagnostics */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-slate-100">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1.5 font-mono">
                <Lock size={12} /> DLP & PRIVACY GUARD
              </span>
              <span className="px-3 py-1 text-xs font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 rounded-full flex items-center gap-1">
                <ShieldAlert size={12} /> HIPAA SAFE HARBOR
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Data Loss Prevention & PHI Privacy Shield
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Automated Protected Health Information (PHI) detection engine, real-time API response masking, clipboard exfiltration guard, and HIPAA audit tracking.
            </p>
          </div>

          {/* Telemetry Widget */}
          <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl w-full lg:w-auto text-xs space-y-2">
            <div className="flex items-center justify-between gap-6 font-mono">
              <span className="text-slate-400 font-sans font-bold uppercase text-[10px]">DLP Telemetry State</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                ACTIVE MASKING
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-700/80 font-mono text-[11px]">
              <div>Active Rules: <strong className="text-white">{metrics.activeRules}/{metrics.totalRules}</strong></div>
              <div>Redactions: <strong className="text-emerald-400">{metrics.totalRedactions.toLocaleString()}</strong></div>
              <div>Exfiltrations Blocked: <strong className="text-red-400">{metrics.blockedExfiltrations}</strong></div>
              <div>Compliance: <strong className="text-sky-300">100% HIPAA</strong></div>
            </div>
          </div>
        </div>

        {/* Global Notifications */}
        {notification.message && (
          <div
            className={`mt-6 p-4 rounded-xl text-sm font-medium flex items-center justify-between border ${
              notification.type === "error"
                ? "bg-red-500/10 border-red-500/30 text-red-400"
                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === "error" ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
              <span>{notification.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotification({ type: "", message: "" })}
              className="text-slate-400 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>

      {/* 2. Navigation Tabs & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab("RULES")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === "RULES"
                ? "bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Sliders size={15} /> DLP Masking Rules ({rules.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("INCIDENTS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === "INCIDENTS"
                ? "bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <ShieldAlert size={15} /> Exfiltration Incidents ({incidents.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("SIMULATOR")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === "SIMULATOR"
                ? "bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Sparkles size={15} /> PHI Redaction Sandbox
          </button>
        </div>

        <button
          type="button"
          onClick={handleExportAudit}
          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 self-end sm:self-auto"
        >
          <Download size={14} /> Export Audit
        </button>
      </div>

      {/* 3. MASKING RULES TAB */}
      {activeTab === "RULES" && (
        <div className="space-y-4">
          <div className="relative w-full sm:w-80">
            <Search size={14} className="absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Search DLP rules or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-4">DLP Policy Name</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Pattern Spec</th>
                    <th className="p-4">Action</th>
                    <th className="p-4">Redactions Count</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Toggle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {filteredRules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-4 font-bold text-white font-sans">
                        <div>{rule.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{rule.id}</div>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 text-[10px] bg-slate-800 border border-slate-700 rounded text-emerald-400">
                          {rule.dataCategory}
                        </span>
                      </td>
                      <td className="p-4 text-sky-400">{rule.patternType}</td>
                      <td className="p-4 text-purple-300 font-bold">{rule.maskingAction}</td>
                      <td className="p-4 text-slate-200">{rule.matchCount.toLocaleString()}</td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                            rule.status === "ACTIVE" ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-slate-500"
                          }`}
                        >
                          {rule.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleToggleRule(rule.id, rule.status)}
                          disabled={actionLoading}
                          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-[11px] font-sans font-bold transition"
                        >
                          {rule.status === "ACTIVE" ? "Disable" : "Enable"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. INCIDENTS TAB */}
      {activeTab === "INCIDENTS" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">Blocked PHI Exfiltration Incidents</h3>
              <p className="text-xs text-slate-400">Real-time Data Loss Prevention telemetry enforcement stream</p>
            </div>
          </div>

          <div className="space-y-3">
            {incidents.map((inc) => (
              <div
                key={inc.id}
                className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white font-mono text-sm">{inc.id}</span>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                        inc.severity === "CRITICAL" ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"
                      }`}
                    >
                      {inc.severity}
                    </span>
                    <span className="px-2 py-0.5 text-[10px] bg-slate-800 text-emerald-400 font-bold rounded">
                      {inc.actionTaken}
                    </span>
                  </div>

                  <div className="text-slate-400 font-mono">
                    Principal: <strong className="text-slate-200">{inc.principal}</strong> ({inc.sourceIp})
                  </div>
                  <div className="text-slate-400 font-mono">
                    Matched: <strong className="text-sky-300">{inc.dataMatched}</strong> via {inc.channel}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setInspectIncident(inc)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition whitespace-nowrap self-end sm:self-auto"
                >
                  Inspect Incident
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. PHI MASKING SANDBOX SIMULATOR TAB */}
      {activeTab === "SIMULATOR" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="text-emerald-400" size={18} /> PHI / PII Real-Time Redaction Sandbox
            </h3>
            <p className="text-xs text-slate-400">Test client-side and server-side regex & heuristic data redaction logic</p>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Unmasked Input Payload Text:</label>
              <textarea
                rows={3}
                value={simInput}
                onChange={(e) => setSimInput(e.target.value)}
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="button"
              onClick={handleRunSimulator}
              disabled={actionLoading}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-xl text-xs transition flex items-center gap-2"
            >
              <Play size={14} /> Run Redaction Pipeline
            </button>

            {simResult && (
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-slate-400 font-mono text-[11px]">
                  <span>REDACTED HIPAA SAFE HARBOR OUTPUT</span>
                  <span className="text-emerald-400 font-bold">{simResult.detectionsCount} PHI Tokens Redacted</span>
                </div>
                <div className="p-3 bg-slate-900 rounded-xl text-emerald-400 font-mono text-xs leading-relaxed border border-slate-800">
                  {simResult.maskedText}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. INSPECT INCIDENT MODAL */}
      {inspectIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full text-slate-100 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="text-red-400" size={20} />
                <h3 className="text-base font-bold text-white">{inspectIncident.id}</h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectIncident(null)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div>Severity: <strong className="text-red-400">{inspectIncident.severity}</strong></div>
              <div>Principal: <strong className="text-white">{inspectIncident.principal}</strong></div>
              <div>Source IP: <strong className="text-purple-300">{inspectIncident.sourceIp}</strong></div>
              <div>Channel: <strong className="text-sky-400">{inspectIncident.channel}</strong></div>
              <div>Matched: <strong className="text-amber-400">{inspectIncident.dataMatched}</strong></div>
              <div>Enforced Action: <strong className="text-emerald-400">{inspectIncident.actionTaken}</strong></div>

              <div className="flex justify-end pt-2 font-sans">
                <button
                  type="button"
                  onClick={() => setInspectIncident(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs"
                >
                  Close Modal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
