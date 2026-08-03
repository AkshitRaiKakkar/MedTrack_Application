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
  SlidersHorizontal,
  Zap,
  Check,
  Radio,
  Server
} from "lucide-react";
import {
  getSdpEnclaves,
  provisionSdpEnclave,
  runSpaKnockSimulation,
  getSdpStandards
} from "../../services/ZeroTrustSdpService";
import "../../pages/auth/auth.css";

/**
 * ZeroTrustSdpPanel Component
 * 
 * Zero-Trust Microsegmentation & Software-Defined Perimeter (SDP) Console.
 * Features:
 * 1. Dark Network Architecture & Single Packet Authorization (SPA)
 * 2. Microsegmentation Enclave Inventory & Dynamic Firewalling
 * 3. NIST SP 800-207 Zero Trust Policy Enforcement Point (PEP) Telemetry
 * 4. Microsegment Enclave Provisioning & Ephemeral Port Opening Simulator
 */
export default function ZeroTrustSdpPanel() {
  // State
  const [enclaves, setEnclaves] = useState([]);
  const [standards, setStandards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("ENCLAVES"); // "ENCLAVES" | "SPA" | "STANDARDS"

  // SPA State
  const [selectedEnclaveId, setSelectedEnclaveId] = useState("SDP-ENC-701");
  const [spaResult, setSpaResult] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [enclaveName, setEnclaveName] = useState("");

  // Load telemetry
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [encList, stdList] = await Promise.all([
        getSdpEnclaves().catch(() => []),
        getSdpStandards().catch(() => [])
      ]);

      setEnclaves(encList);
      setStandards(stdList);
    } catch (err) {
      console.error("Failed to load SDP zero-trust data:", err);
      setMessage({ type: "error", text: "Failed connecting to Zero-Trust SDP service." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Run SPA Knock Sim
  const handleRunSpaKnock = async (e) => {
    e?.preventDefault();
    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const result = await runSpaKnockSimulation(selectedEnclaveId);
      setSpaResult(result);
      setMessage({ type: "success", text: `SPA Knock authenticated! Ephemeral Port ${result.ephemeralPortOpened} opened for ${result.ttlSeconds}s` });
    } catch (err) {
      setMessage({ type: "error", text: "SPA Knock authentication failed." });
    } finally {
      setActionLoading(false);
    }
  };

  // Provision Enclave
  const handleProvisionEnclave = async (e) => {
    e.preventDefault();
    if (!enclaveName.trim()) return;

    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const newEnc = await provisionSdpEnclave({ enclaveName: enclaveName.trim() });

      setEnclaveName("");
      setIsModalOpen(false);
      setMessage({ type: "success", text: `SDP Microsegment Enclave ${newEnc.enclaveId} provisioned!` });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "Failed to provision SDP enclave." });
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const totalEnclaves = enclaves.length;
    const activeIsolated = enclaves.filter((e) => e.enclaveStatus === "ENCLAVE_ACTIVE_ISOLATED").length;
    const totalTunnels = enclaves.reduce((acc, e) => acc + (e.activeTunnels || 0), 0);

    return { totalEnclaves, activeIsolated, totalTunnels };
  }, [enclaves]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* 1. Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-slate-100">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center gap-1.5 font-mono">
                <Network size={12} /> ZERO TRUST SDP & MICROSEGMENTATION
              </span>
              <span className="px-3 py-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1 font-mono">
                <ShieldCheck size={12} /> NIST SP 800-207 COMPLIANT
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Software-Defined Perimeter (SDP) & Enclave Security
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Dark network infrastructure, Single Packet Authorization (SPA) HMAC knocking, microsegmentation firewall rules, and zero trust policy decision point management.
            </p>
          </div>

          {/* Telemetry Widget */}
          <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl w-full lg:w-auto text-xs space-y-2">
            <div className="flex items-center justify-between gap-6 font-mono">
              <span className="text-slate-400 font-sans font-bold uppercase text-[10px]">SDP Telemetry</span>
              <span className="text-blue-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                DARK PERIMETER ACTIVE
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-700/80 font-mono text-[11px]">
              <div>Micro Enclaves: <strong className="text-white">{metrics.totalEnclaves} Enclaves</strong></div>
              <div>Isolated Enclaves: <strong className="text-blue-300">{metrics.activeIsolated} Dark</strong></div>
              <div>Active SDP Tunnels: <strong className="text-emerald-400">{metrics.totalTunnels} Tunnels</strong></div>
              <div>SPA Protocol: <strong className="text-emerald-400">HMAC-SHA256</strong></div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        {message.text && (
          <div
            className={`mt-6 p-4 rounded-xl text-sm font-medium flex items-center justify-between border ${
              message.type === "error"
                ? "bg-red-500/10 border-red-500/30 text-red-400"
                : "bg-blue-500/10 border-blue-500/30 text-blue-400"
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
            onClick={() => setActiveTab("ENCLAVES")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "ENCLAVES"
                ? "bg-blue-600 text-white font-black shadow-lg shadow-blue-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Network size={15} /> SDP Microsegment Enclaves ({enclaves.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("SPA")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "SPA"
                ? "bg-blue-600 text-white font-black shadow-lg shadow-blue-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Radio size={15} /> SPA Knocking Sandbox
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("STANDARDS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "STANDARDS"
                ? "bg-blue-600 text-white font-black shadow-lg shadow-blue-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <ShieldCheck size={15} /> NIST & CSA Standards ({standards.length})
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-blue-600/20"
        >
          <PlusCircle size={15} /> Provision Microsegment Enclave
        </button>
      </div>

      {/* 3. ENCLAVES TAB */}
      {activeTab === "ENCLAVES" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">SDP Dark Microsegmentation Enclaves</h3>
              <p className="text-xs text-slate-400 font-mono">Single Packet Authorization knock protocols, PDP nodes, and active identity tunnels</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3">Enclave ID</th>
                  <th className="p-3">Enclave Name & Microsegment Rules</th>
                  <th className="p-3">SPA Knock Protocol</th>
                  <th className="p-3">Policy Node (PDP)</th>
                  <th className="p-3">Active Tunnels</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {enclaves.map((e, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/60">
                    <td className="p-3 font-bold text-blue-400">{e.enclaveId}</td>
                    <td className="p-3 font-sans">
                      <div className="font-semibold text-white">{e.enclaveName}</div>
                      <div className="text-[10px] text-blue-300 font-mono">{e.microsegmentRules}</div>
                    </td>
                    <td className="p-3 text-slate-400 font-mono text-[10px]">{e.spaProtocol}</td>
                    <td className="p-3 text-slate-400 font-mono text-[10px]">{e.policyDecisionPoint}</td>
                    <td className="p-3 font-bold text-white">{e.activeTunnels} Tunnels</td>
                    <td className="p-3 text-right">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          e.enclaveStatus === "ENCLAVE_ACTIVE_ISOLATED"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        {e.enclaveStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. SPA TAB */}
      {activeTab === "SPA" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Radio size={18} className="text-blue-400" /> Single Packet Authorization (SPA) Knock Simulator
              </h3>
            </div>

            <form onSubmit={handleRunSpaKnock} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Target Enclave:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
                  value={selectedEnclaveId}
                  onChange={(e) => setSelectedEnclaveId(e.target.value)}
                >
                  {enclaves.map((e) => (
                    <option key={e.enclaveId} value={e.enclaveId}>
                      {e.enclaveId} - {e.enclaveName}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-lg shadow-blue-600/20"
              >
                <Zap size={16} /> Transmit Encrypted SPA Packet Knock
              </button>
            </form>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-400" /> Firewall Packet Authorization Output
              </h3>
            </div>

            {spaResult ? (
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-sans font-bold uppercase">SPA HMAC Header:</span>
                  <div className="text-[10px] text-blue-300">{spaResult.spaKnockHeader}</div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px] p-3 bg-slate-950/60 rounded-xl border border-slate-800 font-sans">
                  <div>Ephemeral Port Opened: <strong className="text-emerald-400">Port {spaResult.ephemeralPortOpened}</strong></div>
                  <div>Knock TTL: <strong className="text-emerald-400">{spaResult.ttlSeconds} Seconds</strong></div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-2xl">
                Click "Transmit Encrypted SPA Packet Knock" to simulate dark-network single packet authorization.
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
              <h3 className="text-base font-bold text-white">NIST SP 800-207 & CSA SDP Architecture Standards</h3>
              <p className="text-xs text-slate-400 font-mono">Frameworks for dark-network perimeter isolation and zero-trust microsegmentation</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {standards.map((s, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded font-bold">
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
                <Network size={18} className="text-blue-400" /> Provision Microsegment Enclave
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleProvisionEnclave} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Enclave Segment Name:</label>
                <input
                  type="text"
                  placeholder="e.g. ICU Medical Device Telemetry Segment"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
                  value={enclaveName}
                  onChange={(e) => setEnclaveName(e.target.value)}
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
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition shadow-lg shadow-blue-600/20"
                >
                  Provision Dark Enclave
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
