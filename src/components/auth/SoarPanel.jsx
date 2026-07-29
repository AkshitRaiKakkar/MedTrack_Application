import { useState, useEffect, useCallback } from "react";
import {
  Workflow,
  Play,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Sliders,
  Terminal,
  Cpu,
  Lock,
  Search,
  PlusCircle,
  Activity
} from "lucide-react";
import {
  getAllPlaybooks,
  createPlaybook,
  togglePlaybookStatus,
  triggerPlaybook,
  getAllExecutionLogs
} from "../../services/SoarService";
import "../../pages/auth/auth.css";

export default function SoarPanel() {
  const [playbooks, setPlaybooks] = useState([]);
  const [executionLogs, setExecutionLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Playbook Form State
  const [playbookName, setPlaybookName] = useState("");
  const [triggerEvent, setTriggerEvent] = useState("HIGH_SEVERITY_ALERT");
  const [targetAction, setTargetAction] = useState("ISOLATE_HOST");
  const [autoExecutionEnabled, setAutoExecutionEnabled] = useState(true);

  // Trigger Execution Form State
  const [selectedPlaybookId, setSelectedPlaybookId] = useState("SOAR-PLAY-101");
  const [triggerSource, setTriggerSource] = useState("SIEM_ALERT");
  const [affectedResource, setAffectedResource] = useState("");

  const loadSoarData = useCallback(async () => {
    setLoading(true);
    try {
      const [pbList, logList] = await Promise.all([
        getAllPlaybooks().catch(() => []),
        getAllExecutionLogs().catch(() => [])
      ]);

      setPlaybooks(pbList);
      setExecutionLogs(logList);
      if (pbList.length > 0) {
        setSelectedPlaybookId(pbList[0].playbookId);
      }
    } catch (err) {
      console.error("Failed to load SOAR data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSoarData();
  }, [loadSoarData]);

  const handleCreatePlaybook = async (e) => {
    e.preventDefault();
    if (!playbookName.trim()) return;

    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const created = await createPlaybook({
        playbookName: playbookName.trim(),
        triggerEvent,
        targetAction,
        autoExecutionEnabled
      });

      setPlaybookName("");
      setMessage({ type: "success", text: `SOAR Playbook ${created.playbookId} created successfully!` });
      await loadSoarData();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to create SOAR playbook." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleTogglePlaybook = async (pbId, currentStatus) => {
    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const updated = await togglePlaybookStatus(pbId, currentStatus !== "ACTIVE");
      setMessage({ type: "success", text: `Playbook ${updated.playbookId} status toggled to ${updated.status}` });
      await loadSoarData();
    } catch (err) {
      setMessage({ type: "error", text: "Failed to toggle playbook status." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleTriggerExecution = async (e) => {
    e.preventDefault();
    if (!affectedResource.trim()) return;

    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const executed = await triggerPlaybook({
        playbookId: selectedPlaybookId,
        triggerSource,
        affectedResource: affectedResource.trim()
      });

      setAffectedResource("");
      setMessage({ type: "success", text: `Playbook executed cleanly! Run ID: ${executed.executionId}` });
      await loadSoarData();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to trigger playbook execution." });
    } finally {
      setActionLoading(false);
    }
  };

  const activePlaybooksCount = playbooks.filter((p) => p.status === "ACTIVE").length;

  return (
    <div className="authority-panel-wrapper">
      {/* Header Card */}
      <header className="authority-header-card">
        <div className="authority-header-main">
          <div className="authority-icon-badge bg-rose-500/20 text-rose-400">
            <Workflow size={28} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="authority-title">Automated Incident Response & Orchestration (SOAR) Subsystem</h2>
              <span className="authority-ver-badge bg-rose-500/20 text-rose-300">
                SOAR ENGINE: ACTIVE ({activePlaybooksCount} ACTIVE PLAYBOOKS)
              </span>
            </div>
            <p className="authority-subtitle">
              SIEM alert webhook triggers, host network isolation, session revokers, and zero-latency incident remediation playbooks
            </p>
          </div>
        </div>

        <div className="authority-header-actions">
          <button
            type="button"
            className="authority-btn authority-btn-secondary"
            onClick={loadSoarData}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Sync Playbook Engine
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

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Create Playbook & Trigger Execution */}
        <div className="space-y-6 lg:col-span-1">
          {/* Create Playbook Form */}
          <div className="authority-card">
            <div className="card-header justify-between">
              <div className="flex items-center gap-2">
                <PlusCircle size={18} className="text-rose-400" />
                <h3>Create Response Playbook</h3>
              </div>
            </div>

            <form onSubmit={handleCreatePlaybook} className="card-body space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Playbook Name:</label>
                <input
                  type="text"
                  placeholder="e.g. Auto-Isolate-Compromised-Endpoint"
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-sans"
                  value={playbookName}
                  onChange={(e) => setPlaybookName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Trigger Event Alert:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
                  value={triggerEvent}
                  onChange={(e) => setTriggerEvent(e.target.value)}
                >
                  <option value="HIGH_SEVERITY_ALERT">HIGH SEVERITY ALERT</option>
                  <option value="MALWARE_DETECTED">MALWARE DETECTED</option>
                  <option value="EXFILTRATION_ALERT">EXFILTRATION ALERT</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Remediation Action:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
                  value={targetAction}
                  onChange={(e) => setTargetAction(e.target.value)}
                >
                  <option value="ISOLATE_HOST">ISOLATE HOST ENDPOINT</option>
                  <option value="REVOKE_SESSION">REVOKE ACTIVE SESSIONS</option>
                  <option value="BLOCK_IP">BLOCK INGRESS IP</option>
                  <option value="LOCK_USER_ACCOUNT">LOCK USER ACCOUNT</option>
                </select>
              </div>

              <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 cursor-pointer pt-2">
                <span className="text-slate-300 font-semibold">Enable Zero-Touch Auto-Execution</span>
                <input
                  type="checkbox"
                  className="rounded text-rose-500 focus:ring-rose-500 h-4 w-4"
                  checked={autoExecutionEnabled}
                  onChange={(e) => setAutoExecutionEnabled(e.target.checked)}
                />
              </label>

              <button
                type="submit"
                className="authority-btn authority-btn-primary bg-rose-600 hover:bg-rose-500 text-white w-full text-xs mt-2"
                disabled={actionLoading}
              >
                Create SOAR Playbook
              </button>
            </form>
          </div>

          {/* Manual Playbook Trigger Form */}
          <div className="authority-card">
            <div className="card-header justify-between">
              <div className="flex items-center gap-2">
                <Play size={18} className="text-rose-400" />
                <h3>Manual Playbook Trigger</h3>
              </div>
            </div>

            <form onSubmit={handleTriggerExecution} className="card-body space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Select Playbook:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono text-[11px]"
                  value={selectedPlaybookId}
                  onChange={(e) => setSelectedPlaybookId(e.target.value)}
                >
                  {playbooks.map((p, i) => (
                    <option key={i} value={p.playbookId}>{p.playbookId} ({p.playbookName})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Trigger Source:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
                  value={triggerSource}
                  onChange={(e) => setTriggerSource(e.target.value)}
                >
                  <option value="SOC_OPERATOR">SOC OPERATOR MANUAL</option>
                  <option value="SIEM_ALERT">SIEM AUTOMATED ALERT</option>
                  <option value="THREAT_INTEL">THREAT INTEL FEED</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Affected Target Resource:</label>
                <input
                  type="text"
                  placeholder="e.g. host-10.0.4.12 or user@medtrack.org"
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono text-[11px]"
                  value={affectedResource}
                  onChange={(e) => setAffectedResource(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="authority-btn authority-btn-secondary w-full text-xs mt-2"
                disabled={actionLoading}
              >
                Trigger Execution Run
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Active Playbooks & Execution Logs */}
        <div className="authority-card lg:col-span-2 space-y-6">
          {/* Active Playbooks Table */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Workflow size={18} className="text-rose-400" /> Configured Response Playbooks ({playbooks.length})
            </h3>

            <div className="overflow-x-auto rounded-2xl border border-slate-700/50 bg-slate-800/30">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/80 text-slate-400 uppercase font-mono text-[10px]">
                  <tr>
                    <th className="p-3">Playbook ID</th>
                    <th className="p-3">Name & Event</th>
                    <th className="p-3">Remediation Action</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Toggle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {playbooks.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/50">
                      <td className="p-3 font-bold text-rose-300">{p.playbookId}</td>
                      <td className="p-3 font-sans">
                        <div className="font-semibold text-white">{p.playbookName}</div>
                        <div className="text-[10px] text-rose-400 font-mono">{p.triggerEvent}</div>
                      </td>
                      <td className="p-3 font-semibold text-slate-200">{p.targetAction}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] ${
                            p.status === "ACTIVE"
                              ? "bg-emerald-950 text-emerald-400 border border-emerald-500/30"
                              : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="p-3 text-right font-sans">
                        <button
                          type="button"
                          className={`px-2.5 py-1 rounded text-[10px] font-bold shadow transition ${
                            p.status === "ACTIVE"
                              ? "bg-slate-800 hover:bg-slate-700 text-slate-300"
                              : "bg-emerald-600 hover:bg-emerald-500 text-white"
                          }`}
                          onClick={() => handleTogglePlaybook(p.playbookId, p.status)}
                        >
                          {p.status === "ACTIVE" ? "Disable" : "Enable"}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {playbooks.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-slate-500 font-sans">
                        No playbooks configured.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Execution Logs Table */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity size={18} className="text-blue-400" /> Playbook Execution Audit Logs ({executionLogs.length})
            </h3>

            <div className="overflow-x-auto rounded-2xl border border-slate-700/50 bg-slate-800/30">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/80 text-slate-400 uppercase font-mono text-[10px]">
                  <tr>
                    <th className="p-3">Execution ID</th>
                    <th className="p-3">Playbook & Source</th>
                    <th className="p-3">Affected Target</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Execution Detail Log</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {executionLogs.map((l, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/50 text-[11px]">
                      <td className="p-3 font-bold text-blue-300">{l.executionId}</td>
                      <td className="p-3 font-sans">
                        <div className="font-semibold text-rose-300 font-mono">{l.playbookId}</div>
                        <div className="text-[10px] text-slate-400">{l.triggerSource}</div>
                      </td>
                      <td className="p-3 font-bold text-slate-200 truncate max-w-[140px]" title={l.affectedResource}>
                        {l.affectedResource}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                          {l.status}
                        </span>
                      </td>
                      <td className="p-3 font-sans text-emerald-300 text-[11px] truncate max-w-[200px]" title={l.outputLog}>
                        {l.outputLog}
                      </td>
                    </tr>
                  ))}
                  {executionLogs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-500 font-sans">
                        No playbook execution runs logged.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
