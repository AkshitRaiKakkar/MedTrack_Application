import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ShieldAlert,
  Zap,
  Play,
  CheckCircle2,
  AlertTriangle,
  Search,
  Download,
  Terminal,
  Clock,
  Sparkles,
  Sliders,
  X,
  FileCode,
  Layers,
  Database,
  Activity,
  Server,
  Lock,
  RefreshCw,
  Eye
} from "lucide-react";
import {
  getIncidentPlaybooks,
  getActiveIrIncidents,
  executePlaybook,
  exportForensicPackage
} from "../../services/IncidentResponsePlaybookService";
import "../../pages/auth/auth.css";

/**
 * IncidentResponsePlaybookPanel Component
 * 
 * Cyber Incident Response (IR) Playbook & Forensics Command Center.
 * Features:
 * 1. Automated Incident Response Playbook Orchestration Engine
 * 2. Active Threat Containment & Remediation Stream Monitor
 * 3. Interactive Step-by-Step Playbook Execution Runner
 * 4. Forensic Memory Dump & Post-Incident Artifact Exporter
 */
export default function IncidentResponsePlaybookPanel() {
  // State
  const [playbooks, setPlaybooks] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("PLAYBOOKS"); // "PLAYBOOKS" | "INCIDENTS"
  const [searchTerm, setSearchTerm] = useState("");
  const [notification, setNotification] = useState({ type: "", message: "" });

  // Execution Runner Modal State
  const [runModalPlaybook, setRunModalPlaybook] = useState(null);
  const [targetEntityInput, setTargetEntityInput] = useState("");
  const [executionResult, setExecutionResult] = useState(null);

  // Load Telemetry
  const loadIrData = useCallback(async () => {
    setLoading(true);
    try {
      const [playbooksData, incidentsData] = await Promise.all([
        getIncidentPlaybooks(),
        getActiveIrIncidents()
      ]);
      setPlaybooks(playbooksData || []);
      setIncidents(incidentsData || []);
    } catch (err) {
      console.error("Failed loading IR playbooks:", err);
      setNotification({ type: "error", message: "Failed connecting to Cyber IR service." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadIrData();
  }, [loadIrData]);

  // Metrics
  const metrics = useMemo(() => {
    const totalPlaybooks = playbooks.length;
    const activeRemediations = incidents.filter((i) => i.status === "EXECUTING").length;
    const containedIncidents = incidents.filter((i) => i.status === "CONTAINED").length;
    return { totalPlaybooks, activeRemediations, containedIncidents };
  }, [playbooks, incidents]);

  // Filtered Playbooks
  const filteredPlaybooks = useMemo(() => {
    return playbooks.filter(
      (pb) =>
        pb.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pb.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pb.triggerCondition.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [playbooks, searchTerm]);

  // Execute Playbook Handler
  const handleRunPlaybook = async () => {
    if (!runModalPlaybook || !targetEntityInput.trim()) return;
    setActionLoading(true);
    try {
      const res = await executePlaybook(runModalPlaybook.id, targetEntityInput);
      setExecutionResult(res);
      setNotification({
        type: "success",
        message: `Playbook "${runModalPlaybook.name}" executed successfully against ${targetEntityInput}.`
      });
    } catch (err) {
      setNotification({ type: "error", message: "Failed executing IR playbook." });
    } finally {
      setActionLoading(false);
    }
  };

  // Export Forensic ZIP Package
  const handleExportForensics = async (incidentId) => {
    setActionLoading(true);
    try {
      const res = await exportForensicPackage(incidentId);
      setNotification({
        type: "success",
        message: `Forensic Package exported (${res.sha256.slice(0, 18)}...)`
      });
    } catch (err) {
      setNotification({ type: "error", message: "Failed exporting forensic package." });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* 1. Header Banner & Diagnostics */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-slate-100">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-red-400 bg-red-500/10 border border-red-500/20 rounded-full flex items-center gap-1.5 font-mono">
                <ShieldAlert size={12} /> AUTOMATED IR PLAYBOOKS
              </span>
              <span className="px-3 py-1 text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center gap-1">
                <Zap size={12} /> INSTANT CONTAINMENT
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Incident Response & Forensics Engine
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Automated cyber threat containment runbooks, host network isolation, credential revocation, and forensic memory dump ledger collection.
            </p>
          </div>

          {/* Telemetry Widget */}
          <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl w-full lg:w-auto text-xs space-y-2">
            <div className="flex items-center justify-between gap-6 font-mono">
              <span className="text-slate-400 font-sans font-bold uppercase text-[10px]">IR Engine State</span>
              <span className="text-red-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                PLAYBOOKS ACTIVE
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-700/80 font-mono text-[11px]">
              <div>Ready Playbooks: <strong className="text-white">{metrics.totalPlaybooks} Runbooks</strong></div>
              <div>Active Remediations: <strong className="text-amber-400">{metrics.activeRemediations} Running</strong></div>
              <div>Contained Threats: <strong className="text-emerald-400">{metrics.containedIncidents} Contained</strong></div>
              <div>Execution Mode: <strong className="text-purple-300">AUTOMATED</strong></div>
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
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("PLAYBOOKS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "PLAYBOOKS"
                ? "bg-red-600 text-white font-black shadow-lg shadow-red-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Zap size={15} /> Playbook Library ({playbooks.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("INCIDENTS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "INCIDENTS"
                ? "bg-red-600 text-white font-black shadow-lg shadow-red-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Activity size={15} /> Active Containments ({incidents.length})
          </button>
        </div>
      </div>

      {/* 3. PLAYBOOKS TAB */}
      {activeTab === "PLAYBOOKS" && (
        <div className="space-y-4">
          <div className="relative w-full sm:w-80">
            <Search size={14} className="absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Search playbook name or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPlaybooks.map((pb) => (
              <div
                key={pb.id}
                className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl hover:border-slate-700 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="px-2.5 py-0.5 text-[10px] bg-slate-800 border border-slate-700 text-red-400 font-mono rounded-full font-bold">
                      {pb.category}
                    </span>
                    <h3 className="text-base font-bold text-white pt-1">{pb.name}</h3>
                  </div>

                  <span className="px-2.5 py-1 text-[10px] font-bold bg-emerald-500/20 text-emerald-400 rounded-full font-mono">
                    {pb.status}
                  </span>
                </div>

                <p className="text-xs text-slate-400 font-mono leading-relaxed">
                  Trigger: <strong className="text-slate-200">{pb.triggerCondition}</strong>
                </p>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-slate-950 p-3 rounded-xl border border-slate-800 text-slate-300">
                  <div>Steps: <strong className="text-white">{pb.totalSteps} Actions</strong></div>
                  <div>Success: <strong className="text-emerald-400">{pb.successRate}</strong></div>
                  <div>Mode: <strong className="text-sky-300">{pb.executionMode}</strong></div>
                  <div>Last Run: <strong className="text-amber-300">{new Date(pb.lastExecutedAt).toLocaleDateString()}</strong></div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setRunModalPlaybook(pb);
                      setTargetEntityInput("");
                      setExecutionResult(null);
                    }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-red-600/20"
                  >
                    <Play size={14} /> Run Playbook
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. INCIDENTS TAB */}
      {activeTab === "INCIDENTS" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">Active Threat Containment Stream</h3>
              <p className="text-xs text-slate-400 font-mono">Live automated remediation steps and forensic evidence extraction</p>
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
                    <span className="px-2 py-0.5 text-[10px] bg-slate-800 text-sky-400 font-bold rounded">
                      {inc.status}
                    </span>
                  </div>

                  <div className="text-slate-300 font-bold">{inc.playbookName}</div>
                  <div className="text-slate-400 font-mono">
                    Target Entity: <strong className="text-purple-300">{inc.targetEntity}</strong> | Progress: <strong className="text-emerald-400">{inc.currentStep}</strong>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleExportForensics(inc.id)}
                  disabled={actionLoading}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 self-end sm:self-auto"
                >
                  <Download size={13} /> Export Forensics
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. RUN PLAYBOOK MODAL */}
      {runModalPlaybook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full text-slate-100 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Zap className="text-red-400" size={20} />
                <h3 className="text-base font-bold text-white">Execute IR Playbook</h3>
              </div>
              <button
                type="button"
                onClick={() => setRunModalPlaybook(null)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Playbook Target (User Email / Host IP):</label>
                <input
                  type="text"
                  placeholder="e.g. suspect_user@medtrack.org or 192.168.1.55"
                  value={targetEntityInput}
                  onChange={(e) => setTargetEntityInput(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              {!executionResult ? (
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setRunModalPlaybook(null)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleRunPlaybook}
                    disabled={!targetEntityInput.trim() || actionLoading}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition flex items-center gap-2"
                  >
                    <Play size={14} /> Execute Runbook
                  </button>
                </div>
              ) : (
                <div className="space-y-2 pt-2">
                  <div className="text-emerald-400 font-bold font-mono">Remediation Executed Successfully!</div>
                  <div className="p-3 bg-slate-950 rounded-xl font-mono text-[10px] text-slate-300 space-y-1 border border-slate-800">
                    {executionResult.executionSteps.map((step, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <CheckCircle2 size={12} className="text-emerald-400" />
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setRunModalPlaybook(null)}
                      className="px-4 py-2 bg-slate-800 text-slate-200 rounded-xl font-bold"
                    >
                      Close Modal
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
