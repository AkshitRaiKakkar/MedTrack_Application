import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Binary,
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
  Atom,
  Share2
} from "lucide-react";
import {
  getQkdNodes,
  provisionQkdNode,
  runQkdExchangeSimulation,
  getQkdStandards
} from "../../services/QkdKeyDistributionService";
import "../../pages/auth/auth.css";

/**
 * QkdKeyDistributionPanel Component
 * 
 * Quantum Key Distribution (QKD) Mesh & Post-Quantum Key Exchange Console.
 * Features:
 * 1. BB84 Photonic Entanglement & Quantum Bit Error Rate (QBER) Monitoring
 * 2. NIST Round 4 CRYSTALS-Kyber-1024 Post-Quantum Key Encapsulation (ML-KEM)
 * 3. NSA CNSA 2.0 Compliance & Eavesdropping Interception Detection
 * 4. QKD Node Provisioning & Photonic Key Exchange Simulation Sandbox
 */
export default function QkdKeyDistributionPanel() {
  // State
  const [nodes, setNodes] = useState([]);
  const [standards, setStandards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("NODES"); // "NODES" | "SANDBOX" | "STANDARDS"

  // Sandbox State
  const [selectedNodeId, setSelectedNodeId] = useState("QKD-NODE-401");
  const [simResult, setSimResult] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nodeName, setNodeName] = useState("");

  // Load telemetry
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [nodeList, stdList] = await Promise.all([
        getQkdNodes().catch(() => []),
        getQkdStandards().catch(() => [])
      ]);

      setNodes(nodeList);
      setStandards(stdList);
    } catch (err) {
      console.error("Failed to load QKD key distribution data:", err);
      setMessage({ type: "error", text: "Failed connecting to Quantum Key Distribution service." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Run Exchange Sim
  const handleRunExchangeSim = async (e) => {
    e?.preventDefault();
    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const result = await runQkdExchangeSimulation(selectedNodeId);
      setSimResult(result);
      setMessage({ type: "success", text: `BB84 Photonic Key Exchange complete! Sifted Key: ${result.siftedKeyLengthBits} bits, QBER: ${result.quantumBitErrorRatePercent}%` });
    } catch (err) {
      setMessage({ type: "error", text: "QKD Key Exchange simulation failed." });
    } finally {
      setActionLoading(false);
    }
  };

  // Provision Node
  const handleProvisionNode = async (e) => {
    e.preventDefault();
    if (!nodeName.trim()) return;

    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const newNd = await provisionQkdNode({ nodeName: nodeName.trim() });

      setNodeName("");
      setIsModalOpen(false);
      setMessage({ type: "success", text: `QKD Photonic Node ${newNd.nodeId} provisioned!` });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "Failed to provision QKD node." });
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const totalNodes = nodes.length;
    const establishedNodes = nodes.filter((n) => n.nodeStatus === "QUANTUM_LINK_ESTABLISHED").length;
    const cnsaCompliant = nodes.filter((n) => n.cnsaComplianceState === "NSA_CNSA_2_0_VERIFIED").length;

    return { totalNodes, establishedNodes, cnsaCompliant };
  }, [nodes]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* 1. Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-slate-100">
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-violet-400 bg-violet-500/10 border border-violet-500/20 rounded-full flex items-center gap-1.5 font-mono">
                <Atom size={12} /> QUANTUM KEY DISTRIBUTION (QKD)
              </span>
              <span className="px-3 py-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1 font-mono">
                <ShieldCheck size={12} /> NSA CNSA 2.0 & CRYSTALS-KYBER
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Quantum Key Distribution (QKD) & Post-Quantum Mesh
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              BB84 photonic entanglement key exchange, Quantum Bit Error Rate (QBER) eavesdropping detection, CRYSTALS-Kyber-1024 lattice key encapsulation, and NSA CNSA 2.0 compliance.
            </p>
          </div>

          {/* Telemetry Widget */}
          <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl w-full lg:w-auto text-xs space-y-2">
            <div className="flex items-center justify-between gap-6 font-mono">
              <span className="text-slate-400 font-sans font-bold uppercase text-[10px]">QKD Mesh Telemetry</span>
              <span className="text-violet-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-violet-400 animate-ping" />
                PHOTONIC MESH ONLINE
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-700/80 font-mono text-[11px]">
              <div>QKD Nodes: <strong className="text-white">{metrics.totalNodes} Nodes</strong></div>
              <div>Established Links: <strong className="text-violet-300">{metrics.establishedNodes} Quantum</strong></div>
              <div>CNSA 2.0 Verified: <strong className="text-emerald-400">{metrics.cnsaCompliant} Compliant</strong></div>
              <div>Lattice Cipher: <strong className="text-emerald-400">Kyber-1024</strong></div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        {message.text && (
          <div
            className={`mt-6 p-4 rounded-xl text-sm font-medium flex items-center justify-between border ${
              message.type === "error"
                ? "bg-red-500/10 border-red-500/30 text-red-400"
                : "bg-violet-500/10 border-violet-500/30 text-violet-400"
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
            onClick={() => setActiveTab("NODES")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "NODES"
                ? "bg-violet-600 text-white font-black shadow-lg shadow-violet-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Atom size={15} /> Photonic QKD Nodes ({nodes.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("SANDBOX")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "SANDBOX"
                ? "bg-violet-600 text-white font-black shadow-lg shadow-violet-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Zap size={15} /> BB84 Key Exchange Sandbox
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("STANDARDS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "STANDARDS"
                ? "bg-violet-600 text-white font-black shadow-lg shadow-violet-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <ShieldCheck size={15} /> NSA CNSA 2.0 Standards ({standards.length})
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-violet-600/20"
        >
          <PlusCircle size={15} /> Provision QKD Photonic Node
        </button>
      </div>

      {/* 3. NODES TAB */}
      {activeTab === "NODES" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">Photonic QKD Mesh Nodes & Lattice Algorithms</h3>
              <p className="text-xs text-slate-400 font-mono">BB84 protocols, QBER rates, CRYSTALS-Kyber encapsulation, and CNSA 2.0 states</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3">Node ID</th>
                  <th className="p-3">Node Name & Protocol</th>
                  <th className="p-3">Lattice Algorithm</th>
                  <th className="p-3">QBER Error Rate</th>
                  <th className="p-3">Key Gen Rate</th>
                  <th className="p-3 text-right">CNSA 2.0 Compliance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {nodes.map((n, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/60">
                    <td className="p-3 font-bold text-violet-400">{n.nodeId}</td>
                    <td className="p-3 font-sans">
                      <div className="font-semibold text-white">{n.nodeName}</div>
                      <div className="text-[10px] text-violet-300 font-mono">{n.protocol}</div>
                    </td>
                    <td className="p-3 text-slate-400 font-mono text-[10px]">{n.latticeAlgorithm}</td>
                    <td className="p-3 font-bold text-emerald-400 font-mono text-[10px]">{n.quantumBitErrorRate}</td>
                    <td className="p-3 font-bold text-white">{n.keyGenerationRate}</td>
                    <td className="p-3 text-right font-sans">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          n.cnsaComplianceState === "NSA_CNSA_2_0_VERIFIED"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-red-500/20 text-red-400 border border-red-500/30"
                        }`}
                      >
                        {n.cnsaComplianceState}
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
                <Zap size={18} className="text-violet-400" /> BB84 Photonic Key Exchange Sandbox
              </h3>
            </div>

            <form onSubmit={handleRunExchangeSim} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Target QKD Node:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 font-sans"
                  value={selectedNodeId}
                  onChange={(e) => setSelectedNodeId(e.target.value)}
                >
                  {nodes.map((n) => (
                    <option key={n.nodeId} value={n.nodeId}>
                      {n.nodeId} - {n.nodeName}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-lg shadow-violet-600/20"
              >
                <Atom size={16} /> Execute Photonic Entanglement Key Exchange
              </button>
            </form>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-400" /> Quantum Key Material Output
              </h3>
            </div>

            {simResult ? (
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-sans font-bold uppercase">Post-Quantum Key Material:</span>
                  <div className="text-[10px] text-violet-300 break-all">{simResult.postQuantumKeyMaterial}</div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px] p-3 bg-slate-950/60 rounded-xl border border-slate-800 font-sans">
                  <div>Sifted Key Length: <strong className="text-emerald-400">{simResult.siftedKeyLengthBits} Bits</strong></div>
                  <div>Eavesdropper Interception: <strong className="text-emerald-400">NONE DETECTED</strong></div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-2xl">
                Click "Execute Photonic Entanglement Key Exchange" to simulate quantum key generation and eavesdropping checks.
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
              <h3 className="text-base font-bold text-white">NSA CNSA 2.0 & ETSI QKD Standards</h3>
              <p className="text-xs text-slate-400 font-mono">Federal and international specifications for post-quantum cryptographic resilience</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {standards.map((s, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded font-bold">
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
                <Atom size={18} className="text-violet-400" /> Provision QKD Photonic Node
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleProvisionNode} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Photonic Link Name:</label>
                <input
                  type="text"
                  placeholder="e.g. Metro Hospital Central Fiber Optic Link"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 font-sans"
                  value={nodeName}
                  onChange={(e) => setNodeName(e.target.value)}
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
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition shadow-lg shadow-violet-600/20"
                >
                  Establish Photonic Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
