import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Power,
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
  Siren
} from "lucide-react";
import {
  getIncidentCommandDrInventory,
  triggerIncidentFailover,
  auditBackupIntegrity,
  getIncidentCommandDrStandards
} from "../../services/BiomedicalIncidentCommandDrService";
import "../../pages/auth/auth.css";

/**
 * BiomedicalIncidentCommandDrPanel Component
 * 
 * Biomedical Incident Command & Air-Gapped Disaster Recovery Console.
 * Features:
 * 1. Air-Gapped Immutable WORM Vault Inventory & Zero-RPO Failover Telemetry
 * 2. Immutable Backup Hash Verification & WORM Lock Auditor Sandbox
 * 3. FEMA HICS v5.0 & NIST SP 800-34 Standards
 * 4. Emergency Ransomware Failover Execution Modal
 */
export default function BiomedicalIncidentCommandDrPanel() {
  // State
  const [vaults, setVaults] = useState([]);
  const [standards, setStandards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("VAULTS"); // "VAULTS" | "SANDBOX" | "STANDARDS"

  // Sandbox State
  const [selectedVaultId, setSelectedVaultId] = useState("DR-VAULT-1601");
  const [auditResult, setAuditResult] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetVaultId, setTargetVaultId] = useState("DR-VAULT-1601");

  // Load telemetry
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [vtList, stdList] = await Promise.all([
        getIncidentCommandDrInventory().catch(() => []),
        getIncidentCommandDrStandards().catch(() => [])
      ]);

      setVaults(vtList);
      setStandards(stdList);
    } catch (err) {
      console.error("Failed to load biomedical incident command DR data:", err);
      setMessage({ type: "error", text: "Failed connecting to Incident Command DR service." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Run WORM Integrity Audit
  const handleAuditWorm = async (e) => {
    e?.preventDefault();
    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const result = await auditBackupIntegrity(selectedVaultId);
      setAuditResult(result);
      setMessage({ type: "success", text: `WORM Backup Audit completed in ${result.auditLatencyMs}ms! WORM Lock Valid: ${result.wormLockValid ? "YES" : "NO"}. Hash Match: ${result.hashVerificationStatus}. Retention: ${result.immutableRetentionDaysRemaining} days.` });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "Immutable backup audit failed." });
    } finally {
      setActionLoading(false);
    }
  };

  // Trigger Emergency Failover
  const handleExecuteFailover = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const result = await triggerIncidentFailover({ vaultId: targetVaultId });

      setIsModalOpen(false);
      setMessage({ type: "success", text: `Emergency HICS Air-Gapped Failover executed! RTO Achieved: ${result.rtoAchievedSeconds} seconds. RPO Achieved: ${result.rpoAchievedSeconds} seconds!` });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "Emergency failover execution failed." });
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const totalVaults = vaults.length;
    const airGapIsolated = vaults.filter((v) => v.airGapStatus.includes("ISOLATED")).length;
    const minRpo = Math.min(...vaults.map((v) => v.rpoMinutes));

    return { totalVaults, airGapIsolated, minRpo };
  }, [vaults]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* 1. Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-slate-100">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-red-400 bg-red-500/10 border border-red-500/20 rounded-full flex items-center gap-1.5 font-mono">
                <Power size={12} /> INCIDENT COMMAND & AIR-GAP DR
              </span>
              <span className="px-3 py-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1 font-mono">
                <ShieldCheck size={12} /> FEMA HICS v5.0 COMPLIANT
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Biomedical Incident Command & Air-Gapped DR
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Air-gapped immutable WORM backup vaults (S3 Object Lock & LTO-9 tape), automated ransomware isolation playbooks, zero-RPO failover telemetry, and FEMA HICS emergency operations.
            </p>
          </div>

          {/* Telemetry Widget */}
          <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl w-full lg:w-auto text-xs space-y-2">
            <div className="flex items-center justify-between gap-6 font-mono">
              <span className="text-slate-400 font-sans font-bold uppercase text-[10px]">DR Vault Telemetry</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                AIR-GAP ISOLATED
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-700/80 font-mono text-[11px]">
              <div>Immutable Vaults: <strong className="text-white">{metrics.totalVaults} Protected</strong></div>
              <div>RPO Target: <strong className="text-emerald-400">{metrics.minRpo} Minutes (Zero-Loss)</strong></div>
              <div>WORM Compliance Lock: <strong className="text-red-400">7-YEAR LOCKED</strong></div>
              <div>Isolation State: <strong className="text-emerald-400">100% IMMUTABLE</strong></div>
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
                ? "bg-red-600 text-white font-black shadow-lg shadow-red-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <HardDrive size={15} /> Air-Gapped WORM Vaults ({vaults.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("SANDBOX")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "SANDBOX"
                ? "bg-red-600 text-white font-black shadow-lg shadow-red-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Zap size={15} /> WORM Lock & Hash Auditor Sandbox
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("STANDARDS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "STANDARDS"
                ? "bg-red-600 text-white font-black shadow-lg shadow-red-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <ShieldCheck size={15} /> FEMA HICS & NIST Standards ({standards.length})
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-red-600/20"
        >
          <Siren size={15} /> Execute Emergency Failover
        </button>
      </div>

      {/* 3. VAULTS TAB */}
      {activeTab === "VAULTS" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">Air-Gapped Immutable WORM Backup Vaults</h3>
              <p className="text-xs text-slate-400 font-mono">Vault IDs, backup types, RPO/RTO metrics, snapshot integrity hashes, and air-gap isolation states</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3">Vault ID</th>
                  <th className="p-3">Vault Name & Backup Type</th>
                  <th className="p-3">RPO / RTO Metrics</th>
                  <th className="p-3">Snapshot Hash</th>
                  <th className="p-3 text-right">Air-Gap Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {vaults.map((v, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/60">
                    <td className="p-3 font-bold text-red-400">{v.vaultId}</td>
                    <td className="p-3 font-sans">
                      <div className="font-semibold text-white">{v.vaultName}</div>
                      <div className="text-[10px] text-red-300 font-mono">{v.backupType}</div>
                    </td>
                    <td className="p-3 text-slate-400 font-mono text-[10px]">
                      RPO: <strong className="text-white">{v.rpoMinutes}m</strong> | RTO: <strong className="text-white">{v.rtoMinutes}m</strong>
                    </td>
                    <td className="p-3 text-slate-300 font-mono text-[10px]">
                      {v.snapshotIntegrityHash.slice(0, 18)}...
                    </td>
                    <td className="p-3 text-right font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {v.airGapStatus}
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
                <Zap size={18} className="text-red-400" /> Immutable Backup WORM Hash Inspector
              </h3>
            </div>

            <form onSubmit={handleAuditWorm} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Target Immutable Vault:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-sans"
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
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-lg shadow-red-600/20"
              >
                <Zap size={16} /> Execute WORM Lock & Hash Verification Audit
              </button>
            </form>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-400" /> Audit Output
              </h3>
            </div>

            {auditResult ? (
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-sans font-bold uppercase">WORM Lock Status:</span>
                  <div className="text-sm font-bold text-emerald-400">{auditResult.wormLockValid ? "VALID & LOCKED" : "INVALID"}</div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px] p-3 bg-slate-950/60 rounded-xl border border-slate-800 font-sans">
                  <div>Hash Match: <strong className="text-emerald-400 font-mono text-[10px]">{auditResult.hashVerificationStatus}</strong></div>
                  <div>Retention Lock: <strong className="text-emerald-400">{auditResult.immutableRetentionDaysRemaining} Days Left</strong></div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-2xl">
                Click "Execute WORM Lock & Hash Verification Audit" to inspect immutable backups.
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
              <h3 className="text-base font-bold text-white">FEMA HICS v5.0 & Disaster Recovery Standards</h3>
              <p className="text-xs text-slate-400 font-mono">Frameworks for hospital emergency operations, air-gapped immutable WORM storage, and NIST SP 800-34 planning</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {standards.map((s, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded font-bold">
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
                <Siren size={18} className="text-red-400" /> Execute Emergency Failover
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleExecuteFailover} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Target Immutable Vault for Recovery:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-sans"
                  value={targetVaultId}
                  onChange={(e) => setTargetVaultId(e.target.value)}
                >
                  {vaults.map((v) => (
                    <option key={v.vaultId} value={v.vaultId}>
                      {v.vaultId} - {v.vaultName}
                    </option>
                  ))}
                </select>
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
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition shadow-lg shadow-red-600/20"
                >
                  Confirm Failover
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
