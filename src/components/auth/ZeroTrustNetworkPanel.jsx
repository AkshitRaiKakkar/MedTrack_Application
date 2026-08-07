import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ShieldCheck,
  Network,
  Cpu,
  Lock,
  Wifi,
  WifiOff,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Search,
  Download,
  Terminal,
  Clock,
  Sparkles,
  Zap,
  Layers,
  Database,
  X,
  Play,
  Activity,
  Server,
  Power
} from "lucide-react";
import {
  getActiveSdpTunnels,
  getMicrosegmentPolicies,
  evaluateDevicePosture,
  terminateSdpTunnel
} from "../../services/ZeroTrustNetworkService";
import "../../pages/auth/auth.css";

/**
 * ZeroTrustNetworkPanel Component
 * 
 * Zero-Trust Network Access (ZTNA) & Microsegmentation Command Center.
 * Provides real-time Software-Defined Perimeter (SDP) tunnel telemetry,
 * microsegment firewall policies, device posture evaluation, and mTLS verification.
 */
export default function ZeroTrustNetworkPanel() {
  // State
  const [tunnels, setTunnels] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("TUNNELS"); // "TUNNELS" | "POLICIES" | "POSTURE"
  const [searchTerm, setSearchTerm] = useState("");
  const [notification, setNotification] = useState({ type: "", message: "" });

  // Posture Evaluator State
  const [postureParams, setPostureParams] = useState({
    edrRunning: true,
    diskEncrypted: true,
    osPatchOutdated: false,
    firewallEnabled: true
  });
  const [postureResult, setPostureResult] = useState(null);

  // Modal State
  const [killTunnelTarget, setKillTunnelTarget] = useState(null);

  // Load Telemetry Data
  const loadZtnaData = useCallback(async () => {
    setLoading(true);
    try {
      const [tunnelsData, policiesData] = await Promise.all([
        getActiveSdpTunnels(),
        getMicrosegmentPolicies()
      ]);
      setTunnels(tunnelsData || []);
      setPolicies(policiesData || []);
    } catch (err) {
      console.error("Failed loading ZTNA telemetry:", err);
      setNotification({ type: "error", message: "Failed connecting to ZTNA SDP gateway." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadZtnaData();
  }, [loadZtnaData]);

  // Metrics
  const metrics = useMemo(() => {
    const totalTunnels = tunnels.length;
    const established = tunnels.filter((t) => t.status === "ESTABLISHED").length;
    const quarantined = tunnels.filter((t) => t.status === "QUARANTINED").length;
    const avgPosture = tunnels.length
      ? Math.round(tunnels.reduce((acc, t) => acc + t.postureScore, 0) / tunnels.length)
      : 100;
    return { totalTunnels, established, quarantined, avgPosture };
  }, [tunnels]);

  // Filtered Tunnels
  const filteredTunnels = useMemo(() => {
    return tunnels.filter(
      (t) =>
        t.deviceHost.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.principal.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.microsegment.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.peerIp.includes(searchTerm)
    );
  }, [tunnels, searchTerm]);

  // Terminate Tunnel Handler
  const handleConfirmTerminate = async () => {
    if (!killTunnelTarget) return;
    setActionLoading(true);
    try {
      await terminateSdpTunnel(killTunnelTarget.id);
      setTunnels((prev) => prev.filter((t) => t.id !== killTunnelTarget.id));
      setNotification({
        type: "success",
        message: `SDP Tunnel "${killTunnelTarget.id}" terminated. Virtual IP revoked.`
      });
      setKillTunnelTarget(null);
    } catch (err) {
      setNotification({ type: "error", message: "Failed terminating SDP tunnel." });
    } finally {
      setActionLoading(false);
    }
  };

  // Run Posture Evaluator
  const handleRunPostureEvaluator = async () => {
    setActionLoading(true);
    try {
      const res = await evaluateDevicePosture(postureParams);
      setPostureResult(res);
    } catch (err) {
      setNotification({ type: "error", message: "Failed evaluating posture score." });
    } finally {
      setActionLoading(false);
    }
  };

  // Export Audit Ledger
  const handleExportLedger = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ tunnels, policies }, null, 2));
    const dlAnchor = document.createElement("a");
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `MedTrack_ZTNA_Ledger_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
    setNotification({ type: "success", message: "ZTNA network access ledger exported successfully." });
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* 1. Header Banner & Diagnostics */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-slate-100">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 rounded-full flex items-center gap-1.5 font-mono">
                <Network size={12} /> ZTNA MICROSEGMENTATION
              </span>
              <span className="px-3 py-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1">
                <Wifi size={12} /> SDP TUNNELS ACTIVE
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Zero-Trust Network Access & Microsegment Guard
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Software-Defined Perimeter (SDP) encrypted tunnel orchestration, mTLS v1.3 mutual authentication verification, and posture-based microsegmentation.
            </p>
          </div>

          {/* Telemetry Widget */}
          <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl w-full lg:w-auto text-xs space-y-2">
            <div className="flex items-center justify-between gap-6 font-mono">
              <span className="text-slate-400 font-sans font-bold uppercase text-[10px]">SDP Tunnel State</span>
              <span className="text-cyan-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                {metrics.established} ESTABLISHED
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-700/80 font-mono text-[11px]">
              <div>Active SDP Tunnels: <strong className="text-white">{metrics.totalTunnels}</strong></div>
              <div>Avg Posture Score: <strong className="text-emerald-400">{metrics.avgPosture}/100</strong></div>
              <div>Quarantined: <strong className="text-red-400">{metrics.quarantined} Tunnels</strong></div>
              <div>Enforcement: <strong className="text-cyan-300">STRICT ZTNA</strong></div>
            </div>
          </div>
        </div>

        {/* Global Notifications */}
        {notification.message && (
          <div
            className={`mt-6 p-4 rounded-xl text-sm font-medium flex items-center justify-between border ${
              notification.type === "error"
                ? "bg-red-500/10 border-red-500/30 text-red-400"
                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === "error" ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
              <span>{notification.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotification({ type: "", message: "" })}
              className="text-slate-400 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>

      {/* 2. Navigation Tabs & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab("TUNNELS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === "TUNNELS"
                ? "bg-cyan-500 text-slate-950 font-black shadow-lg shadow-cyan-500/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Wifi size={15} /> Active SDP Tunnels ({tunnels.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("POLICIES")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === "POLICIES"
                ? "bg-cyan-500 text-slate-950 font-black shadow-lg shadow-cyan-500/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Sliders size={15} /> Microsegment Policies ({policies.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("POSTURE")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === "POSTURE"
                ? "bg-cyan-500 text-slate-950 font-black shadow-lg shadow-cyan-500/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Cpu size={15} /> Device Posture Evaluator
          </button>
        </div>

        <button
          type="button"
          onClick={handleExportLedger}
          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 self-end sm:self-auto"
        >
          <Download size={14} /> Export ZTNA Audit
        </button>
      </div>

      {/* 3. SDP TUNNELS TAB */}
      {activeTab === "TUNNELS" && (
        <div className="space-y-4">
          <div className="relative w-full sm:w-80">
            <Search size={14} className="absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Search host, IP, microsegment..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-4">Device Host & Peer IP</th>
                    <th className="p-4">Virtual SDP IP</th>
                    <th className="p-4">Enforced Microsegment</th>
                    <th className="p-4">mTLS Verification</th>
                    <th className="p-4">Posture Score</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Kill Switch</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {filteredTunnels.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-4 font-bold text-white font-sans">
                        <div>{t.deviceHost}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{t.peerIp} ({t.principal})</div>
                      </td>
                      <td className="p-4 text-cyan-400 font-bold">{t.virtualIp}</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 text-[10px] bg-slate-800 border border-slate-700 rounded text-purple-300">
                          {t.microsegment}
                        </span>
                      </td>
                      <td className="p-4 text-slate-300 font-bold">{t.mTlsStatus}</td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${
                            t.postureScore >= 90
                              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                              : t.postureScore >= 70
                              ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                              : "bg-red-500/20 text-red-400 border-red-500/30"
                          }`}
                        >
                          {t.postureScore}/100
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                            t.status === "ESTABLISHED" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400 animate-pulse"
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          type="button"
                          onClick={() => setKillTunnelTarget(t)}
                          className="p-1.5 text-red-400 hover:bg-red-500/10 border border-red-500/20 rounded-lg transition"
                          title="Terminate SDP Tunnel"
                        >
                          <Power size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. POLICIES TAB */}
      {activeTab === "POLICIES" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">Microsegmentation Firewall Rules</h3>
              <p className="text-xs text-slate-400">Zero-Trust network access controls and perimeter isolation rules</p>
            </div>
          </div>

          <div className="space-y-3">
            {policies.map((pol) => (
              <div
                key={pol.id}
                className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{pol.name}</span>
                    <span className="px-2 py-0.5 text-[10px] font-mono bg-slate-800 text-cyan-300 rounded">
                      {pol.id}
                    </span>
                  </div>
                  <div className="text-slate-400 font-mono">
                    Segment: <strong className="text-purple-300">{pol.sourceSegment}</strong> ➔ Target: <strong className="text-sky-300">{pol.targetServices.join(", ")}</strong>
                  </div>
                  <div className="text-slate-400 font-mono">
                    Enforcement: <strong className="text-emerald-400">{pol.action}</strong> (Min Posture: {pol.minPostureScore})
                  </div>
                </div>

                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold font-mono">
                  {pol.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. DEVICE POSTURE EVALUATOR TAB */}
      {activeTab === "POSTURE" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Cpu className="text-cyan-400" size={18} /> Device Posture Score Simulator
            </h3>
            <p className="text-xs text-slate-400">Evaluate client hardware health and calculates Zero-Trust posture score prior to SDP tunnel creation</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {[
              { key: "edrRunning", label: "EDR / Endpoint Antivirus Active", desc: "Verifies CrowdStrike or Defender EDR agent response." },
              { key: "diskEncrypted", label: "Full Disk Encryption (BitLocker / FileVault)", desc: "Requires AES-256 hardware disk encryption." },
              { key: "osPatchOutdated", label: "Outdated OS Security Patch Level", desc: "Flagged if OS is missing critical security patches." },
              { key: "firewallEnabled", label: "Host Firewall Active", desc: "Enforces inbound/outbound local packet filtering." }
            ].map((item) => (
              <div key={item.key} className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-sm font-bold text-white">{item.label}</div>
                  <div className="text-xs text-slate-400">{item.desc}</div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setPostureParams((prev) => ({ ...prev, [item.key]: !prev[item.key] }))
                  }
                  className={`w-12 h-6 rounded-full transition relative p-1 ${
                    postureParams[item.key] ? "bg-cyan-500" : "bg-slate-800"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      postureParams[item.key] ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleRunPostureEvaluator}
              disabled={actionLoading}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl text-xs transition flex items-center gap-2"
            >
              <Play size={14} /> Evaluate Posture Score
            </button>
          </div>

          {postureResult && (
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span>POSTURE ASSESSMENT VERDICT:</span>
                <span
                  className={`px-3 py-1 font-bold rounded ${
                    postureResult.verdict === "PASSED_COMPLIANT"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-red-500/20 text-red-400 border border-red-500/30"
                  }`}
                >
                  {postureResult.verdict} ({postureResult.postureScore}/100)
                </span>
              </div>
              <div className="space-y-1 text-slate-400 pt-1">
                {postureResult.checksPassed.map((check, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <CheckCircle2 size={13} className="text-emerald-400" />
                    <span>{check}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. TERMINATE TUNNEL MODAL */}
      {killTunnelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full text-slate-100 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20">
                <Power size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Terminate SDP Tunnel?</h3>
                <p className="text-xs text-slate-400">"{killTunnelTarget.deviceHost}" ({killTunnelTarget.virtualIp}) will be disconnected immediately.</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 text-xs">
              <button
                type="button"
                onClick={() => setKillTunnelTarget(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmTerminate}
                disabled={actionLoading}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition"
              >
                Terminate Tunnel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
