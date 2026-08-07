import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Network,
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
  Radio,
  Share2,
  Filter
} from "lucide-react";
import {
  getZeroTrustEbpfInventory,
  provisionEbpfPolicy,
  verifyEbpfKernelProbe,
  getZeroTrustEbpfStandards
} from "../../services/BiomedicalZeroTrustEbpfService";
import "../../pages/auth/auth.css";

/**
 * BiomedicalZeroTrustEbpfPanel Component
 * 
 * Biomedical Zero-Trust Micro-segmentation & eBPF Perimeter Defense Console.
 * Features:
 * 1. Cilium eBPF Security Policies & L3/L4/L7 Ingress/Egress Micro-segment Inventory
 * 2. eBPF Kernel Probe Latency & Unauthorized Packet Drop Sandbox
 * 3. NIST SP 800-207 & DoD Zero Trust Architecture Standards
 * 4. eBPF Kernel Micro-segmentation Policy Provisioning Modal
 */
export default function BiomedicalZeroTrustEbpfPanel() {
  // State
  const [policies, setPolicies] = useState([]);
  const [standards, setStandards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("POLICIES"); // "POLICIES" | "SANDBOX" | "STANDARDS"

  // Sandbox State
  const [selectedPolicyId, setSelectedPolicyId] = useState("EBPF-POL-1501");
  const [probeResult, setProbeResult] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [microsegmentName, setMicrosegmentName] = useState("");

  // Load telemetry
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [polList, stdList] = await Promise.all([
        getZeroTrustEbpfInventory().catch(() => []),
        getZeroTrustEbpfStandards().catch(() => [])
      ]);

      setPolicies(polList);
      setStandards(stdList);
    } catch (err) {
      console.error("Failed to load biomedical zero-trust eBPF data:", err);
      setMessage({ type: "error", text: "Failed connecting to Zero-Trust eBPF service." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Run eBPF Kernel Probe
  const handleVerifyProbe = async (e) => {
    e?.preventDefault();
    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const result = await verifyEbpfKernelProbe(selectedPolicyId);
      setProbeResult(result);
      setMessage({ type: "success", text: `eBPF Kernel Probe verified in ${result.kernelProbeLatencyNs}ns! Packets dropped: ${result.unauthorizedPacketsDropped}. eBPF Map memory: ${result.ebpfMapMemoryUsage}.` });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "eBPF kernel probe verification failed." });
    } finally {
      setActionLoading(false);
    }
  };

  // Provision eBPF Policy
  const handleProvisionPolicy = async (e) => {
    e.preventDefault();
    if (!microsegmentName.trim()) return;

    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const newPol = await provisionEbpfPolicy({ microsegmentName: microsegmentName.trim() });

      setMicrosegmentName("");
      setIsModalOpen(false);
      setMessage({ type: "success", text: `Zero-Trust eBPF Micro-segmentation Policy ${newPol.policyId} injected into Linux kernel!` });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "Failed to provision eBPF policy." });
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const totalPolicies = policies.length;
    const enforcedCount = policies.filter((p) => p.policyEnforcementStatus.includes("ENFORCED")).length;
    const totalPackets = policies.reduce((acc, curr) => acc + curr.packetsFilteredTotal, 0);

    return { totalPolicies, enforcedCount, totalPackets };
  }, [policies]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* 1. Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-slate-100">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-teal-400 bg-teal-500/10 border border-teal-500/20 rounded-full flex items-center gap-1.5 font-mono">
                <Network size={12} /> ZERO-TRUST MICRO-SEGMENTATION
              </span>
              <span className="px-3 py-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1 font-mono">
                <ShieldCheck size={12} /> eBPF KERNEL ENFORCEMENT
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Biomedical Zero-Trust & eBPF Perimeter Defense
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Linux kernel eBPF bytecode security policies (XDP / TC filters), L3/L4/L7 network micro-segmentation for medical devices, zero-copy packet filtering, and NIST SP 800-207 enforcement.
            </p>
          </div>

          {/* Telemetry Widget */}
          <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl w-full lg:w-auto text-xs space-y-2">
            <div className="flex items-center justify-between gap-6 font-mono">
              <span className="text-slate-400 font-sans font-bold uppercase text-[10px]">eBPF Kernel Telemetry</span>
              <span className="text-teal-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
                KERNEL PROBES ACTIVE
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-700/80 font-mono text-[11px]">
              <div>eBPF Microsegments: <strong className="text-white">{metrics.totalPolicies} Active</strong></div>
              <div>Packets Filtered: <strong className="text-teal-300">{(metrics.totalPackets / 1000000).toFixed(2)}M Packets</strong></div>
              <div>Kernel Probe Latency: <strong className="text-emerald-400">420 ns (Zero-Copy)</strong></div>
              <div>Default Action: <strong className="text-emerald-400">EXPLICIT DENY ALL</strong></div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        {message.text && (
          <div
            className={`mt-6 p-4 rounded-xl text-sm font-medium flex items-center justify-between border ${
              message.type === "error"
                ? "bg-red-500/10 border-red-500/30 text-red-400"
                : "bg-teal-500/10 border-teal-500/30 text-teal-400"
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
            onClick={() => setActiveTab("POLICIES")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "POLICIES"
                ? "bg-teal-600 text-white font-black shadow-lg shadow-teal-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Network size={15} /> eBPF Policies ({policies.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("SANDBOX")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "SANDBOX"
                ? "bg-teal-600 text-white font-black shadow-lg shadow-teal-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Zap size={15} /> eBPF Kernel Probe Sandbox
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("STANDARDS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "STANDARDS"
                ? "bg-teal-600 text-white font-black shadow-lg shadow-teal-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <ShieldCheck size={15} /> NIST SP 800-207 Standards ({standards.length})
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-teal-600/20"
        >
          <PlusCircle size={15} /> Provision eBPF Policy
        </button>
      </div>

      {/* 3. POLICIES TAB */}
      {activeTab === "POLICIES" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">Active eBPF Kernel Micro-segmentation Policies</h3>
              <p className="text-xs text-slate-400 font-mono">Policy IDs, microsegment names, eBPF program types, enforced protocols, and total packets filtered</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3">Policy ID</th>
                  <th className="p-3">Microsegment & eBPF Engine</th>
                  <th className="p-3">Enforced Protocol</th>
                  <th className="p-3">Total Packets Filtered</th>
                  <th className="p-3 text-right">Enforcement Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {policies.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/60">
                    <td className="p-3 font-bold text-teal-400">{p.policyId}</td>
                    <td className="p-3 font-sans">
                      <div className="font-semibold text-white">{p.microsegmentName}</div>
                      <div className="text-[10px] text-teal-300 font-mono">{p.ebpfProgramType}</div>
                    </td>
                    <td className="p-3 text-slate-400 font-mono text-[10px]">{p.enforcedProtocol}</td>
                    <td className="p-3 text-emerald-400 font-bold text-[10px]">
                      {p.packetsFilteredTotal.toLocaleString()} Packets
                    </td>
                    <td className="p-3 text-right font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {p.policyEnforcementStatus}
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
                <Zap size={18} className="text-teal-400" /> eBPF Kernel Probe Latency Inspector
              </h3>
            </div>

            <form onSubmit={handleVerifyProbe} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Target eBPF Policy:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-sans"
                  value={selectedPolicyId}
                  onChange={(e) => setSelectedPolicyId(e.target.value)}
                >
                  {policies.map((p) => (
                    <option key={p.policyId} value={p.policyId}>
                      {p.policyId} - {p.microsegmentName}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-lg shadow-teal-600/20"
              >
                <Zap size={16} /> Execute eBPF Kernel Probe Audit
              </button>
            </form>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-400" /> Probe Output
              </h3>
            </div>

            {probeResult ? (
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-sans font-bold uppercase">Kernel Probe State:</span>
                  <div className="text-sm font-bold text-emerald-400">{probeResult.probeStatus}</div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px] p-3 bg-slate-950/60 rounded-xl border border-slate-800 font-sans">
                  <div>Probe Latency: <strong className="text-emerald-400 font-mono text-[10px]">{probeResult.kernelProbeLatencyNs} ns</strong></div>
                  <div>Packets Dropped: <strong className="text-emerald-400">{probeResult.unauthorizedPacketsDropped} Unauthorized</strong></div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-2xl">
                Click "Execute eBPF Kernel Probe Audit" to measure packet filtering latency.
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
              <h3 className="text-base font-bold text-white">NIST SP 800-207 & eBPF Security Standards</h3>
              <p className="text-xs text-slate-400 font-mono">Frameworks for zero-trust architecture, Linux kernel eBPF bytecode filtering, and DoD micro-segmentation</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {standards.map((s, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded font-bold">
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
                <Network size={18} className="text-teal-400" /> Provision eBPF Policy
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleProvisionPolicy} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Microsegment Name:</label>
                <input
                  type="text"
                  placeholder="e.g. Surgical Robot Tele-Control Network Segment"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-sans"
                  value={microsegmentName}
                  onChange={(e) => setMicrosegmentName(e.target.value)}
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
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl transition shadow-lg shadow-teal-600/20"
                >
                  Provision Policy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
