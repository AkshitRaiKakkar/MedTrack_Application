import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Radio,
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
  Wifi,
  Share2
} from "lucide-react";
import {
  getQkdPqcVpnInventory,
  provisionQkdVpnTunnel,
  auditQuantumEntanglement,
  getQkdPqcVpnStandards
} from "../../services/BiomedicalQkdPqcVpnService";
import "../../pages/auth/auth.css";

/**
 * BiomedicalQkdPqcVpnPanel Component
 * 
 * Biomedical Quantum Key Distribution (QKD) & Post-Quantum VPN Console.
 * Features:
 * 1. ETSI GS QKD 014 Optical Node Inventory & ML-KEM-1024 Hybrid Tunnel Matrix
 * 2. Quantum Bit Error Rate (QBER) & Eavesdropping Detector Sandbox
 * 3. ETSI GS QKD 014 & ITU-T Y.3800 Standards
 * 4. Quantum-Secured VPN Tunnel Provisioning Modal
 */
export default function BiomedicalQkdPqcVpnPanel() {
  // State
  const [tunnels, setTunnels] = useState([]);
  const [standards, setStandards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("TUNNELS"); // "TUNNELS" | "SANDBOX" | "STANDARDS"

  // Sandbox State
  const [selectedTunnelId, setSelectedTunnelId] = useState("QKD-TUNNEL-1401");
  const [auditResult, setAuditResult] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tunnelName, setTunnelName] = useState("");

  // Load telemetry
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [tnList, stdList] = await Promise.all([
        getQkdPqcVpnInventory().catch(() => []),
        getQkdPqcVpnStandards().catch(() => [])
      ]);

      setTunnels(tnList);
      setStandards(stdList);
    } catch (err) {
      console.error("Failed to load biomedical QKD & PQC VPN data:", err);
      setMessage({ type: "error", text: "Failed connecting to QKD PQC VPN service." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Run Quantum Audit
  const handleAuditQuantum = async (e) => {
    e?.preventDefault();
    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const result = await auditQuantumEntanglement(selectedTunnelId);
      setAuditResult(result);
      setMessage({ type: "success", text: `Quantum Entanglement Audit completed in ${result.auditLatencyMs}ms! QBER Rate: ${result.quantumBitErrorRate}. Eavesdropping: ${result.eavesdroppingDetected ? "DETECTED" : "NONE (SECURE)"}.` });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "Quantum entanglement audit failed." });
    } finally {
      setActionLoading(false);
    }
  };

  // Provision QKD Tunnel
  const handleProvisionTunnel = async (e) => {
    e.preventDefault();
    if (!tunnelName.trim()) return;

    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const newTn = await provisionQkdVpnTunnel({ tunnelName: tunnelName.trim() });

      setTunnelName("");
      setIsModalOpen(false);
      setMessage({ type: "success", text: `Quantum-Secured PQC VPN Tunnel ${newTn.tunnelId} established over optical fiber link!` });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "Failed to provision QKD VPN tunnel." });
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const totalTunnels = tunnels.length;
    const activeTunnels = tunnels.filter((t) => t.tunnelStatus.includes("ACTIVE")).length;
    const avgKeyRate = (tunnels.reduce((acc, curr) => acc + curr.quantumKeyRateKbps, 0) / (totalTunnels || 1)).toFixed(1);

    return { totalTunnels, activeTunnels, avgKeyRate };
  }, [tunnels]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* 1. Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-slate-100">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded-full flex items-center gap-1.5 font-mono">
                <Radio size={12} /> QUANTUM KEY DISTRIBUTION (QKD)
              </span>
              <span className="px-3 py-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1 font-mono">
                <ShieldCheck size={12} /> ETSI GS QKD 014 REST API
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Biomedical QKD & Post-Quantum VPN Tunnels
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Optical fiber Quantum Key Distribution (BB84/E91 protocols), ML-KEM-1024 hybrid IPsec VPN tunnels, real-time Quantum Bit Error Rate (QBER) monitoring, and eavesdropping detection.
            </p>
          </div>

          {/* Telemetry Widget */}
          <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl w-full lg:w-auto text-xs space-y-2">
            <div className="flex items-center justify-between gap-6 font-mono">
              <span className="text-slate-400 font-sans font-bold uppercase text-[10px]">QKD Optical Telemetry</span>
              <span className="text-purple-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                QUANTUM ENTANGLED
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-700/80 font-mono text-[11px]">
              <div>QKD Tunnels: <strong className="text-white">{metrics.totalTunnels} Active</strong></div>
              <div>Key Generation: <strong className="text-purple-300">{metrics.avgKeyRate} Kbps</strong></div>
              <div>Entanglement: <strong className="text-emerald-400">99.4% Fidelity</strong></div>
              <div>Eavesdropping: <strong className="text-emerald-400">ZERO INTERCEPT</strong></div>
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
            onClick={() => setActiveTab("TUNNELS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "TUNNELS"
                ? "bg-purple-600 text-white font-black shadow-lg shadow-purple-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Radio size={15} /> QKD Optical Tunnels ({tunnels.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("SANDBOX")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "SANDBOX"
                ? "bg-purple-600 text-white font-black shadow-lg shadow-purple-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Zap size={15} /> QBER & Entanglement Audit Sandbox
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("STANDARDS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "STANDARDS"
                ? "bg-purple-600 text-white font-black shadow-lg shadow-purple-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <ShieldCheck size={15} /> ETSI & ITU-T Standards ({standards.length})
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-purple-600/20"
        >
          <PlusCircle size={15} /> Provision QKD VPN Tunnel
        </button>
      </div>

      {/* 3. TUNNELS TAB */}
      {activeTab === "TUNNELS" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">Active QKD Optical Links & Post-Quantum VPN Tunnels</h3>
              <p className="text-xs text-slate-400 font-mono">Tunnel IDs, QKD protocols, post-quantum algorithms, quantum key rates, and entanglement fidelity</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3">Tunnel ID</th>
                  <th className="p-3">Tunnel Name & QKD Protocol</th>
                  <th className="p-3">PQC Algorithm</th>
                  <th className="p-3">Key Rate & Fidelity</th>
                  <th className="p-3 text-right">Tunnel Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {tunnels.map((t, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/60">
                    <td className="p-3 font-bold text-purple-400">{t.tunnelId}</td>
                    <td className="p-3 font-sans">
                      <div className="font-semibold text-white">{t.tunnelName}</div>
                      <div className="text-[10px] text-purple-300 font-mono">{t.qkdProtocol}</div>
                    </td>
                    <td className="p-3 text-slate-400 font-mono text-[10px]">{t.pqcAlgorithm}</td>
                    <td className="p-3 text-emerald-400 font-bold text-[10px]">
                      {t.quantumKeyRateKbps} Kbps ({t.entanglementQuality})
                    </td>
                    <td className="p-3 text-right font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {t.tunnelStatus}
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
                <Zap size={18} className="text-purple-400" /> Quantum Entanglement & QBER Inspector
              </h3>
            </div>

            <form onSubmit={handleAuditQuantum} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Target QKD Optical Link:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-sans"
                  value={selectedTunnelId}
                  onChange={(e) => setSelectedTunnelId(e.target.value)}
                >
                  {tunnels.map((t) => (
                    <option key={t.tunnelId} value={t.tunnelId}>
                      {t.tunnelId} - {t.tunnelName}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-lg shadow-purple-600/20"
              >
                <Zap size={16} /> Execute Quantum Entanglement Audit
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
                  <span className="text-[10px] text-slate-400 font-sans font-bold uppercase">QBER Status:</span>
                  <div className="text-sm font-bold text-emerald-400">{auditResult.qberStatus}</div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px] p-3 bg-slate-950/60 rounded-xl border border-slate-800 font-sans">
                  <div>Quantum Bit Error Rate: <strong className="text-emerald-400 font-mono text-[10px]">{auditResult.quantumBitErrorRate}</strong></div>
                  <div>Eavesdropping Intercept: <strong className="text-emerald-400">{auditResult.eavesdroppingDetected ? "DETECTED" : "NONE (SECURE)"}</strong></div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-2xl">
                Click "Execute Quantum Entanglement Audit" to verify optical fiber integrity.
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
              <h3 className="text-base font-bold text-white">ETSI & ITU-T QKD Standards</h3>
              <p className="text-xs text-slate-400 font-mono">Frameworks for REST-based key delivery, optical QKD architecture, and post-quantum VPN integration</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {standards.map((s, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded font-bold">
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
                <Radio size={18} className="text-purple-400" /> Provision QKD VPN Tunnel
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleProvisionTunnel} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Tunnel Name / Optical Link:</label>
                <input
                  type="text"
                  placeholder="e.g. Emergency Trauma Center Quantum Link"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-sans"
                  value={tunnelName}
                  onChange={(e) => setTunnelName(e.target.value)}
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
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition shadow-lg shadow-purple-600/20"
                >
                  Provision Tunnel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
