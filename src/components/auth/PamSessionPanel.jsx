import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  UserCheck,
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
  Activity,
  Network,
  Smartphone,
  Globe,
  SlidersHorizontal,
  Video,
  KeyRound,
  ShieldAlert,
  Slash,
  Clock
} from "lucide-react";
import {
  getPamSessions,
  requestJitElevation,
  terminatePamSession,
  getPamVaultPolicy
} from "../../services/PamSessionService";
import "../../pages/auth/auth.css";

/**
 * PamSessionPanel Component
 * 
 * Privileged Access Management (PAM) & Zero-Trust Session Recording Console.
 * Features:
 * 1. Real-Time Admin SSH / RDP Session Recording & Keystroke Audit Stream
 * 2. Just-In-Time (JIT) Ephemeral Access Elevation Engine
 * 3. Break-Glass Emergency Root Access Dual-Control Protocol
 * 4. Immediate Session Termination & Vault Credential Rotation
 */
export default function PamSessionPanel() {
  // State
  const [sessions, setSessions] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("SESSIONS"); // "SESSIONS" | "POLICIES"

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [operator, setOperator] = useState("");
  const [targetHost, setTargetHost] = useState("");
  const [accessRole, setAccessRole] = useState("SYSADMIN_TEMPORARY");
  const [durationMinutes, setDurationMinutes] = useState(30);

  // Load telemetry
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [sessList, polList] = await Promise.all([
        getPamSessions().catch(() => []),
        getPamVaultPolicy().catch(() => [])
      ]);

      setSessions(sessList);
      setPolicies(polList);
    } catch (err) {
      console.error("Failed to load PAM session data:", err);
      setMessage({ type: "error", text: "Failed connecting to PAM service." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Terminate Session
  const handleTerminateSession = async (sessionId) => {
    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const result = await terminatePamSession(sessionId);
      setMessage({ type: "success", text: `PAM Session ${sessionId} forcibly terminated! Credentials rotated.` });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "Session termination failed." });
    } finally {
      setActionLoading(false);
    }
  };

  // Request JIT Access
  const handleRequestJit = async (e) => {
    e.preventDefault();
    if (!targetHost.trim()) return;

    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const newSess = await requestJitElevation({
        operator: operator.trim() || "admin.user@medtrack.org",
        targetHost: targetHost.trim(),
        accessRole,
        durationMinutes: parseInt(durationMinutes, 10)
      });

      setTargetHost("");
      setIsModalOpen(false);
      setMessage({ type: "success", text: `JIT Privileged Session ${newSess.sessionId} approved & recording!` });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "Failed to request JIT access." });
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const totalSessions = sessions.length;
    const liveCount = sessions.filter((s) => s.sessionRecordingState === "LIVE_RECORDING").length;
    const anomalyCount = sessions.filter((s) => s.sessionRecordingState.includes("ANOMALY")).length;

    return { totalSessions, liveCount, anomalyCount };
  }, [sessions]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* 1. Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-slate-100">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center gap-1.5 font-mono">
                <UserCheck size={12} /> PAM & JIT ELEVATION
              </span>
              <span className="px-3 py-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1 font-mono">
                <Video size={12} /> KEYSTROKE & VIDEO RECORDING
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Privileged Access Management (PAM) & Session Console
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Just-In-Time (JIT) ephemeral admin elevation, zero-trust SSH/RDP session keystroke recording, break-glass emergency credential vaulting, and immediate session termination.
            </p>
          </div>

          {/* Telemetry Widget */}
          <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl w-full lg:w-auto text-xs space-y-2">
            <div className="flex items-center justify-between gap-6 font-mono">
              <span className="text-slate-400 font-sans font-bold uppercase text-[10px]">PAM Telemetry</span>
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                VAULT SECURE
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-700/80 font-mono text-[11px]">
              <div>Total Sessions: <strong className="text-white">{metrics.totalSessions} Audited</strong></div>
              <div>Live Recording: <strong className="text-amber-300">{metrics.liveCount} Active</strong></div>
              <div>Anomaly Alerts: <strong className="text-red-400">{metrics.anomalyCount} Flagged</strong></div>
              <div>JIT Status: <strong className="text-emerald-400">ENFORCED</strong></div>
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
            onClick={() => setActiveTab("SESSIONS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "SESSIONS"
                ? "bg-amber-600 text-white font-black shadow-lg shadow-amber-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Video size={15} /> Privileged Sessions ({sessions.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("POLICIES")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "POLICIES"
                ? "bg-amber-600 text-white font-black shadow-lg shadow-amber-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Lock size={15} /> Vault & Break-Glass Policy ({policies.length})
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-amber-600/20"
        >
          <PlusCircle size={15} /> Request JIT Access
        </button>
      </div>

      {/* 3. SESSIONS TAB */}
      {activeTab === "SESSIONS" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">Privileged Sessions & Keystroke Audit Stream</h3>
              <p className="text-xs text-slate-400 font-mono">SSH, RDP, and KubeCTL Bastion admin access logs with real-time recording</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3">Session ID</th>
                  <th className="p-3">Operator & Target Host</th>
                  <th className="p-3">Access Role & Protocol</th>
                  <th className="p-3">Recording State</th>
                  <th className="p-3">Approval</th>
                  <th className="p-3 text-right">Emergency Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {sessions.map((s, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/60">
                    <td className="p-3 font-bold text-amber-400">{s.sessionId}</td>
                    <td className="p-3 font-sans">
                      <div className="font-semibold text-white">{s.operator}</div>
                      <div className="text-[10px] text-amber-300 font-mono">{s.targetHost}</div>
                    </td>
                    <td className="p-3 text-slate-400 font-mono text-[10px]">
                      <div>{s.accessRole}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{s.protocol}</div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          s.sessionRecordingState === "LIVE_RECORDING"
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse"
                            : s.sessionRecordingState.includes("ANOMALY")
                            ? "bg-red-500/20 text-red-400 border border-red-500/30"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {s.sessionRecordingState}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {s.approvalStatus}
                      </span>
                    </td>
                    <td className="p-3 text-right font-sans">
                      {s.sessionRecordingState === "LIVE_RECORDING" ? (
                        <button
                          type="button"
                          onClick={() => handleTerminateSession(s.sessionId)}
                          disabled={actionLoading}
                          className="px-2.5 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold rounded text-[10px] transition border border-red-500/30 flex items-center gap-1 ml-auto"
                        >
                          <Slash size={12} /> Kill Session
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-mono">ARCHIVED</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. POLICIES TAB */}
      {activeTab === "POLICIES" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">PAM Vault Security & Break-Glass Controls</h3>
              <p className="text-xs text-slate-400 font-mono">Root credential vaulting rules and dual-control approval policies</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {policies.map((p, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded font-bold">
                    {p.policy}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white">{p.policy}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{p.requirement}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. REQUEST MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full text-slate-100 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserCheck size={18} className="text-amber-400" /> Request JIT Privileged Access
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRequestJit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Operator Email:</label>
                <input
                  type="email"
                  placeholder="e.g. admin.user@medtrack.org"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-sans"
                  value={operator}
                  onChange={(e) => setOperator(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Target Host Endpoint:</label>
                <input
                  type="text"
                  placeholder="e.g. prod-db-ehr-cluster-01.medtrack.internal"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  value={targetHost}
                  onChange={(e) => setTargetHost(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Elevation Role:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  value={accessRole}
                  onChange={(e) => setAccessRole(e.target.value)}
                >
                  <option value="SYSADMIN_TEMPORARY">SYSADMIN_TEMPORARY</option>
                  <option value="DBA_SUPERUSER_ELEVATED">DBA_SUPERUSER_ELEVATED</option>
                  <option value="CLUSTER_ADMIN_TEMPORARY">CLUSTER_ADMIN_TEMPORARY</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">JIT Duration (Minutes):</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                >
                  <option value={15}>15 Minutes</option>
                  <option value={30}>30 Minutes</option>
                  <option value={60}>60 Minutes</option>
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
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition shadow-lg shadow-amber-600/20"
                >
                  Approve JIT Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
