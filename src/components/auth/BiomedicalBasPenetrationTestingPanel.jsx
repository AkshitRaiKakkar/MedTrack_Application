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
  Crosshair,
  Flame,
  Bug
} from "lucide-react";
import {
  getPenetrationTestingInventory,
  launchPenetrationTestCampaign,
  runExploitValidation,
  getPenetrationTestingStandards
} from "../../services/BiomedicalBasPenetrationTestingService";
import "../../pages/auth/auth.css";

/**
 * BiomedicalBasPenetrationTestingPanel Component
 * 
 * Biomedical Continuous Automated Penetration Testing & Breach Simulation (BAS) Console.
 * Features:
 * 1. MITRE ATT&CK for Healthcare TTP Mapping & Exploit Vector Inventory
 * 2. Automated Exploit Payload Validation & Defense Verification Sandbox
 * 3. NIST SP 800-115 & OWASP Automated PenTest Standards
 * 4. BAS Campaign Provisioning & Exploit Testing Modal
 */
export default function BiomedicalBasPenetrationTestingPanel() {
  // State
  const [simulations, setSimulations] = useState([]);
  const [standards, setStandards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("SIMULATIONS"); // "SIMULATIONS" | "SANDBOX" | "STANDARDS"

  // Sandbox State
  const [selectedSimId, setSelectedSimId] = useState("BAS-SIM-601");
  const [exploitResult, setExploitResult] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [vectorName, setVectorName] = useState("");

  // Load telemetry
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [simList, stdList] = await Promise.all([
        getPenetrationTestingInventory().catch(() => []),
        getPenetrationTestingStandards().catch(() => [])
      ]);

      setSimulations(simList);
      setStandards(stdList);
    } catch (err) {
      console.error("Failed to load biomedical BAS penetration testing data:", err);
      setMessage({ type: "error", text: "Failed connecting to BAS Penetration Testing service." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Run Exploit Validation
  const handleRunExploit = async (e) => {
    e?.preventDefault();
    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const result = await runExploitValidation(selectedSimId);
      setExploitResult(result);
      setMessage({ type: "success", text: `Automated PenTest payload executed in ${result.executionLatencyMs}ms! Attack blocked by ${result.defenseMechanism}.` });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "Exploit validation execution failed." });
    } finally {
      setActionLoading(false);
    }
  };

  // Launch Campaign
  const handleLaunchCampaign = async (e) => {
    e.preventDefault();
    if (!vectorName.trim()) return;

    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const newSim = await launchPenetrationTestCampaign({ vectorName: vectorName.trim() });

      setVectorName("");
      setIsModalOpen(false);
      setMessage({ type: "success", text: `Penetration Testing Simulation ${newSim.simulationId} launched successfully!` });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "Failed to launch penetration testing campaign." });
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const totalSimulations = simulations.length;
    const defendedCount = simulations.filter((s) => s.simulationStatus.includes("DEFENDED")).length;
    const criticalVectors = simulations.filter((s) => s.attackPathSeverity === "CRITICAL" || s.attackPathSeverity === "HIGH").length;

    return { totalSimulations, defendedCount, criticalVectors };
  }, [simulations]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* 1. Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-slate-100">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-red-400 bg-red-500/10 border border-red-500/20 rounded-full flex items-center gap-1.5 font-mono">
                <Target size={12} /> BREACH & ATTACK SIMULATION (BAS)
              </span>
              <span className="px-3 py-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1 font-mono">
                <ShieldCheck size={12} /> MITRE ATT&CK FOR HEALTHCARE
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Biomedical BAS & Automated Penetration Testing
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Continuous automated penetration testing, MITRE ATT&CK healthcare TTP simulation, FHIR/PACS vulnerability probes, zero-day exploit validation, and defense verification.
            </p>
          </div>

          {/* Telemetry Widget */}
          <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl w-full lg:w-auto text-xs space-y-2">
            <div className="flex items-center justify-between gap-6 font-mono">
              <span className="text-slate-400 font-sans font-bold uppercase text-[10px]">BAS Simulation Telemetry</span>
              <span className="text-red-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                BAS ENGINE ACTIVE
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-700/80 font-mono text-[11px]">
              <div>Exploit Vectors: <strong className="text-white">{metrics.totalSimulations} Simulated</strong></div>
              <div>Defended State: <strong className="text-emerald-400">{metrics.defendedCount} Blocked</strong></div>
              <div>High Severity: <strong className="text-amber-400">{metrics.criticalVectors} Targeted</strong></div>
              <div>Defense Efficacy: <strong className="text-emerald-400">99.4% (eBPF WAF)</strong></div>
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
            onClick={() => setActiveTab("SIMULATIONS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "SIMULATIONS"
                ? "bg-red-600 text-white font-black shadow-lg shadow-red-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Target size={15} /> Attack Simulations ({simulations.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("SANDBOX")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "SANDBOX"
                ? "bg-red-600 text-white font-black shadow-lg shadow-red-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Crosshair size={15} /> Exploit Payload Sandbox
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
            <ShieldCheck size={15} /> MITRE ATT&CK & NIST Standards ({standards.length})
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-red-600/20"
        >
          <PlusCircle size={15} /> Launch Penetration Test Campaign
        </button>
      </div>

      {/* 3. SIMULATIONS TAB */}
      {activeTab === "SIMULATIONS" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">Automated Breach Simulations & MITRE TTPs</h3>
              <p className="text-xs text-slate-400 font-mono">Threat vectors, MITRE technique IDs, simulation defense status, and targeted biomedical components</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3">Simulation ID</th>
                  <th className="p-3">Vector Name & MITRE Technique</th>
                  <th className="p-3">Target Component</th>
                  <th className="p-3">Severity</th>
                  <th className="p-3">Simulation Status</th>
                  <th className="p-3 text-right">Remediation SLA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {simulations.map((s, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/60">
                    <td className="p-3 font-bold text-red-400">{s.simulationId}</td>
                    <td className="p-3 font-sans">
                      <div className="font-semibold text-white">{s.vectorName}</div>
                      <div className="text-[10px] text-red-300 font-mono">{s.mitreTechniqueId}</div>
                    </td>
                    <td className="p-3 text-slate-300 font-sans text-[11px]">{s.targetComponent}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          s.attackPathSeverity === "CRITICAL"
                            ? "bg-red-500/20 text-red-400 border border-red-500/30"
                            : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        {s.attackPathSeverity}
                      </span>
                    </td>
                    <td className="p-3 font-sans">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          s.simulationStatus.includes("DEFENDED")
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        {s.simulationStatus}
                      </span>
                    </td>
                    <td className="p-3 text-right font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        {s.remediationSlaDays === 0 ? "RESOLVED" : `${s.remediationSlaDays} DAYS`}
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
                <Crosshair size={18} className="text-red-400" /> Exploit Payload Execution & Defense Verification
              </h3>
            </div>

            <form onSubmit={handleRunExploit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Target Attack Simulation Vector:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-sans"
                  value={selectedSimId}
                  onChange={(e) => setSelectedSimId(e.target.value)}
                >
                  {simulations.map((s) => (
                    <option key={s.simulationId} value={s.simulationId}>
                      {s.simulationId} - {s.vectorName}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-lg shadow-red-600/20"
              >
                <Crosshair size={16} /> Execute Exploit Payload & Validate Security Enforcer
              </button>
            </form>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-400" /> Defense Verification Output
              </h3>
            </div>

            {exploitResult ? (
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-sans font-bold uppercase">Blocking Mechanism:</span>
                  <div className="text-sm font-bold text-emerald-400">{exploitResult.defenseMechanism}</div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px] p-3 bg-slate-950/60 rounded-xl border border-slate-800 font-sans">
                  <div>Attack Path State: <strong className="text-emerald-400 font-mono text-[10px]">BLOCKED AT STEP 2</strong></div>
                  <div>Execution Speed: <strong className="text-emerald-400">{exploitResult.executionLatencyMs} ms</strong></div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-2xl">
                Click "Execute Exploit Payload & Validate Security Enforcer" to trigger breach simulation.
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
              <h3 className="text-base font-bold text-white">MITRE ATT&CK & NIST PenTesting Standards</h3>
              <p className="text-xs text-slate-400 font-mono">Frameworks for automated vulnerability scanning, exploit validation, and security testing</p>
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

      {/* 6. PROVISION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full text-slate-100 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Target size={18} className="text-red-400" /> Launch Penetration Test Campaign
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleLaunchCampaign} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Threat Vector Name / Target:</label>
                <input
                  type="text"
                  placeholder="e.g. Genomic Vault Side-Channel Leakage Test"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-sans"
                  value={vectorName}
                  onChange={(e) => setVectorName(e.target.value)}
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
                  Start BAS Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
