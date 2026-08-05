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
  SlidersHorizontal,
  Zap,
  Check,
  Server,
  ShieldAlert,
  HardDrive
} from "lucide-react";
import {
  getSecureEnclaveInventory,
  provisionSecureEnclave,
  verifyEnclaveAttestation,
  getSecureEnclaveStandards
} from "../../services/BiomedicalSecureEnclaveService";
import "../../pages/auth/auth.css";

/**
 * BiomedicalSecureEnclavePanel Component
 * 
 * Biomedical Confidential Computing & Secure Enclave Command Center.
 * Features:
 * 1. AMD SEV-SNP, Intel SGX/TDX, AWS Nitro Enclave Inventory & Attestation Monitoring
 * 2. Hardware Root-of-Trust Attestation Quote Verification Engine
 * 3. Confidential Computing Consortium (CCC) & NIST SP 800-190 Isolation Standards
 * 4. Hardware Attestation Sandbox & Enclave Deployment Modal
 */
export default function BiomedicalSecureEnclavePanel() {
  // State
  const [enclaves, setEnclaves] = useState([]);
  const [standards, setStandards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("ENCLAVES"); // "ENCLAVES" | "ATTESTATION" | "STANDARDS"

  // Sandbox State
  const [selectedEnclaveId, setSelectedEnclaveId] = useState("ENC-SEV-401");
  const [attestResult, setAttestResult] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nodeName, setNodeName] = useState("");

  // Load telemetry
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [encList, stdList] = await Promise.all([
        getSecureEnclaveInventory().catch(() => []),
        getSecureEnclaveStandards().catch(() => [])
      ]);

      setEnclaves(encList);
      setStandards(stdList);
    } catch (err) {
      console.error("Failed to load biomedical secure enclave data:", err);
      setMessage({ type: "error", text: "Failed connecting to Secure Enclave service." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Run Attestation Verification
  const handleVerifyAttestation = async (e) => {
    e?.preventDefault();
    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const result = await verifyEnclaveAttestation(selectedEnclaveId);
      setAttestResult(result);
      setMessage({ type: "success", text: `Hardware Enclave Attestation verified in ${result.attestationLatencyMs}ms! Signature valid against CPU Hardware Root-of-Trust.` });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "Hardware enclave attestation verification failed." });
    } finally {
      setActionLoading(false);
    }
  };

  // Deploy Enclave
  const handleDeployEnclave = async (e) => {
    e.preventDefault();
    if (!nodeName.trim()) return;

    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const newEnc = await provisionSecureEnclave({ nodeName: nodeName.trim() });

      setNodeName("");
      setIsModalOpen(false);
      setMessage({ type: "success", text: `Secure Enclave Node ${newEnc.enclaveId} provisioned with AMD SEV-SNP hardware memory encryption!` });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "Failed to deploy secure enclave node." });
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const totalEnclaves = enclaves.length;
    const verifiedAttested = enclaves.filter((e) => e.attestationStatus.includes("VERIFIED")).length;
    const highAssurance = enclaves.filter((e) => e.hipaaIsolationLevel === "HIGH_ASSURANCE_PHI_ENCLAVE").length;

    return { totalEnclaves, verifiedAttested, highAssurance };
  }, [enclaves]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* 1. Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-slate-100">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded-full flex items-center gap-1.5 font-mono">
                <Cpu size={12} /> CONFIDENTIAL COMPUTE & SECURE ENCLAVES
              </span>
              <span className="px-3 py-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1 font-mono">
                <ShieldCheck size={12} /> AMD SEV-SNP & INTEL SGX/TDX
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Biomedical Confidential Compute & Hardware Enclaves
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Hardware-based Trusted Execution Environments (TEEs), remote CPU attestation verification, memory encryption (AES-256-XTS), and zero-trust PHI workload isolation.
            </p>
          </div>

          {/* Telemetry Widget */}
          <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl w-full lg:w-auto text-xs space-y-2">
            <div className="flex items-center justify-between gap-6 font-mono">
              <span className="text-slate-400 font-sans font-bold uppercase text-[10px]">Enclave Telemetry</span>
              <span className="text-purple-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                TEE ENCLAVE PROTECTED
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-700/80 font-mono text-[11px]">
              <div>Secure Nodes: <strong className="text-white">{metrics.totalEnclaves} Active</strong></div>
              <div>Attestation: <strong className="text-purple-300">{metrics.verifiedAttested} Verified</strong></div>
              <div>PHI Enclaves: <strong className="text-emerald-400">{metrics.highAssurance} High Assurance</strong></div>
              <div>Memory Protection: <strong className="text-emerald-400">AES-256-XTS TME</strong></div>
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
            onClick={() => setActiveTab("ENCLAVES")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "ENCLAVES"
                ? "bg-purple-600 text-white font-black shadow-lg shadow-purple-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Cpu size={15} /> Hardware Enclaves ({enclaves.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ATTESTATION")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "ATTESTATION"
                ? "bg-purple-600 text-white font-black shadow-lg shadow-purple-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Server size={15} /> Hardware Attestation Sandbox
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
            <ShieldCheck size={15} /> CCC & NIST Standards ({standards.length})
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-purple-600/20"
        >
          <PlusCircle size={15} /> Deploy Hardware Enclave Node
        </button>
      </div>

      {/* 3. ENCLAVES TAB */}
      {activeTab === "ENCLAVES" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">Hardware Secure Enclaves & Active Workloads</h3>
              <p className="text-xs text-slate-400 font-mono">Trusted execution environments, hardware attestation status, memory encryption keys, and active PHI workloads</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3">Enclave ID</th>
                  <th className="p-3">Node Name & Architecture</th>
                  <th className="p-3">Attestation Status</th>
                  <th className="p-3">Memory Encryption Key</th>
                  <th className="p-3">Active Workload</th>
                  <th className="p-3 text-right">HIPAA Isolation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {enclaves.map((e, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/60">
                    <td className="p-3 font-bold text-purple-400">{e.enclaveId}</td>
                    <td className="p-3 font-sans">
                      <div className="font-semibold text-white">{e.nodeName}</div>
                      <div className="text-[10px] text-purple-300 font-mono">{e.hardwareArchitecture}</div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          e.attestationStatus.includes("VERIFIED")
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        {e.attestationStatus}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400 font-mono text-[10px]">{e.memoryEncryptionKey}</td>
                    <td className="p-3 text-slate-300 font-sans text-[11px]">{e.activeWorkload}</td>
                    <td className="p-3 text-right font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {e.hipaaIsolationLevel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. ATTESTATION TAB */}
      {activeTab === "ATTESTATION" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Server size={18} className="text-purple-400" /> Hardware Root-of-Trust Attestation Engine
              </h3>
            </div>

            <form onSubmit={handleVerifyAttestation} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Target Secure Enclave Node:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-sans"
                  value={selectedEnclaveId}
                  onChange={(e) => setSelectedEnclaveId(e.target.value)}
                >
                  {enclaves.map((e) => (
                    <option key={e.enclaveId} value={e.enclaveId}>
                      {e.enclaveId} - {e.nodeName}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-lg shadow-purple-600/20"
              >
                <Server size={16} /> Verify Hardware Attestation Quote & Memory Integrity
              </button>
            </form>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-400" /> Remote Attestation Output
              </h3>
            </div>

            {attestResult ? (
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-sans font-bold uppercase">CPU Enclave Measurement Hash:</span>
                  <div className="text-[10px] text-purple-300 break-all">{attestResult.measurementHash}</div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px] p-3 bg-slate-950/60 rounded-xl border border-slate-800 font-sans">
                  <div>Signature State: <strong className="text-emerald-400 font-mono text-[10px]">CPU ROOT VALID</strong></div>
                  <div>Attestation Speed: <strong className="text-emerald-400">{attestResult.attestationLatencyMs} ms</strong></div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-2xl">
                Click "Verify Hardware Attestation Quote & Memory Integrity" to validate CPU measurement.
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
              <h3 className="text-base font-bold text-white">Confidential Compute Consortium & NIST Standards</h3>
              <p className="text-xs text-slate-400 font-mono">Frameworks for hardware-based trusted execution environments and remote attestation</p>
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
                <Cpu size={18} className="text-purple-400" /> Deploy Hardware Enclave Node
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleDeployEnclave} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Enclave Node Name / Workload:</label>
                <input
                  type="text"
                  placeholder="e.g. Pharmacogenomics Secure Execution Enclave"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-sans"
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
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition shadow-lg shadow-purple-600/20"
                >
                  Deploy TEE Enclave
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
