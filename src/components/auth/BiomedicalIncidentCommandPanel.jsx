import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Siren,
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
  Database,
  Key,
  UserCheck,
  Activity,
  Smartphone,
  Globe,
  SlidersHorizontal,
  Zap,
  Check,
  Radio,
  Flame,
  Power
} from "lucide-react";
import {
  getResilienceIncidents,
  triggerFailoverCommand,
  runAirgapRestorationSimulation,
  getResilienceStandards
} from "../../services/BiomedicalIncidentCommandService";
import "../../pages/auth/auth.css";

/**
 * BiomedicalIncidentCommandPanel Component
 * 
 * Biomedical Incident Command & Cyber Resilience Console.
 * Features:
 * 1. NIST SP 800-160 Vol 2 Cyber Resiliency Engineering & ISO 22301 Business Continuity
 * 2. Sub-15s Automated Air-Gapped Disaster Recovery (DR) Failover
 * 3. WORM (Write-Once-Read-Many) Immutable Backup Restoration
 * 4. Air-Gapped Restoration Simulator Sandbox & Failover Trigger Modal
 */
export default function BiomedicalIncidentCommandPanel() {
  // State
  const [incidents, setIncidents] = useState([]);
  const [standards, setStandards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("INCIDENTS"); // "INCIDENTS" | "FAILOVER" | "STANDARDS"

  // Sandbox State
  const [selectedIncidentId, setSelectedIncidentId] = useState("IC-RES-1101");
  const [restoreResult, setRestoreResult] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [incidentName, setIncidentName] = useState("");

  // Load telemetry
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [incList, stdList] = await Promise.all([
        getResilienceIncidents().catch(() => []),
        getResilienceStandards().catch(() => [])
      ]);

      setIncidents(incList);
      setStandards(stdList);
    } catch (err) {
      console.error("Failed to load biomedical incident command data:", err);
      setMessage({ type: "error", text: "Failed connecting to Incident Command Cyber Resilience service." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Run Airgap Sim
  const handleRunAirgapSim = async (e) => {
    e?.preventDefault();
    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const result = await runAirgapRestorationSimulation(selectedIncidentId);
      setRestoreResult(result);
      setMessage({ type: "success", text: `Air-Gapped Vault snapshot restored in ${result.restorationLatencyMs}ms! Hospital operations: ONLINE` });
    } catch (err) {
      setMessage({ type: "error", text: "Air-gapped restoration simulation failed." });
    } finally {
      setActionLoading(false);
    }
  };

  // Trigger Failover
  const handleTriggerFailover = async (e) => {
    e.preventDefault();
    if (!incidentName.trim()) return;

    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const newInc = await triggerFailoverCommand({ incidentName: incidentName.trim() });

      setIncidentName("");
      setIsModalOpen(false);
      setMessage({ type: "success", text: `Air-Gapped DR Failover ${newInc.incidentId} executed successfully!` });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "Failed to trigger failover command." });
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const totalIncidents = incidents.length;
    const airgappedIsolated = incidents.filter((i) => i.resilienceVerdict.includes("AIRGAPPED")).length;
    const zeroDataLoss = incidents.filter((i) => i.rpoDataLossWindow.includes("0 Seconds")).length;

    return { totalIncidents, airgappedIsolated, zeroDataLoss };
  }, [incidents]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* 1. Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-slate-100">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-red-400 bg-red-500/10 border border-red-500/20 rounded-full flex items-center gap-1.5 font-mono">
                <Siren size={12} /> INCIDENT COMMAND & CYBER RESILIENCE
              </span>
              <span className="px-3 py-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1 font-mono">
                <ShieldCheck size={12} /> NIST 800-160 & ISO 22301
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Biomedical Cyber Resilience & Emergency Air-Gap Command
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              NIST SP 800-160 Vol 2 cyber resiliency engineering, sub-15s emergency air-gapped disaster recovery failover, WORM immutable backup snapshots, and HIPAA emergency mode operations.
            </p>
          </div>

          {/* Telemetry Widget */}
          <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl w-full lg:w-auto text-xs space-y-2">
            <div className="flex items-center justify-between gap-6 font-mono">
              <span className="text-slate-400 font-sans font-bold uppercase text-[10px]">Resilience Telemetry</span>
              <span className="text-red-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                COMMAND ACTIVE
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-700/80 font-mono text-[11px]">
              <div>Active Events: <strong className="text-white">{metrics.totalIncidents} Recorded</strong></div>
              <div>Air-Gapped Isolated: <strong className="text-emerald-400">{metrics.airgappedIsolated} Nodes</strong></div>
              <div>Zero RPO Loss: <strong className="text-emerald-400">{metrics.zeroDataLoss} Events</strong></div>
              <div>Failover Latency: <strong className="text-emerald-400">SUB-15 SECONDS</strong></div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        {message.text && (
          <div
            className={`mt-6 p-4 rounded-xl text-sm font-medium flex items-center justify-between border ${
              message.type === "error"
                ? "bg-red-500/10 border-red-500/30 text-red-400"
                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
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
            onClick={() => setActiveTab("INCIDENTS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "INCIDENTS"
                ? "bg-red-600 text-white font-black shadow-lg shadow-red-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Siren size={15} /> Cyber Resilience Events ({incidents.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("FAILOVER")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "FAILOVER"
                ? "bg-red-600 text-white font-black shadow-lg shadow-red-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Zap size={15} /> Air-Gapped Failover Sandbox
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("STANDARDS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "STANDARDS"
                ? "bg-red-600 text-white font-black shadow-lg shadow-red-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <ShieldCheck size={15} /> NIST 800-160 & ISO 22301 ({standards.length})
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-red-600/20"
        >
          <Power size={15} /> Trigger Air-Gapped DR Failover
        </button>
      </div>

      {/* 3. INCIDENTS TAB */}
      {activeTab === "INCIDENTS" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">Incident Command & Air-Gapped Failover Events</h3>
              <p className="text-xs text-slate-400 font-mono">Threat severity, failover targets, RTO/RPO SLA windows, and resilience verdicts</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3">Incident ID</th>
                  <th className="p-3">Event Name & Severity</th>
                  <th className="p-3">Air-Gapped Failover Target</th>
                  <th className="p-3">RTO Target & Latency</th>
                  <th className="p-3">RPO Data Loss Window</th>
                  <th className="p-3 text-right">Verdict</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {incidents.map((i, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/60">
                    <td className="p-3 font-bold text-red-400">{i.incidentId}</td>
                    <td className="p-3 font-sans">
                      <div className="font-semibold text-white">{i.incidentName}</div>
                      <div className="text-[10px] text-red-300 font-mono">{i.threatSeverity}</div>
                    </td>
                    <td className="p-3 text-slate-400 font-mono text-[10px]">{i.failoverTarget}</td>
                    <td className="p-3 font-bold text-emerald-400 font-mono text-[10px]">{i.recoveryTimeObjective}</td>
                    <td className="p-3 font-bold text-emerald-400 font-mono text-[10px]">{i.rpoDataLossWindow}</td>
                    <td className="p-3 text-right font-sans">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          i.resilienceVerdict.includes("AIRGAPPED") || i.resilienceVerdict.includes("PASSED")
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-red-500/20 text-red-400 border border-red-500/30"
                        }`}
                      >
                        {i.resilienceVerdict}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. FAILOVER TAB */}
      {activeTab === "FAILOVER" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Power size={18} className="text-red-400" /> Emergency Air-Gapped Failover Sandbox
              </h3>
            </div>

            <form onSubmit={handleRunAirgapSim} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Target Incident Event:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-sans"
                  value={selectedIncidentId}
                  onChange={(e) => setSelectedIncidentId(e.target.value)}
                >
                  {incidents.map((i) => (
                    <option key={i.incidentId} value={i.incidentId}>
                      {i.incidentId} - {i.incidentName}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-lg shadow-red-600/20"
              >
                <Power size={16} /> Execute Air-Gapped WORM Vault Snapshot Restoration
              </button>
            </form>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-400" /> Air-Gapped Restoration Output
              </h3>
            </div>

            {restoreResult ? (
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-sans font-bold uppercase">Decrypted Snapshot Hash:</span>
                  <div className="text-[10px] text-red-300 break-all">{restoreResult.decryptedSnapshotHash}</div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px] p-3 bg-slate-950/60 rounded-xl border border-slate-800 font-sans">
                  <div>Restoration Latency: <strong className="text-emerald-400">{restoreResult.restorationLatencyMs} ms</strong></div>
                  <div>Hospital Operations: <strong className="text-emerald-400">ONLINE (100%)</strong></div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-2xl">
                Click "Execute Air-Gapped WORM Vault Snapshot Restoration" to verify emergency zero-data-loss failover.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. STANDARDS TAB */}
      {activeTab === "STANDARDS" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">NIST SP 800-160 & ISO 22301 Resilience Standards</h3>
              <p className="text-xs text-slate-400 font-mono">Frameworks for cyber resiliency engineering, air-gapped backups, and business continuity</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {standards.map((s, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded font-bold">
                    {s.standard}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white">{s.standard}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{s.detail}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. FAILOVER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full text-slate-100 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Power size={18} className="text-red-400" /> Trigger Air-Gapped DR Failover
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleTriggerFailover} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Incident / Disruption Description:</label>
                <input
                  type="text"
                  placeholder="e.g. Emergency Ransomware Containment Failover"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-sans"
                  value={incidentName}
                  onChange={(e) => setIncidentName(e.target.value)}
                  required
                />
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
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition shadow-lg shadow-red-600/20"
                >
                  Trigger Emergency Failover
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
