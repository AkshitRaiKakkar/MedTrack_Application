import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  RotateCw,
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
  HardDrive,
  Trash2,
  AlertOctagon
} from "lucide-react";
import {
  getKeyLifecyclePqcInventory,
  executeKeyZeroization,
  rotatePqcKey,
  getKeyLifecyclePqcStandards
} from "../../services/BiomedicalKeyLifecyclePqcService";
import "../../pages/auth/auth.css";

/**
 * BiomedicalKeyLifecyclePqcPanel Component
 * 
 * Biomedical Key Lifecycle & PQC Cryptographic Zeroization Console.
 * Features:
 * 1. Post-Quantum Key Inventory & FIPS 140-3 HSM Slot Matrix
 * 2. Instant Cryptographic Zeroization & Hardware Purge Auditor Sandbox
 * 3. NIST SP 800-57 & FIPS 140-3 Standards
 * 4. PQC Key Rotation & Generation Modal
 */
export default function BiomedicalKeyLifecyclePqcPanel() {
  // State
  const [keys, setKeys] = useState([]);
  const [standards, setStandards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("KEYS"); // "KEYS" | "SANDBOX" | "STANDARDS"

  // Sandbox State
  const [selectedKeyId, setSelectedKeyId] = useState("PQC-KEY-1801");
  const [zeroizeResult, setZeroizeResult] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [keyAlias, setKeyAlias] = useState("");

  // Load telemetry
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [keyList, stdList] = await Promise.all([
        getKeyLifecyclePqcInventory().catch(() => []),
        getKeyLifecyclePqcStandards().catch(() => [])
      ]);

      setKeys(keyList);
      setStandards(stdList);
    } catch (err) {
      console.error("Failed to load biomedical key lifecycle PQC data:", err);
      setMessage({ type: "error", text: "Failed connecting to Key Lifecycle PQC service." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Run Cryptographic Zeroization
  const handleZeroizeKey = async (e) => {
    e?.preventDefault();
    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const result = await executeKeyZeroization(selectedKeyId);
      setZeroizeResult(result);
      setMessage({ type: "success", text: `FIPS 140-3 Cryptographic Zeroization executed! Key ${result.keyId} memory purged with ${result.overwritePassesCount} overwrite passes.` });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "Cryptographic zeroization failed." });
    } finally {
      setActionLoading(false);
    }
  };

  // Rotate PQC Key
  const handleRotateKey = async (e) => {
    e.preventDefault();
    if (!keyAlias.trim()) return;

    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const newKey = await rotatePqcKey({ keyAlias: keyAlias.trim() });

      setKeyAlias("");
      setIsModalOpen(false);
      setMessage({ type: "success", text: `PQC Key ${newKey.keyId} generated and loaded into FIPS 140-3 HSM!` });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "Failed to rotate PQC key." });
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const totalKeys = keys.length;
    const activeKeys = keys.filter((k) => k.keyState.includes("ACTIVE")).length;
    const minDays = Math.min(...keys.map((k) => k.daysUntilRotation));

    return { totalKeys, activeKeys, minDays };
  }, [keys]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* 1. Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-slate-100">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1.5 font-mono">
                <RotateCw size={12} /> KEY LIFECYCLE & PQC ZEROIZATION
              </span>
              <span className="px-3 py-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1 font-mono">
                <ShieldCheck size={12} /> FIPS 140-3 LEVEL 4
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Biomedical Key Lifecycle & PQC Zeroization
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Post-Quantum Cryptographic (ML-KEM-1024 / ML-DSA-874) key lifecycle automation, FIPS 140-3 hardware zeroization (7-pass memory purge), and NIST SP 800-57 cryptoperiod management.
            </p>
          </div>

          {/* Telemetry Widget */}
          <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl w-full lg:w-auto text-xs space-y-2">
            <div className="flex items-center justify-between gap-6 font-mono">
              <span className="text-slate-400 font-sans font-bold uppercase text-[10px]">HSM Key Telemetry</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                CRYPTOPERIOD INTACT
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-700/80 font-mono text-[11px]">
              <div>PQC Keys: <strong className="text-white">{metrics.totalKeys} Managed</strong></div>
              <div>Next Rotation: <strong className="text-emerald-400">{metrics.minDays} Days</strong></div>
              <div>HSM Zeroization: <strong className="text-emerald-400">HARDWARE READY</strong></div>
              <div>Algorithms: <strong className="text-emerald-400">FIPS 203 / 204</strong></div>
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
            onClick={() => setActiveTab("KEYS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "KEYS"
                ? "bg-emerald-600 text-white font-black shadow-lg shadow-emerald-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Key size={15} /> PQC Cryptographic Keys ({keys.length})
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
            <Zap size={15} /> FIPS 140-3 Zeroization Sandbox
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
            <ShieldCheck size={15} /> NIST SP 800-57 & FIPS 140-3 ({standards.length})
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-emerald-600/20"
        >
          <RotateCw size={15} /> Rotate & Generate PQC Key
        </button>
      </div>

      {/* 3. KEYS TAB */}
      {activeTab === "KEYS" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">Post-Quantum Cryptographic Key & HSM Inventory</h3>
              <p className="text-xs text-slate-400 font-mono">Key IDs, aliases, PQC algorithms, HSM slots, cryptoperiod rotation schedules, and zeroization status</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3">Key ID</th>
                  <th className="p-3">Key Alias & Algorithm</th>
                  <th className="p-3">HSM Slot</th>
                  <th className="p-3">Rotation Schedule</th>
                  <th className="p-3 text-right">Key State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {keys.map((k, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/60">
                    <td className="p-3 font-bold text-emerald-400">{k.keyId}</td>
                    <td className="p-3 font-sans">
                      <div className="font-semibold text-white">{k.keyAlias}</div>
                      <div className="text-[10px] text-emerald-300 font-mono">{k.cryptographicAlgorithm}</div>
                    </td>
                    <td className="p-3 text-slate-400 font-mono text-[10px]">{k.hsmSlotId}</td>
                    <td className="p-3 text-emerald-400 font-bold text-[10px]">
                      {k.daysUntilRotation} Days Remaining (Every {k.rotationScheduleDays}d)
                    </td>
                    <td className="p-3 text-right font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {k.keyState}
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
                <AlertOctagon size={18} className="text-red-400" /> FIPS 140-3 Hardware Zeroization Inspector
              </h3>
            </div>

            <form onSubmit={handleZeroizeKey} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Target Key for Cryptographic Zeroization:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-sans"
                  value={selectedKeyId}
                  onChange={(e) => setSelectedKeyId(e.target.value)}
                >
                  {keys.map((k) => (
                    <option key={k.keyId} value={k.keyId}>
                      {k.keyId} - {k.keyAlias}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-lg shadow-red-600/20"
              >
                <Trash2 size={16} /> Execute Instant FIPS 140-3 Key Zeroization
              </button>
            </form>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-400" /> Zeroization Output
              </h3>
            </div>

            {zeroizeResult ? (
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-sans font-bold uppercase">Zeroization Status:</span>
                  <div className="text-sm font-bold text-emerald-400">{zeroizeResult.zeroizationStatus}</div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px] p-3 bg-slate-950/60 rounded-xl border border-slate-800 font-sans">
                  <div>Overwrite Passes: <strong className="text-emerald-400 font-mono text-[10px]">{zeroizeResult.overwritePassesCount} Passes</strong></div>
                  <div>HSM RAM Purge: <strong className="text-emerald-400">{zeroizeResult.hsmZeroizeConfirmation}</strong></div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-2xl">
                Click "Execute Instant FIPS 140-3 Key Zeroization" to test destruction procedures.
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
              <h3 className="text-base font-bold text-white">NIST SP 800-57 & FIPS 140-3 Standards</h3>
              <p className="text-xs text-slate-400 font-mono">Frameworks for key management lifecycles, hardware zeroization, and post-quantum cryptography standards</p>
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
                <RotateCw size={18} className="text-emerald-400" /> Rotate & Generate PQC Key
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRotateKey} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Key Alias / Description:</label>
                <input
                  type="text"
                  placeholder="e.g. Surgical Robotics Tele-Control Key"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans"
                  value={keyAlias}
                  onChange={(e) => setKeyAlias(e.target.value)}
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
                  Generate Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
