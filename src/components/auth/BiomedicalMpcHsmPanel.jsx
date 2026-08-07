import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  KeyRound,
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
  Share2,
  Server,
  Building2
} from "lucide-react";
import {
  getMpcVaults,
  provisionMpcVault,
  runMpcSignatureSimulation,
  getMpcStandards
} from "../../services/BiomedicalMpcHsmService";
import "../../pages/auth/auth.css";

/**
 * BiomedicalMpcHsmPanel Component
 * 
 * Biomedical Sovereign Cryptographic HSM & Multi-Party Computation (MPC) Key Custody Console.
 * Features:
 * 1. Multi-Party Computation (MPC Threshold Cryptography t=3, n=5)
 * 2. Hardware Security Module (HSM FIPS 140-3 Level 4) Sovereign Vaults
 * 3. Shamir Secret Sharing & Zero-Master-Key-Reconstruction Protection
 * 4. Threshold Signature Simulator Sandbox & Vault Provisioning Modal
 */
export default function BiomedicalMpcHsmPanel() {
  // State
  const [vaults, setVaults] = useState([]);
  const [standards, setStandards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("VAULTS"); // "VAULTS" | "SANDBOX" | "STANDARDS"

  // Sandbox State
  const [selectedVaultId, setSelectedVaultId] = useState("MPC-HSM-801");
  const [simResult, setSimResult] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [vaultName, setVaultName] = useState("");

  // Load telemetry
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [vList, stdList] = await Promise.all([
        getMpcVaults().catch(() => []),
        getMpcStandards().catch(() => [])
      ]);

      setVaults(vList);
      setStandards(stdList);
    } catch (err) {
      console.error("Failed to load biomedical MPC HSM data:", err);
      setMessage({ type: "error", text: "Failed connecting to Multi-Party Computation HSM service." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Run Signature Sim
  const handleRunSignatureSim = async (e) => {
    e?.preventDefault();
    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const result = await runMpcSignatureSimulation(selectedVaultId);
      setSimResult(result);
      setMessage({ type: "success", text: `Threshold Signature generated using ${result.quorumSharesParticipated}/${result.thresholdRequired} MPC key shares in ${result.signingLatencyMs}ms! Master key never assembled.` });
    } catch (err) {
      setMessage({ type: "error", text: "MPC Threshold Signature simulation failed." });
    } finally {
      setActionLoading(false);
    }
  };

  // Provision Vault
  const handleProvisionVault = async (e) => {
    e.preventDefault();
    if (!vaultName.trim()) return;

    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const newV = await provisionMpcVault({ vaultName: vaultName.trim() });

      setVaultName("");
      setIsModalOpen(false);
      setMessage({ type: "success", text: `MPC Key Custody Vault ${newV.vaultId} provisioned!` });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "Failed to provision MPC vault." });
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const totalVaults = vaults.length;
    const activeVaults = vaults.filter((v) => v.vaultStatus === "MPC_KEY_CUSTODY_ACTIVE").length;
    const fipsLevel4 = vaults.filter((v) => v.hsmModel.includes("FIPS 140-3")).length;

    return { totalVaults, activeVaults, fipsLevel4 };
  }, [vaults]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* 1. Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-slate-100">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1.5 font-mono">
                <Share2 size={12} /> MULTI-PARTY COMPUTATION (MPC) & HSM
              </span>
              <span className="px-3 py-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1 font-mono">
                <ShieldCheck size={12} /> FIPS 140-3 LEVEL 4
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Sovereign MPC Key Custody & FIPS 140-3 HSM
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Multi-Party Computation threshold signatures (3-of-5 quorum), Shamir secret sharing, physical FIPS 140-3 Level 4 HSM clusters, and sovereign key isolation.
            </p>
          </div>

          {/* Telemetry Widget */}
          <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl w-full lg:w-auto text-xs space-y-2">
            <div className="flex items-center justify-between gap-6 font-mono">
              <span className="text-slate-400 font-sans font-bold uppercase text-[10px]">MPC HSM Telemetry</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                KEY QUORUM ACTIVE
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-700/80 font-mono text-[11px]">
              <div>Key Vaults: <strong className="text-white">{metrics.totalVaults} Clusters</strong></div>
              <div>MPC Active: <strong className="text-emerald-300">{metrics.activeVaults} Protected</strong></div>
              <div>FIPS 140-3 L4: <strong className="text-emerald-400">{metrics.fipsLevel4} Hardware</strong></div>
              <div>Key Reconstruction: <strong className="text-emerald-400">NEVER (0%)</strong></div>
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
            onClick={() => setActiveTab("VAULTS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "VAULTS"
                ? "bg-emerald-600 text-white font-black shadow-lg shadow-emerald-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Share2 size={15} /> MPC Key Vaults ({vaults.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("SANDBOX")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "SANDBOX"
                ? "bg-emerald-600 text-white font-black shadow-lg shadow-emerald-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Zap size={15} /> Threshold Signature Sandbox
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("STANDARDS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "STANDARDS"
                ? "bg-emerald-600 text-white font-black shadow-lg shadow-emerald-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <ShieldCheck size={15} /> FIPS 140-3 Standards ({standards.length})
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-emerald-600/20"
        >
          <PlusCircle size={15} /> Provision MPC Key Vault
        </button>
      </div>

      {/* 3. VAULTS TAB */}
      {activeTab === "VAULTS" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">Sovereign MPC Key Custody & FIPS 140-3 HSM Clusters</h3>
              <p className="text-xs text-slate-400 font-mono">Shamir threshold schemes, HSM models, sovereign regions, and key quorum states</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3">Vault ID</th>
                  <th className="p-3">Vault Name & MPC Scheme</th>
                  <th className="p-3">HSM Hardware Model</th>
                  <th className="p-3">Sovereignty Region</th>
                  <th className="p-3">Key Quorum State</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {vaults.map((v, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/60">
                    <td className="p-3 font-bold text-emerald-400">{v.vaultId}</td>
                    <td className="p-3 font-sans">
                      <div className="font-semibold text-white">{v.vaultName}</div>
                      <div className="text-[10px] text-emerald-300 font-mono">{v.mpcScheme}</div>
                    </td>
                    <td className="p-3 text-slate-400 font-mono text-[10px]">{v.hsmModel}</td>
                    <td className="p-3 text-slate-400 font-mono text-[10px]">{v.sovereigntyRegion}</td>
                    <td className="p-3 font-bold text-emerald-400 font-mono text-[10px]">{v.keyQuorumState}</td>
                    <td className="p-3 text-right font-sans">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          v.vaultStatus === "MPC_KEY_CUSTODY_ACTIVE"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        {v.vaultStatus}
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
                <Zap size={18} className="text-emerald-400" /> Threshold Signature Signing Sandbox
              </h3>
            </div>

            <form onSubmit={handleRunSignatureSim} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Target MPC Key Vault:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans"
                  value={selectedVaultId}
                  onChange={(e) => setSelectedVaultId(e.target.value)}
                >
                  {vaults.map((v) => (
                    <option key={v.vaultId} value={v.vaultId}>
                      {v.vaultId} - {v.vaultName}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-lg shadow-emerald-600/20"
              >
                <Share2 size={16} /> Execute Threshold Multi-Party Key Signature
              </button>
            </form>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-400" /> Threshold Cryptographic Signature Output
              </h3>
            </div>

            {simResult ? (
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-sans font-bold uppercase">Threshold Signature Result:</span>
                  <div className="text-[10px] text-emerald-300 break-all">{simResult.thresholdSignatureResult}</div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px] p-3 bg-slate-950/60 rounded-xl border border-slate-800 font-sans">
                  <div>Quorum Participated: <strong className="text-emerald-400">{simResult.quorumSharesParticipated} of {simResult.thresholdRequired} Shares</strong></div>
                  <div>Master Key Reassembled: <strong className="text-emerald-400">FALSE (0% EXPOSED)</strong></div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-2xl">
                Click "Execute Threshold Multi-Party Key Signature" to simulate threshold MPC signing without reassembling master keys.
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
              <h3 className="text-base font-bold text-white">FIPS 140-3 Level 4 & NIST Key Management Standards</h3>
              <p className="text-xs text-slate-400 font-mono">Specifications for tamper-resistant hardware security modules and multi-party secret sharing</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {standards.map((s, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-bold">
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
                <Share2 size={18} className="text-emerald-400" /> Provision MPC Key Vault
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleProvisionVault} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Vault Name:</label>
                <input
                  type="text"
                  placeholder="e.g. Clinical EHR Cryptographic Key Vault"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans"
                  value={vaultName}
                  onChange={(e) => setVaultName(e.target.value)}
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
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition shadow-lg shadow-emerald-600/20"
                >
                  Provision Sovereign Vault
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
