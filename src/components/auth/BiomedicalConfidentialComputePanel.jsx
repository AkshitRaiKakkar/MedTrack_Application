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
  HardDrive,
  Box,
  KeyRound
} from "lucide-react";
import {
  getConfidentialComputeInventory,
  provisionSecureEnclave,
  verifyEnclaveRemoteAttestation,
  getConfidentialComputeStandards
} from "../../services/BiomedicalConfidentialComputeService";
import "../../pages/auth/auth.css";

/**
 * BiomedicalConfidentialComputePanel Component
 * 
 * Biomedical Hardware Secure Enclaves & Confidential Computing Console.
 * Features:
 * 1. Hardware TEE Inventory (Intel SGX, AMD SEV-SNP, AWS Nitro) & MRENCLAVE Attestation Hashes
 * 2. Hardware Remote Attestation (DCAP Quote Verification & TCB Check) Sandbox
 * 3. Confidential Computing Consortium (CCC) & NIST SP 800-193 Standards
 * 4. Secure Enclave Provisioning Modal
 */
export default function BiomedicalConfidentialComputePanel() {
  // State
  const [enclaves, setEnclaves] = useState([]);
  const [standards, setStandards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("ENCLAVES"); // "ENCLAVES" | "SANDBOX" | "STANDARDS"

  // Sandbox State
  const [selectedEnclaveId, setSelectedEnclaveId] = useState("ENC-NODE-1901");
  const [attestResult, setAttestResult] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [enclaveName, setEnclaveName] = useState("");

  // Load telemetry
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [encList, stdList] = await Promise.all([
        getConfidentialComputeInventory().catch(() => []),
        getConfidentialComputeStandards().catch(() => [])
      ]);

      setEnclaves(encList);
      setStandards(stdList);
    } catch (err) {
      console.error("Failed to load biomedical confidential compute data:", err);
      setMessage({ type: "error", text: "Failed connecting to Confidential Compute service." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Run Remote Attestation
  const handleAttestEnclave = async (e) => {
    e?.preventDefault();
    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const result = await verifyEnclaveRemoteAttestation(selectedEnclaveId);
      setAttestResult(result);
      setMessage({ type: "success", text: `Hardware Remote Attestation Quote verified in ${result.attestationLatencyMs}ms! Quote Valid: ${result.attestationQuoteValid ? "YES" : "NO"}. TCB Status: ${result.tcbStatus}.` });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "Hardware remote attestation failed." });
    } finally {
      setActionLoading(false);
    }
  };

  // Provision Secure Enclave
  const handleProvisionEnclave = async (e) => {
    e.preventDefault();
    if (!enclaveName.trim()) return;

    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const newEnc = await provisionSecureEnclave({ enclaveName: enclaveName.trim() });

      setEnclaveName("");
      setIsModalOpen(false);
      setMessage({ type: "success", text: `Hardware Secure Enclave ${newEnc.enclaveId} provisioned with encrypted in-memory execution!` });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "Failed to provision secure enclave." });
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const totalEnclaves = enclaves.length;
    const attestedSecure = enclaves.filter((e) => e.enclaveStatus.includes("ATTESTED")).length;
    const totalWorkloads = enclaves.reduce((acc, curr) => acc + curr.activeWorkloadCount, 0);

    return { totalEnclaves, attestedSecure, totalWorkloads };
  }, [enclaves]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* 1. Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-slate-100">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-full flex items-center gap-1.5 font-mono">
                <Cpu size={12} /> HARDWARE SECURE ENCLAVES
              </span>
              <span className="px-3 py-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1 font-mono">
                <ShieldCheck size={12} /> INTEL SGX DCAP / AMD SEV-SNP
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Biomedical Confidential Compute & Enclaves
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Hardware-based Trusted Execution Environments (TEEs), Total Memory Encryption (TME-MK / AES-XTS-256), DCAP remote attestation quote validation, and protected data-in-use execution.
            </p>
          </div>

          {/* Telemetry Widget */}
          <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl w-full lg:w-auto text-xs space-y-2">
            <div className="flex items-center justify-between gap-6 font-mono">
              <span className="text-slate-400 font-sans font-bold uppercase text-[10px]">TEE Hardware Telemetry</span>
              <span className="text-indigo-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                HARDWARE ISOLATED
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-700/80 font-mono text-[11px]">
              <div>Secure Enclaves: <strong className="text-white">{metrics.totalEnclaves} Attested</strong></div>
              <div>Isolated Workloads: <strong className="text-indigo-300">{metrics.totalWorkloads} Enclave Tasks</strong></div>
              <div>Memory Encryption: <strong className="text-emerald-400">AES-XTS-256 (TME)</strong></div>
              <div>Root of Trust: <strong className="text-emerald-400">HARDWARE TPM 2.0</strong></div>
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
            onClick={() => setActiveTab("ENCLAVES")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "ENCLAVES"
                ? "bg-indigo-600 text-white font-black shadow-lg shadow-indigo-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Cpu size={15} /> Hardware TEE Enclaves ({enclaves.length})
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
            <Zap size={15} /> Remote Attestation Sandbox
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
            <ShieldCheck size={15} /> CCC & NIST Standards ({standards.length})
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-indigo-600/20"
        >
          <PlusCircle size={15} /> Provision Secure Enclave
        </button>
      </div>

      {/* 3. ENCLAVES TAB */}
      {activeTab === "ENCLAVES" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">Hardware Secure Enclaves & Attestation Telemetry</h3>
              <p className="text-xs text-slate-400 font-mono">Enclave IDs, hardware architectures, memory encryption types, MRENCLAVE hashes, and active workload counts</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3">Enclave ID</th>
                  <th className="p-3">Enclave Name & Hardware TEE</th>
                  <th className="p-3">Memory Encryption Type</th>
                  <th className="p-3">MRENCLAVE Hash</th>
                  <th className="p-3 text-right">Attestation Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {enclaves.map((e, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/60">
                    <td className="p-3 font-bold text-indigo-400">{e.enclaveId}</td>
                    <td className="p-3 font-sans">
                      <div className="font-semibold text-white">{e.enclaveName}</div>
                      <div className="text-[10px] text-indigo-300 font-mono">{e.hardwareArchitecture}</div>
                    </td>
                    <td className="p-3 text-slate-400 font-mono text-[10px]">{e.memoryEncryptionType}</td>
                    <td className="p-3 text-slate-300 font-mono text-[10px]">
                      {e.attestationMeasurementHash.slice(0, 22)}...
                    </td>
                    <td className="p-3 text-right font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
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

      {/* 4. SANDBOX TAB */}
      {activeTab === "SANDBOX" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Zap size={18} className="text-indigo-400" /> Hardware Remote Attestation Quote Inspector
              </h3>
            </div>

            <form onSubmit={handleAttestEnclave} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Target Secure Enclave:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
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
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-lg shadow-indigo-600/20"
              >
                <Zap size={16} /> Execute DCAP Hardware Remote Attestation
              </button>
            </form>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-400" /> Attestation Output
              </h3>
            </div>

            {attestResult ? (
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-sans font-bold uppercase">Attestation Quote Integrity:</span>
                  <div className="text-sm font-bold text-emerald-400">{attestResult.attestationQuoteValid ? "VALID & HARDWARE SIGNED" : "INVALID"}</div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px] p-3 bg-slate-950/60 rounded-xl border border-slate-800 font-sans">
                  <div>TCB Status: <strong className="text-emerald-400 font-mono text-[10px]">{attestResult.tcbStatus}</strong></div>
                  <div>PCK Chain Valid: <strong className="text-emerald-400">{attestResult.pckCertificateChainValid ? "YES" : "NO"}</strong></div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-2xl">
                Click "Execute DCAP Hardware Remote Attestation" to verify TEE quote validity.
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
              <h3 className="text-base font-bold text-white">Confidential Computing Consortium & NIST Standards</h3>
              <p className="text-xs text-slate-400 font-mono">Frameworks for TEE architecture, Intel SGX DCAP remote attestation, and platform firmware resiliency</p>
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
                <Cpu size={18} className="text-indigo-400" /> Provision Secure Enclave
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleProvisionEnclave} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Enclave Workload Name:</label>
                <input
                  type="text"
                  placeholder="e.g. Cardiology Neural Network Inference Enclave"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
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
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition shadow-lg shadow-indigo-600/20"
                >
                  Launch Enclave
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
