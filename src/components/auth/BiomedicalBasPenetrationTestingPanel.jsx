import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Target,
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
  Zap,
  Check,
  ShieldAlert,
  HardDrive,
  Crosshair,
  Radio
} from "lucide-react";
import {
  getBasPenetrationTestingInventory,
  launchBasSimulation,
  auditMitreCoverage,
  getBasPenetrationTestingStandards
} from "../../services/BiomedicalBasPenetrationTestingService";
import "../../pages/auth/auth.css";

/**
 * BiomedicalBasPenetrationTestingPanel Component
 * 
 * Biomedical Automated Breach & Attack Simulation (BAS) Console.
 * Features:
 * 1. MITRE ATT&CK Healthcare Attack Vector Inventory & Threat Resilience Matrix
 * 2. Automated Attack Simulation & MITRE Coverage Audit Sandbox
 * 3. NIST SP 800-115 & MITRE ATT&CK Healthcare Standards
 * 4. BAS Breach Simulation Launch Modal
 */
export default function BiomedicalBasPenetrationTestingPanel() {
  // State
  const [scenarios, setScenarios] = useState([]);
  const [standards, setStandards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("SCENARIOS"); // "SCENARIOS" | "SANDBOX" | "STANDARDS"

  // Sandbox State
  const [selectedScenarioId, setSelectedScenarioId] = useState("BAS-SCEN-2101");
  const [auditResult, setAuditResult] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scenarioName, setScenarioName] = useState("");

  // Load telemetry
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [scList, stdList] = await Promise.all([
        getBasPenetrationTestingInventory().catch(() => []),
        getBasPenetrationTestingStandards().catch(() => [])
      ]);

      setScenarios(scList);
      setStandards(stdList);
    } catch (err) {
      console.error("Failed to load biomedical BAS data:", err);
      setMessage({ type: "error", text: "Failed connecting to BAS service." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Run MITRE Coverage Audit
  const handleAuditCoverage = async (e) => {
    e?.preventDefault();
    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const result = await auditMitreCoverage(selectedScenarioId);
      setAuditResult(result);
      setMessage({ type: "success", text: `MITRE ATT&CK Coverage Audit completed in ${result.auditLatencyMs}ms! Coverage: ${result.mitreCoveragePercent}%. Zero-Trust Defended: ${result.zeroTrustDefendedCount} vectors.` });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "MITRE ATT&CK coverage audit failed." });
    } finally {
      setActionLoading(false);
    }
  };

  // Launch BAS Simulation
  const handleLaunchSimulation = async (e) => {
    e.preventDefault();
    if (!scenarioName.trim()) return;

    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const newSc = await launchBasSimulation({ scenarioName: scenarioName.trim() });

      setScenarioName("");
      setIsModalOpen(false);
      setMessage({ type: "success", text: `BAS Attack Simulation ${newSc.scenarioId} executed! Status: ${newSc.simulationStatus}. Detection Time: ${newSc.detectionTimeSeconds}s.` });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "Failed to launch BAS simulation." });
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const totalScenarios = scenarios.length;
    const blockedCount = scenarios.filter((s) => s.simulationStatus.includes("BLOCKED")).length;
    const avgDetectionSeconds = (scenarios.reduce((acc, curr) => acc + curr.detectionTimeSeconds, 0) / (totalScenarios || 1)).toFixed(1);

    return { totalScenarios, blockedCount, avgDetectionSeconds };
  }, [scenarios]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* 1. Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-slate-100">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center gap-1.5 font-mono">
                <Target size={12} /> AUTOMATED BREACH & ATTACK SIMULATION
              </span>
              <span className="px-3 py-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1 font-mono">
                <ShieldCheck size={12} /> MITRE ATT&CK HEALTHCARE MAPPED
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Biomedical Automated BAS & PenTesting
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Continuous automated penetration testing, MITRE ATT&CK for Healthcare adversary TTP simulation, lateral movement prevention auditing, and NIST SP 800-115 breach resilience assessment.
            </p>
          </div>

          {/* Telemetry Widget */}
          <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl w-full lg:w-auto text-xs space-y-2">
            <div className="flex items-center justify-between gap-6 font-mono">
              <span className="text-slate-400 font-sans font-bold uppercase text-[10px]">BAS Simulation Telemetry</span>
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                100% DEFENDED
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-700/80 font-mono text-[11px]">
              <div>Attack Vectors: <strong className="text-white">{metrics.totalScenarios} Simulated</strong></div>
              <div>Mean Detection: <strong className="text-amber-300">{metrics.avgDetectionSeconds} Seconds</strong></div>
              <div>MITRE Coverage: <strong className="text-emerald-400">96.5% Mapped</strong></div>
              <div>Lateral Block: <strong className="text-emerald-400">100% PREVENTED</strong></div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        {message.text && (
          <div
            className={`mt-6 p-4 rounded-xl text-sm font-medium flex items-center justify-between border ${
              message.type === "error"
                ? "bg-red-500/10 border-red-500/30 text-red-400"
                : "bg-amber-500/10 border-amber-500/30 text-amber-400"
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
            onClick={() => setActiveTab("SCENARIOS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "SCENARIOS"
                ? "bg-amber-600 text-white font-black shadow-lg shadow-amber-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Crosshair size={15} /> Attack Scenarios ({scenarios.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("SANDBOX")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "SANDBOX"
                ? "bg-amber-600 text-white font-black shadow-lg shadow-amber-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Zap size={15} /> MITRE ATT&CK Coverage Audit Sandbox
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("STANDARDS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "STANDARDS"
                ? "bg-amber-600 text-white font-black shadow-lg shadow-amber-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <ShieldCheck size={15} /> NIST SP 800-115 & MITRE ({standards.length})
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-amber-600/20"
        >
          <Target size={15} /> Launch BAS Attack Simulation
        </button>
      </div>

      {/* 3. SCENARIOS TAB */}
      {activeTab === "SCENARIOS" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">Automated Attack Scenarios & MITRE TTP Vectors</h3>
              <p className="text-xs text-slate-400 font-mono">Scenario IDs, MITRE technique IDs, target subsystems, severity levels, and detection response times</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3">Scenario ID</th>
                  <th className="p-3">Scenario Name & Target Subsystem</th>
                  <th className="p-3">MITRE Technique ID</th>
                  <th className="p-3">Detection Speed</th>
                  <th className="p-3 text-right">Simulation Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {scenarios.map((s, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/60">
                    <td className="p-3 font-bold text-amber-400">{s.scenarioId}</td>
                    <td className="p-3 font-sans">
                      <div className="font-semibold text-white">{s.scenarioName}</div>
                      <div className="text-[10px] text-amber-300 font-mono">{s.targetSubsystem}</div>
                    </td>
                    <td className="p-3 text-slate-400 font-mono text-[10px]">{s.mitreTechniqueId}</td>
                    <td className="p-3 text-amber-300 font-mono text-[10px]">{s.detectionTimeSeconds}s Detection</td>
                    <td className="p-3 text-right font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {s.simulationStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. SANDBOX TAB */}
      {activeTab === "SANDBOX" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Zap size={18} className="text-amber-400" /> MITRE ATT&CK Healthcare Coverage Auditor
              </h3>
            </div>

            <form onSubmit={handleAuditCoverage} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Target Attack Scenario:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-sans"
                  value={selectedScenarioId}
                  onChange={(e) => setSelectedScenarioId(e.target.value)}
                >
                  {scenarios.map((s) => (
                    <option key={s.scenarioId} value={s.scenarioId}>
                      {s.scenarioId} - {s.scenarioName}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-lg shadow-amber-600/20"
              >
                <Zap size={16} /> Execute MITRE Coverage Audit
              </button>
            </form>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-400" /> Audit Output
              </h3>
            </div>

            {auditResult ? (
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-sans font-bold uppercase">Resilience Score:</span>
                  <div className="text-sm font-bold text-emerald-400">{auditResult.resilienceScore}</div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px] p-3 bg-slate-950/60 rounded-xl border border-slate-800 font-sans">
                  <div>MITRE Coverage: <strong className="text-emerald-400 font-mono text-[10px]">{auditResult.mitreCoveragePercent}%</strong></div>
                  <div>Zero-Trust Defended: <strong className="text-emerald-400">{auditResult.zeroTrustDefendedCount} Vectors</strong></div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-2xl">
                Click "Execute MITRE Coverage Audit" to inspect adversary resilience.
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
              <h3 className="text-base font-bold text-white">NIST SP 800-115 & MITRE ATT&CK Standards</h3>
              <p className="text-xs text-slate-400 font-mono">Frameworks for automated attack simulation, penetration testing execution standards, and healthcare TTP mapping</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {standards.map((s, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded font-bold">
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

      {/* 6. PROVISION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full text-slate-100 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Target size={18} className="text-amber-400" /> Launch BAS Attack Simulation
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleLaunchSimulation} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Scenario Name / Target Vector:</label>
                <input
                  type="text"
                  placeholder="e.g. Pharmacy Dispensing System SQLi Probe"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-sans"
                  value={scenarioName}
                  onChange={(e) => setScenarioName(e.target.value)}
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
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition shadow-lg shadow-amber-600/20"
                >
                  Execute Simulation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
