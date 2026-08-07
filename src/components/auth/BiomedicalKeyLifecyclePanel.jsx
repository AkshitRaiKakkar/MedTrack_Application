import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Key,
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
  UserCheck,
  Activity,
  Smartphone,
  Globe,
  SlidersHorizontal,
  Zap,
  Check,
  Binary,
  RotateCw,
  Trash2
} from "lucide-react";
import {
  getKeyLifecycleInventory,
  generatePqcKeyPair,
  rotateAndZeroizeKey,
  getKeyLifecycleStandards
} from "../../services/BiomedicalKeyLifecycleService";
import "../../pages/auth/auth.css";

/**
 * BiomedicalKeyLifecyclePanel Component
 * 
 * Biomedical Sovereign Cryptographic Key Custody & Post-Quantum Key Lifecycle Console.
 * Features:
 * 1. NIST SP 800-57 Part 1 Rev 5 Cryptographic Key Lifecycle Management
 * 2. FIPS 203 (ML-KEM/Kyber-1024) & FIPS 204 (ML-DSA/Dilithium-5) Post-Quantum Key Rotation
 * 3. DoD 5220.22-M & NIST SP 800-88 Cryptographic Erasure & Zeroization
 * 4. Key Rotation & Zeroization Sandbox & PQC Key Generation Modal
 */
export default function BiomedicalKeyLifecyclePanel() {
  // State
  const [keys, setKeys] = useState([]);
  const [standards, setStandards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("KEYS"); // "KEYS" | "ROTATION" | "STANDARDS"

  // Sandbox State
  const [selectedKeyId, setSelectedKeyId] = useState("KEY-LFC-301");
  const [rotationResult, setRotationResult] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [keyName, setKeyName] = useState("");

  // Load telemetry
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [keyList, stdList] = await Promise.all([
        getKeyLifecycleInventory().catch(() => []),
        getKeyLifecycleStandards().catch(() => [])
      ]);

      setKeys(keyList);
      setStandards(stdList);
    } catch (err) {
      console.error("Failed to load biomedical key lifecycle data:", err);
      setMessage({ type: "error", text: "Failed connecting to Cryptographic Key Lifecycle service." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Run Rotation & Zeroization
  const handleRotateKey = async (e) => {
    e?.preventDefault();
    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const result = await rotateAndZeroizeKey(selectedKeyId);
      setRotationResult(result);
      setMessage({ type: "success", text: `PQC Key rotated in ${result.rotationLatencyMs}ms! Legacy key zeroized with DoD 5220.22-M protocol.` });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "Key rotation and zeroization failed." });
    } finally {
      setActionLoading(false);
    }
  };

  // Generate Key
  const handleGenerateKey = async (e) => {
    e.preventDefault();
    if (!keyName.trim()) return;

    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const newKey = await generatePqcKeyPair({ keyName: keyName.trim() });

      setKeyName("");
      setIsModalOpen(false);
      setMessage({ type: "success", text: `PQC Key ${newKey.keyId} provisioned with CRYSTALS-Kyber-1024!` });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "Failed to generate PQC key pair." });
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const totalKeys = keys.length;
    const activeKeys = keys.filter((k) => k.lifecycleState === "ACTIVE_IN_USE").length;
    const pqcCompliant = keys.filter((k) => k.cryptoAlgorithm.includes("CRYSTALS") || k.cryptoAlgorithm.includes("PQC")).length;

    return { totalKeys, activeKeys, pqcCompliant };
  }, [keys]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* 1. Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-slate-100">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center gap-1.5 font-mono">
                <Key size={12} /> CRYPTOGRAPHIC KEY LIFECYCLE & PQC CUSTODY
              </span>
              <span className="px-3 py-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1 font-mono">
                <ShieldCheck size={12} /> NIST SP 800-57 & FIPS 203/204
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Sovereign Cryptographic Key Lifecycle & PQC Custody
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              NIST SP 800-57 key management, CRYSTALS-Kyber-1024 / Dilithium-5 post-quantum key generation, automated rotation schedules, and DoD 5220.22-M cryptographic zeroization.
            </p>
          </div>

          {/* Telemetry Widget */}
          <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl w-full lg:w-auto text-xs space-y-2">
            <div className="flex items-center justify-between gap-6 font-mono">
              <span className="text-slate-400 font-sans font-bold uppercase text-[10px]">Key Vault Telemetry</span>
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                HSM ROTATION ACTIVE
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-700/80 font-mono text-[11px]">
              <div>Managed Keys: <strong className="text-white">{metrics.totalKeys} Cataloged</strong></div>
              <div>Active Keys: <strong className="text-amber-300">{metrics.activeKeys} Operational</strong></div>
              <div>Post-Quantum PQC: <strong className="text-emerald-400">{metrics.pqcCompliant} Enforced</strong></div>
              <div>Zeroization: <strong className="text-emerald-400">DoD 5220.22-M</strong></div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        {message.text && (
          <div
            className={`mt-6 p-4 rounded-xl text-sm font-medium flex items-center justify-between border ${
              message.type === "error"
                ? "bg-red-500/10 border-red-500/30 text-red-400"
                : "bg-amber-500/10 border-amber-500/30 text-amber-400"
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
            onClick={() => setActiveTab("KEYS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "KEYS"
                ? "bg-amber-600 text-white font-black shadow-lg shadow-amber-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Key size={15} /> Cryptographic Key Inventory ({keys.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ROTATION")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "ROTATION"
                ? "bg-amber-600 text-white font-black shadow-lg shadow-amber-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <RotateCw size={15} /> PQC Rotation & Zeroization Sandbox
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("STANDARDS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "STANDARDS"
                ? "bg-amber-600 text-white font-black shadow-lg shadow-amber-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <ShieldCheck size={15} /> NIST SP 800-57 & FIPS Standards ({standards.length})
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-amber-600/20"
        >
          <PlusCircle size={15} /> Provision Post-Quantum Key
        </button>
      </div>

      {/* 3. KEYS TAB */}
      {activeTab === "KEYS" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">Cryptographic Key Inventory & Rotation Schedules</h3>
              <p className="text-xs text-slate-400 font-mono">Algorithms, lifecycle states, rotation intervals, FIPS compliance levels, and escrow quorum policies</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3">Key ID</th>
                  <th className="p-3">Key Name & Algorithm</th>
                  <th className="p-3">Lifecycle State</th>
                  <th className="p-3">Rotation Schedule</th>
                  <th className="p-3">FIPS Compliance Level</th>
                  <th className="p-3 text-right">Escrow Custody</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {keys.map((k, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/60">
                    <td className="p-3 font-bold text-amber-400">{k.keyId}</td>
                    <td className="p-3 font-sans">
                      <div className="font-semibold text-white">{k.keyName}</div>
                      <div className="text-[10px] text-amber-300 font-mono">{k.cryptoAlgorithm}</div>
                    </td>
                    <td className="p-3 font-bold text-emerald-400 text-[10px]">{k.lifecycleState}</td>
                    <td className="p-3 text-slate-400 font-mono text-[10px]">
                      {k.daysUntilRotation} days left ({k.rotationFrequencyDays}d interval)
                    </td>
                    <td className="p-3 text-slate-400 font-mono text-[10px]">{k.fipsCompliance}</td>
                    <td className="p-3 text-right font-sans text-[10px] text-slate-300">{k.escrowPolicy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. ROTATION TAB */}
      {activeTab === "ROTATION" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <RotateCw size={18} className="text-amber-400" /> PQC Key Rotation & Zeroization Engine
              </h3>
            </div>

            <form onSubmit={handleRotateKey} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Target Cryptographic Key:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-sans"
                  value={selectedKeyId}
                  onChange={(e) => setSelectedKeyId(e.target.value)}
                >
                  {keys.map((k) => (
                    <option key={k.keyId} value={k.keyId}>
                      {k.keyId} - {k.keyName}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-lg shadow-amber-600/20"
              >
                <RotateCw size={16} /> Execute PQC Key Rotation & Zeroize Retired Bytes
              </button>
            </form>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-400" /> Rotation & Erasure Output
              </h3>
            </div>

            {rotationResult ? (
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-sans font-bold uppercase">New PQC Public Key Fingerprint:</span>
                  <div className="text-[10px] text-amber-300 break-all">{rotationResult.newPqcFingerprint}</div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px] p-3 bg-slate-950/60 rounded-xl border border-slate-800 font-sans">
                  <div>Zeroization: <strong className="text-emerald-400 font-mono text-[10px]">{rotationResult.zeroizationMethod}</strong></div>
                  <div>Rotation Speed: <strong className="text-emerald-400">{rotationResult.rotationLatencyMs} ms</strong></div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-2xl">
                Click "Execute PQC Key Rotation & Zeroize Retired Bytes" to perform post-quantum key rotation.
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
              <h3 className="text-base font-bold text-white">NIST SP 800-57 & FIPS 203/204 Standards</h3>
              <p className="text-xs text-slate-400 font-mono">Frameworks for key management lifecycle, post-quantum key encapsulation, and cryptographic zeroization</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {standards.map((s, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded font-bold">
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
                <Key size={18} className="text-amber-400" /> Provision Post-Quantum Key Pair
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleGenerateKey} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Key Description / Purpose:</label>
                <input
                  type="text"
                  placeholder="e.g. Clinical Trial Multi-Site Encryption Key"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-sans"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
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
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition shadow-lg shadow-amber-600/20"
                >
                  Generate PQC Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
