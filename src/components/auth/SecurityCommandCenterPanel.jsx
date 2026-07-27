import { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  Zap,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Sliders,
  TrendingUp,
  Radio,
  Lock,
  Workflow,
  Users,
  Shield,
  BellRing
} from "lucide-react";
import {
  getUnifiedSummary,
  getActiveConfig,
  updateConfig,
  acknowledgeAlert,
  getAllAlerts
} from "../../services/SecurityCommandCenterService";
import "../../pages/auth/auth.css";

export default function SecurityCommandCenterPanel() {
  const [summary, setSummary] = useState(null);
  const [config, setConfig] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Config Form State
  const [refreshInterval, setRefreshInterval] = useState(15);
  const [activeWidgets, setActiveWidgets] = useState("POSTURE_SCORE,OTEL_STREAMS,ACTIVE_CONTAINMENTS,WORM_LEDGER,SCIM_SYNC");
  const [riskThreshold, setRiskThreshold] = useState(75);
  const [autoAckLow, setAutoAckLow] = useState(false);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [sum, cfg, altList] = await Promise.all([
        getUnifiedSummary().catch(() => null),
        getActiveConfig().catch(() => null),
        getAllAlerts().catch(() => [])
      ]);

      if (sum) setSummary(sum);
      if (cfg) {
        setConfig(cfg);
        setRefreshInterval(cfg.refreshIntervalSeconds || 15);
        setActiveWidgets(cfg.activeWidgets || "POSTURE_SCORE,OTEL_STREAMS");
        setRiskThreshold(cfg.riskAlertThreshold || 75);
        setAutoAckLow(cfg.autoAcknowledgeLowSeverity);
      }
      setAlerts(altList);
    } catch (err) {
      console.error("Failed to load command center data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleUpdateConfig = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const updated = await updateConfig({
        configName: "DEFAULT_COMMAND_CENTER_CONFIG",
        refreshIntervalSeconds: Number(refreshInterval),
        activeWidgets,
        riskAlertThreshold: Number(riskThreshold),
        autoAcknowledgeLowSeverity: autoAckLow
      });

      setConfig(updated);
      setMessage({ type: "success", text: "Dashboard layout and refresh settings saved!" });
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to update configuration." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcknowledgeAlert = async (alertId) => {
    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      await acknowledgeAlert({
        alertId,
        acknowledgedBy: "SOC_OPERATOR"
      });

      setMessage({ type: "success", text: `Alert ${alertId} acknowledged successfully.` });
      await loadDashboardData();
    } catch (err) {
      setMessage({ type: "error", text: "Failed to acknowledge alert." });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="authority-panel-wrapper">
      {/* Header Card */}
      <header className="authority-header-card">
        <div className="authority-header-main">
          <div className="authority-icon-badge bg-indigo-500/20 text-indigo-400">
            <ShieldCheck size={28} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="authority-title">Unified Security Command Center</h2>
              <span className="authority-ver-badge bg-indigo-500/20 text-indigo-300">
                POSTURE SCORE: {summary?.compositePostureScore || 90}% ({summary?.overallRiskLevel || "LOW"} RISK)
              </span>
            </div>
            <p className="authority-subtitle">
              Centralized single-pane-of-glass dashboard for Posture, OTel Observability, SOAR Containment, SCIM & Evidence Ledger
            </p>
          </div>
        </div>

        <div className="authority-header-actions">
          <button
            type="button"
            className="authority-btn authority-btn-secondary"
            onClick={loadDashboardData}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Sync Metrics
          </button>
        </div>
      </header>

      {/* Message Alert */}
      {message.text && (
        <div className={`authority-alert ${message.type === "error" ? "authority-alert-error" : "authority-alert-success"}`}>
          {message.type === "error" ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
          <span>{message.text}</span>
          <button type="button" className="ml-auto text-xs opacity-70 hover:opacity-100" onClick={() => setMessage({ type: "", text: "" })}>
            Dismiss
          </button>
        </div>
      )}

      {/* Top Metric Scorecard Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 space-y-1">
          <div className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1.5">
            <Shield size={14} className="text-emerald-400" /> Posture Score
          </div>
          <div className="text-xl font-extrabold text-white font-mono">{summary?.compositePostureScore || 90}%</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 space-y-1">
          <div className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1.5">
            <Radio size={14} className="text-cyan-400" /> OTel Streams
          </div>
          <div className="text-xl font-extrabold text-white font-mono">{(summary?.totalOtelStreamsIngested || 14250).toLocaleString()}</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 space-y-1">
          <div className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1.5">
            <Zap size={14} className="text-rose-400" /> Active SOAR
          </div>
          <div className="text-xl font-extrabold text-white font-mono">{summary?.activePlaybookContainments || 3}</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 space-y-1">
          <div className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1.5">
            <Lock size={14} className="text-blue-400" /> WORM Blocks
          </div>
          <div className="text-xl font-extrabold text-white font-mono">{summary?.sealedEvidenceBlocksCount || 128}</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 space-y-1">
          <div className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1.5">
            <Users size={14} className="text-amber-400" /> SCIM Synced
          </div>
          <div className="text-xl font-extrabold text-white font-mono">{summary?.activeScimUsersSynced || 450}</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 space-y-1">
          <div className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1.5">
            <BellRing size={14} className="text-rose-400" /> Critical Alerts
          </div>
          <div className="text-xl font-extrabold text-white font-mono">{summary?.criticalAlertsCount || 0}</div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Dashboard Layout Settings */}
        <div className="space-y-6 lg:col-span-1">
          <div className="authority-card">
            <div className="card-header justify-between">
              <div className="flex items-center gap-2">
                <Sliders size={18} className="text-indigo-400" />
                <h3>Command Center Layout Config</h3>
              </div>
            </div>

            <form onSubmit={handleUpdateConfig} className="card-body space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Refresh Rate (Seconds):</label>
                <input
                  type="number"
                  min="5"
                  max="300"
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Risk Alert Threshold (%):</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  value={riskThreshold}
                  onChange={(e) => setRiskThreshold(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Active Subsystem Widgets (CSV):</label>
                <input
                  type="text"
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-[11px]"
                  value={activeWidgets}
                  onChange={(e) => setActiveWidgets(e.target.value)}
                  required
                />
              </div>

              <div className="pt-1">
                <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 cursor-pointer">
                  <span className="text-slate-300 font-semibold">Auto-Ack Low Severity Alerts</span>
                  <input
                    type="checkbox"
                    className="rounded text-indigo-500 focus:ring-indigo-500 h-4 w-4"
                    checked={autoAckLow}
                    onChange={(e) => setAutoAckLow(e.target.checked)}
                  />
                </label>
              </div>

              <button
                type="submit"
                className="authority-btn authority-btn-primary w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs mt-2"
                disabled={actionLoading}
              >
                Save Layout & Thresholds
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Unified Security Alert Feed */}
        <div className="authority-card lg:col-span-2 space-y-4">
          <div className="card-header justify-between">
            <div className="flex items-center gap-2">
              <BellRing size={18} className="text-rose-400" />
              <h3>System-Wide Unified Security Alerts ({alerts.length})</h3>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-700/50 bg-slate-800/30">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3">Alert ID</th>
                  <th className="p-3">Subsystem</th>
                  <th className="p-3">Severity</th>
                  <th className="p-3">Alert Summary</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {alerts.map((alt, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/50 text-[11px]">
                    <td className="p-3 font-bold text-indigo-300">{alt.alertId}</td>
                    <td className="p-3 text-cyan-300">{alt.subsystem}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          alt.severity === "CRITICAL"
                            ? "bg-rose-950 text-rose-300 border border-rose-500/30"
                            : alt.severity === "HIGH"
                            ? "bg-amber-950 text-amber-300 border border-amber-500/30"
                            : "bg-slate-800 text-slate-300 border border-slate-700"
                        }`}
                      >
                        {alt.severity}
                      </span>
                    </td>
                    <td className="p-3 text-slate-300 font-sans text-[11px]">{alt.alertSummary}</td>
                    <td className="p-3 text-right font-sans">
                      {alt.resolutionStatus === "ACTIVE" ? (
                        <button
                          type="button"
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded text-[10px] border border-slate-700 transition"
                          onClick={() => handleAcknowledgeAlert(alt.alertId)}
                        >
                          Acknowledge
                        </button>
                      ) : (
                        <span className="text-[10px] text-emerald-400">ACKNOWLEDGED</span>
                      )}
                    </td>
                  </tr>
                ))}
                {alerts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-500 font-sans">
                      No security alerts registered across subsystems.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
