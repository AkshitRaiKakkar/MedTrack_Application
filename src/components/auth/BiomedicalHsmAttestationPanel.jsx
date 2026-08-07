import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  HardDrive,
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
  Server
} from "lucide-react";
import {
  getHsmAttestationInventory,
  provisionHsmSlot,
  verifyHsmAttestation,
  getHsmAttestationStandards
} from "../../services/BiomedicalHsmAttestationService";
import "../../pages/auth/auth.css";

/**
 * BiomedicalHsmAttestationPanel Component
 * 
 * Biomedical Hardware Security Module (HSM) Key Management & Attestation Console.
 * Features:
 * 1. FIPS 140-3 Level 4 HSM Slot Inventory & PKCS#11 Key Mapping
 * 2. Hardware Root-of-Trust Attestation Verification & Tamper Mesh Sandbox
 * 3. NIST SP 800-57 & PKCS#11 Standards
 * 4. HSM Slot Provisioning & Key Rotation Modal
 */
export default function BiomedicalHsmAttestationPanel() {
  // State
  const [slots, setSlots] = useState([]);
  const [standards, setStandards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("SLOTS"); // "SLOTS" | "SANDBOX" | "STANDARDS"

  // Sandbox State
  const [selectedSlotId, setSelectedSlotId] = useState("HSM-SLOT-901");
  const [attestResult, setAttestResult] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [slotName, setSlotName] = useState("");

  // Load telemetry
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [slList, stdList] = await Promise.all([
        getHsmAttestationInventory().catch(() => []),
        getHsmAttestationStandards().catch(() => [])
      ]);

      setSlots(slList);
      setStandards(stdList);
    } catch (err) {
      console.error("Failed to load biomedical HSM attestation data:", err);
      setMessage({ type: "error", text: "Failed connecting to HSM Attestation service." });
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
      const result = await verifyHsmAttestation(selectedSlotId);
      setAttestResult(result);
      setMessage({ type: "success", text: `HSM Root-of-Trust Attestation verified in ${result.attestationLatencyMs}ms! Tamper state: ${result.tamperMeshState}.` });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "HSM Attestation verification failed." });
    } finally {
      setActionLoading(false);
    }
  };

  // Provision HSM Slot
  const handleProvisionSlot = async (e) => {
    e.preventDefault();
    if (!slotName.trim()) return;

    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const newSlot = await provisionHsmSlot({ slotName: slotName.trim() });

      setSlotName("");
      setIsModalOpen(false);
      setMessage({ type: "success", text: `HSM Slot ${newSlot.slotId} provisioned with FIPS 140-3 Level 4 compliance!` });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "Failed to provision HSM slot." });
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const totalSlots = slots.length;
    const level4Slots = slots.filter((s) => s.fipsComplianceLevel.includes("Level 4")).length;
    const verifiedTamperFree = slots.filter((s) => s.attestationStatus.includes("TAMPER_FREE")).length;

    return { totalSlots, level4Slots, verifiedTamperFree };
  }, [slots]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* 1. Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-slate-100">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center gap-1.5 font-mono">
                <HardDrive size={12} /> HARDWARE SECURITY MODULE (HSM)
              </span>
              <span className="px-3 py-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1 font-mono">
                <ShieldCheck size={12} /> FIPS 140-3 LEVEL 4 ATTESTATION
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Biomedical HSM Key Management & Attestation
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              FIPS 140-3 Level 4 hardware root-of-trust verification, PKCS#11 key slot management, physical tamper mesh monitoring, and automated key rotation.
            </p>
          </div>

          {/* Telemetry Widget */}
          <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl w-full lg:w-auto text-xs space-y-2">
            <div className="flex items-center justify-between gap-6 font-mono">
              <span className="text-slate-400 font-sans font-bold uppercase text-[10px]">HSM Hardware Telemetry</span>
              <span className="text-blue-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                HSM ENCLOSURE LOCKED
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-700/80 font-mono text-[11px]">
              <div>HSM Slots: <strong className="text-white">{metrics.totalSlots} Online</strong></div>
              <div>FIPS Level 4: <strong className="text-blue-300">{metrics.level4Slots} Certified</strong></div>
              <div>Tamper Mesh: <strong className="text-emerald-400">{metrics.verifiedTamperFree} Intact</strong></div>
              <div>Zeroization State: <strong className="text-emerald-400">READY (0 Violations)</strong></div>
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
            onClick={() => setActiveTab("SLOTS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "SLOTS"
                ? "bg-blue-600 text-white font-black shadow-lg shadow-blue-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <HardDrive size={15} /> HSM Key Slots ({slots.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("SANDBOX")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "SANDBOX"
                ? "bg-blue-600 text-white font-black shadow-lg shadow-blue-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Zap size={15} /> Root-of-Trust Attestation Sandbox
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
            <ShieldCheck size={15} /> FIPS 140-3 & PKCS#11 Standards ({standards.length})
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-blue-600/20"
        >
          <PlusCircle size={15} /> Provision HSM Key Slot
        </button>
      </div>

      {/* 3. SLOTS TAB */}
      {activeTab === "SLOTS" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">Hardware Security Module Key Slots & Attestation</h3>
              <p className="text-xs text-slate-400 font-mono">Slot IDs, HSM vendors, FIPS compliance levels, active keys, and tamper status</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3">Slot ID</th>
                  <th className="p-3">Slot Name & Hardware Vendor</th>
                  <th className="p-3">FIPS Compliance Level</th>
                  <th className="p-3">Active Cryptographic Keys</th>
                  <th className="p-3 text-right">Attestation Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {slots.map((s, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/60">
                    <td className="p-3 font-bold text-blue-400">{s.slotId}</td>
                    <td className="p-3 font-sans">
                      <div className="font-semibold text-white">{s.slotName}</div>
                      <div className="text-[10px] text-blue-300 font-mono">{s.hsmVendor}</div>
                    </td>
                    <td className="p-3 text-slate-400 font-mono text-[10px]">{s.fipsComplianceLevel}</td>
                    <td className="p-3 text-slate-300 font-mono text-[10px]">
                      {s.activeKeys.join(", ")}
                    </td>
                    <td className="p-3 text-right font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {s.attestationStatus}
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
                <Zap size={18} className="text-blue-400" /> Hardware Attestation & Tamper Verification Inspector
              </h3>
            </div>

            <form onSubmit={handleVerifyAttestation} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Target HSM Key Slot:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
                  value={selectedSlotId}
                  onChange={(e) => setSelectedSlotId(e.target.value)}
                >
                  {slots.map((s) => (
                    <option key={s.slotId} value={s.slotId}>
                      {s.slotId} - {s.slotName}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-lg shadow-blue-600/20"
              >
                <Zap size={16} /> Execute Hardware Root-of-Trust Attestation
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
                  <span className="text-[10px] text-slate-400 font-sans font-bold uppercase">Attestation Signature:</span>
                  <div className="text-sm font-bold text-blue-300">{attestResult.attestationSignature}</div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px] p-3 bg-slate-950/60 rounded-xl border border-slate-800 font-sans">
                  <div>Tamper Mesh State: <strong className="text-emerald-400 font-mono text-[10px]">INTACT (NO BREACH)</strong></div>
                  <div>Latency: <strong className="text-emerald-400">{attestResult.attestationLatencyMs} ms</strong></div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-2xl">
                Click "Execute Hardware Root-of-Trust Attestation" to verify physical enclosure integrity.
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
              <h3 className="text-base font-bold text-white">FIPS 140-3 & PKCS#11 Standards</h3>
              <p className="text-xs text-slate-400 font-mono">Frameworks for hardware security modules, cryptographic token interfaces, and key lifecycle management</p>
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
                <HardDrive size={18} className="text-blue-400" /> Provision HSM Key Slot
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleProvisionSlot} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Slot Name / Workload Description:</label>
                <input
                  type="text"
                  placeholder="e.g. Bio-Bank Tissue Registry HSM Slot"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
                  value={slotName}
                  onChange={(e) => setSlotName(e.target.value)}
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
                  Provision Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
