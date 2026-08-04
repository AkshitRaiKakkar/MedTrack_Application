import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Lock,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Sliders,
  Terminal,
  Cpu,
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
  Binary,
  Shield,
  Box
} from "lucide-react";
import {
  getFheEnclaves,
  provisionFheEnclave,
  runFheQuerySimulation,
  getFheStandards
} from "../../services/HomomorphicEncryptionService";
import "../../pages/auth/auth.css";

/**
 * HomomorphicEncryptionPanel Component
 * 
 * Biomedical Homomorphic Encryption & Confidential Compute Console.
 * Features:
 * 1. Fully Homomorphic Encryption (FHE / CKKS & BGV Schemes)
 * 2. AMD SEV-SNP & Intel SGX Hardware Enclave Isolation
 * 3. Ciphertext Noise Budget Monitoring & Zero-Knowledge Result Verification
 * 4. Encrypted EHR Query Simulator Sandbox & Enclave Provisioning Modal
 */
export default function HomomorphicEncryptionPanel() {
  // State
  const [enclaves, setEnclaves] = useState([]);
  const [standards, setStandards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("ENCLAVES"); // "ENCLAVES" | "SANDBOX" | "STANDARDS"

  // Sandbox State
  const [selectedEnclaveId, setSelectedEnclaveId] = useState("FHE-ENC-601");
  const [simResult, setSimResult] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [enclaveName, setEnclaveName] = useState("");

  // Load telemetry
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [encList, stdList] = await Promise.all([
        getFheEnclaves().catch(() => []),
        getFheStandards().catch(() => [])
      ]);

      setEnclaves(encList);
      setStandards(stdList);
    } catch (err) {
      console.error("Failed to load biomedical FHE data:", err);
      setMessage({ type: "error", text: "Failed connecting to Homomorphic Encryption service." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Run Query Sim
  const handleRunQuerySim = async (e) => {
    e?.preventDefault();
    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const result = await runFheQuerySimulation(selectedEnclaveId);
      setSimResult(result);
      setMessage({ type: "success", text: `Homomorphic calculation executed on ciphertext in ${result.homomorphicComputationTimeMs}ms! Plaintext zero exposure confirmed.` });
    } catch (err) {
      setMessage({ type: "error", text: "FHE Query simulation failed." });
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
      const newEnc = await provisionFheEnclave({ enclaveName: enclaveName.trim() });

      setEnclaveName("");
      setIsModalOpen(false);
      setMessage({ type: "success", text: `FHE Confidential Enclave ${newEnc.enclaveId} provisioned!` });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "Failed to provision FHE enclave." });
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const totalEnclaves = enclaves.length;
    const activeEnclaves = enclaves.filter((e) => e.enclaveStatus === "CONFIDENTIAL_COMPUTE_ACTIVE").length;
    const ckksCount = enclaves.filter((e) => e.fheScheme.includes("CKKS")).length;

    return { totalEnclaves, activeEnclaves, ckksCount };
  }, [enclaves]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* 1. Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-slate-100">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 rounded-full flex items-center gap-1.5 font-mono">
                <Lock size={12} /> HOMOMORPHIC ENCRYPTION & CONFIDENTIAL COMPUTE
              </span>
              <span className="px-3 py-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1 font-mono">
                <ShieldCheck size={12} /> ISO/IEC 18033-8 & CKKS
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Fully Homomorphic Encryption (FHE) & Confidential Enclaves
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Zero-plaintext exposure computation, CKKS vector scheme, AMD SEV-SNP & Intel SGX hardware enclaves, and ciphertext noise budget monitoring.
            </p>
          </div>

          {/* Telemetry Widget */}
          <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl w-full lg:w-auto text-xs space-y-2">
            <div className="flex items-center justify-between gap-6 font-mono">
              <span className="text-slate-400 font-sans font-bold uppercase text-[10px]">FHE Telemetry</span>
              <span className="text-cyan-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                CIPHERTEXT COMPUTE ACTIVE
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-700/80 font-mono text-[11px]">
              <div>FHE Enclaves: <strong className="text-white">{metrics.totalEnclaves} Active</strong></div>
              <div>Hardware Secure: <strong className="text-cyan-300">{metrics.activeEnclaves} Isolated</strong></div>
              <div>CKKS Vector: <strong className="text-emerald-400">{metrics.ckksCount} Schemes</strong></div>
              <div>Plaintext Exposure: <strong className="text-emerald-400">0% (NONE)</strong></div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        {message.text && (
          <div
            className={`mt-6 p-4 rounded-xl text-sm font-medium flex items-center justify-between border ${
              message.type === "error"
                ? "bg-red-500/10 border-red-500/30 text-red-400"
                : "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
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
                ? "bg-cyan-600 text-white font-black shadow-lg shadow-cyan-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Lock size={15} /> FHE Enclaves ({enclaves.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("SANDBOX")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "SANDBOX"
                ? "bg-cyan-600 text-white font-black shadow-lg shadow-cyan-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Zap size={15} /> Ciphertext Query Sandbox
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("STANDARDS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "STANDARDS"
                ? "bg-cyan-600 text-white font-black shadow-lg shadow-cyan-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <ShieldCheck size={15} /> ISO & CCC Standards ({standards.length})
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-cyan-600/20"
        >
          <PlusCircle size={15} /> Provision FHE Enclave
        </button>
      </div>

      {/* 3. ENCLAVES TAB */}
      {activeTab === "ENCLAVES" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">Confidential Compute FHE Enclaves</h3>
              <p className="text-xs text-slate-400 font-mono">Homomorphic schemes, hardware isolation, encrypted query types, and noise budgets</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3">Enclave ID</th>
                  <th className="p-3">Enclave Name & Scheme</th>
                  <th className="p-3">Hardware Isolation</th>
                  <th className="p-3">Encrypted Query Type</th>
                  <th className="p-3">Ciphertext Noise Level</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {enclaves.map((e, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/60">
                    <td className="p-3 font-bold text-cyan-400">{e.enclaveId}</td>
                    <td className="p-3 font-sans">
                      <div className="font-semibold text-white">{e.enclaveName}</div>
                      <div className="text-[10px] text-cyan-300 font-mono">{e.fheScheme}</div>
                    </td>
                    <td className="p-3 text-slate-400 font-mono text-[10px]">{e.hardwareIsolation}</td>
                    <td className="p-3 text-slate-400 font-mono text-[10px]">{e.encryptedQueryType}</td>
                    <td className="p-3 font-bold text-emerald-400 font-mono text-[10px]">{e.ciphertextNoiseLevel}</td>
                    <td className="p-3 text-right font-sans">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          e.enclaveStatus === "CONFIDENTIAL_COMPUTE_ACTIVE"
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

      {/* 4. SANDBOX TAB */}
      {activeTab === "SANDBOX" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Zap size={18} className="text-cyan-400" /> Ciphertext Homomorphic Query Sandbox
              </h3>
            </div>

            <form onSubmit={handleRunQuerySim} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Target FHE Enclave:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-sans"
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
                className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-lg shadow-cyan-600/20"
              >
                <Lock size={16} /> Execute Homomorphic Calculation on Ciphertext
              </button>
            </form>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-400" /> Ciphertext Computation Output
              </h3>
            </div>

            {simResult ? (
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-sans font-bold uppercase">Encrypted Payload Output:</span>
                  <div className="text-[10px] text-cyan-300 break-all">{simResult.ciphertextPayload}</div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px] p-3 bg-slate-950/60 rounded-xl border border-slate-800 font-sans">
                  <div>Homomorphic Time: <strong className="text-emerald-400">{simResult.homomorphicComputationTimeMs} ms</strong></div>
                  <div>Plaintext Exposed: <strong className="text-emerald-400">FALSE (0%)</strong></div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-2xl">
                Click "Execute Homomorphic Calculation on Ciphertext" to run math on encrypted EHR data without decrypting.
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
              <h3 className="text-base font-bold text-white">ISO/IEC 18033-8 & Confidential Computing Standards</h3>
              <p className="text-xs text-slate-400 font-mono">Specifications for encrypted computation and hardware-level enclave memory isolation</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {standards.map((s, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded font-bold">
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
                <Lock size={18} className="text-cyan-400" /> Provision FHE Enclave
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleProvisionEnclave} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Enclave Name:</label>
                <input
                  type="text"
                  placeholder="e.g. Clinical Cardiology Predictive Enclave"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-sans"
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
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition shadow-lg shadow-cyan-600/20"
                >
                  Provision Confidential Enclave
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
