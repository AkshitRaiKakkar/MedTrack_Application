import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Cpu,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Sliders,
  Terminal,
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
  Share2,
  Network,
  Binary
} from "lucide-react";
import {
  getFheMpcTelemetryInventory,
  dispatchFheMpcWorkload,
  evaluateHomomorphicNoise,
  getFheMpcStandards
} from "../../services/BiomedicalFheMpcTelemetryService";
import "../../pages/auth/auth.css";

/**
 * BiomedicalFheMpcTelemetryPanel Component
 * 
 * Biomedical Fully Homomorphic Encryption (FHE) & Multi-Party Computation (MPC) Console.
 * Features:
 * 1. CKKS / BGV Homomorphic Schemes & Shamir Secret Sharing Compute Nodes
 * 2. Homomorphic Noise Budget & Bootstrapping Evaluator Sandbox
 * 3. ISO/IEC 18033-6 & HomomorphicEncryption.org Standards
 * 4. FHE Workload Dispatcher & Compute Session Modal
 */
export default function BiomedicalFheMpcTelemetryPanel() {
  // State
  const [sessions, setSessions] = useState([]);
  const [standards, setStandards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("SESSIONS"); // "SESSIONS" | "SANDBOX" | "STANDARDS"

  // Sandbox State
  const [selectedSessionId, setSelectedSessionId] = useState("FHE-SESSION-1201");
  const [noiseResult, setNoiseResult] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sessionName, setSessionName] = useState("");

  // Load telemetry
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [ssList, stdList] = await Promise.all([
        getFheMpcTelemetryInventory().catch(() => []),
        getFheMpcStandards().catch(() => [])
      ]);

      setSessions(ssList);
      setStandards(stdList);
    } catch (err) {
      console.error("Failed to load biomedical FHE/MPC telemetry data:", err);
      setMessage({ type: "error", text: "Failed connecting to FHE/MPC Telemetry service." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Run Noise Evaluation
  const handleEvaluateNoise = async (e) => {
    e?.preventDefault();
    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const result = await evaluateHomomorphicNoise(selectedSessionId);
      setNoiseResult(result);
      setMessage({ type: "success", text: `Homomorphic noise evaluated in ${result.noiseRefreshLatencyMs}ms! Remaining noise budget: ${result.noiseLevelRemaining}. Bootstrapping required: ${result.bootstrappingRequired ? "YES" : "NO"}.` });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "Homomorphic noise evaluation failed." });
    } finally {
      setActionLoading(false);
    }
  };

  // Dispatch FHE Workload
  const handleDispatchWorkload = async (e) => {
    e.preventDefault();
    if (!sessionName.trim()) return;

    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const newSession = await dispatchFheMpcWorkload({ sessionName: sessionName.trim() });

      setSessionName("");
      setIsModalOpen(false);
      setMessage({ type: "success", text: `FHE/MPC Compute Session ${newSession.sessionId} dispatched using CKKS homomorphic scheme!` });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "Failed to dispatch FHE workload." });
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const totalSessions = sessions.length;
    const activeEncrypted = sessions.filter((s) => s.status.includes("ACTIVE")).length;
    const ckksCount = sessions.filter((s) => s.encryptionScheme.includes("CKKS")).length;

    return { totalSessions, activeEncrypted, ckksCount };
  }, [sessions]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* 1. Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-slate-100">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-full flex items-center gap-1.5 font-mono">
                <Cpu size={12} /> HOMOMORPHIC ENCRYPTION (FHE)
              </span>
              <span className="px-3 py-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1 font-mono">
                <ShieldCheck size={12} /> MULTI-PARTY COMPUTATION (MPC)
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Biomedical FHE & Multi-Party Computation Telemetry
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Zero-leakage encrypted mathematical computation over medical records using CKKS/BGV homomorphic schemes, Shamir secret sharing, and real-time noise budget tracking.
            </p>
          </div>

          {/* Telemetry Widget */}
          <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl w-full lg:w-auto text-xs space-y-2">
            <div className="flex items-center justify-between gap-6 font-mono">
              <span className="text-slate-400 font-sans font-bold uppercase text-[10px]">FHE Compute Telemetry</span>
              <span className="text-indigo-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                ENCRYPTED ENGINE ACTIVE
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-700/80 font-mono text-[11px]">
              <div>FHE Sessions: <strong className="text-white">{metrics.totalSessions} Active</strong></div>
              <div>Security Level: <strong className="text-indigo-300">128-bit Post-Quantum</strong></div>
              <div>CKKS Schemes: <strong className="text-emerald-400">{metrics.ckksCount} Running</strong></div>
              <div>Decryption Keys: <strong className="text-emerald-400">NEVER EXPOSED</strong></div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        {message.text && (
          <div
            className={`mt-6 p-4 rounded-xl text-sm font-medium flex items-center justify-between border ${
              message.type === "error"
                ? "bg-red-500/10 border-red-500/30 text-red-400"
                : "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
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
            onClick={() => setActiveTab("SESSIONS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "SESSIONS"
                ? "bg-indigo-600 text-white font-black shadow-lg shadow-indigo-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Cpu size={15} /> Encrypted FHE Sessions ({sessions.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("SANDBOX")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "SANDBOX"
                ? "bg-indigo-600 text-white font-black shadow-lg shadow-indigo-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Zap size={15} /> Homomorphic Noise & Bootstrapping Sandbox
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("STANDARDS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "STANDARDS"
                ? "bg-indigo-600 text-white font-black shadow-lg shadow-indigo-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <ShieldCheck size={15} /> ISO/IEC 18033-6 Standards ({standards.length})
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-indigo-600/20"
        >
          <PlusCircle size={15} /> Dispatch FHE Workload
        </button>
      </div>

      {/* 3. SESSIONS TAB */}
      {activeTab === "SESSIONS" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">Active FHE & Multi-Party Compute Sessions</h3>
              <p className="text-xs text-slate-400 font-mono">Session IDs, homomorphic schemes, secret sharing protocols, compute nodes, and security budgets</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3">Session ID</th>
                  <th className="p-3">Workload Name & Scheme</th>
                  <th className="p-3">Secret Sharing Protocol</th>
                  <th className="p-3">Participating Compute Nodes</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {sessions.map((s, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/60">
                    <td className="p-3 font-bold text-indigo-400">{s.sessionId}</td>
                    <td className="p-3 font-sans">
                      <div className="font-semibold text-white">{s.sessionName}</div>
                      <div className="text-[10px] text-indigo-300 font-mono">{s.encryptionScheme}</div>
                    </td>
                    <td className="p-3 text-slate-400 font-mono text-[10px]">{s.secretSharingProtocol}</td>
                    <td className="p-3 text-slate-300 font-mono text-[10px]">
                      {s.computeNodes.join(", ")}
                    </td>
                    <td className="p-3 text-right font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {s.status}
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
                <Zap size={18} className="text-indigo-400" /> Homomorphic Noise & Bootstrapping Inspector
              </h3>
            </div>

            <form onSubmit={handleEvaluateNoise} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Target FHE Compute Session:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
                  value={selectedSessionId}
                  onChange={(e) => setSelectedSessionId(e.target.value)}
                >
                  {sessions.map((s) => (
                    <option key={s.sessionId} value={s.sessionId}>
                      {s.sessionId} - {s.sessionName}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-lg shadow-indigo-600/20"
              >
                <Zap size={16} /> Evaluate Ciphertext Noise Budget
              </button>
            </form>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-400" /> Noise Evaluation Output
              </h3>
            </div>

            {noiseResult ? (
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-sans font-bold uppercase">Remaining Noise Budget:</span>
                  <div className="text-sm font-bold text-indigo-300">{noiseResult.noiseLevelRemaining}</div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px] p-3 bg-slate-950/60 rounded-xl border border-slate-800 font-sans">
                  <div>Bootstrapping Needed: <strong className="text-emerald-400 font-mono text-[10px]">{noiseResult.bootstrappingRequired ? "YES" : "NO"}</strong></div>
                  <div>Latency: <strong className="text-emerald-400">{noiseResult.noiseRefreshLatencyMs} ms</strong></div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-2xl">
                Click "Evaluate Ciphertext Noise Budget" to analyze homomorphic noise state.
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
              <h3 className="text-base font-bold text-white">ISO/IEC 18033-6 & Homomorphic Standards</h3>
              <p className="text-xs text-slate-400 font-mono">Frameworks for homomorphic encryption, privacy-enhancing technologies, and secret sharing schemes</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {standards.map((s, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded font-bold">
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
                <Cpu size={18} className="text-indigo-400" /> Dispatch FHE Workload
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleDispatchWorkload} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Session Name / Workload:</label>
                <input
                  type="text"
                  placeholder="e.g. Encrypted Rare Disease Biomarker Search"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
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
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition shadow-lg shadow-indigo-600/20"
                >
                  Dispatch Workload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
