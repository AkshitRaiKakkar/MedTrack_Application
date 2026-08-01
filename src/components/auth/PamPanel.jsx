import { useState, useEffect, useCallback } from "react";
import {
  ShieldAlert,
  Key,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sliders,
  Terminal,
  Cpu,
  Lock,
  UserCheck,
  Search,
  Zap
} from "lucide-react";
import {
  getActivePolicy,
  updatePolicy,
  createAccessRequest,
  approveRequest,
  recordSessionLog,
  getAllRequests,
  getAllSessionLogs
} from "../../services/PamService";
import "../../pages/auth/auth.css";

export default function PamPanel() {
  const [policy, setPolicy] = useState(null);
  const [requests, setRequests] = useState([]);
  const [sessionLogs, setSessionLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Policy Form State
  const [maxSessionMinutes, setMaxSessionMinutes] = useState(60);
  const [autoApproveLowRisk, setAutoApproveLowRisk] = useState(true);
  const [requireMfaElevation, setRequireMfaElevation] = useState(true);
  const [requireTicketNumber, setRequireTicketNumber] = useState(true);

  // Submit Request Form State
  const [requesterEmail, setRequesterEmail] = useState("");
  const [targetResource, setTargetResource] = useState("PROD_PATIENT_DB");
  const [requestedRole, setRequestedRole] = useState("ROLE_DBA");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [reason, setReason] = useState("");
  const [ticketNumber, setTicketNumber] = useState("");

  const loadPamData = useCallback(async () => {
    setLoading(true);
    try {
      const [pol, reqList, logList] = await Promise.all([
        getActivePolicy().catch(() => null),
        getAllRequests().catch(() => []),
        getAllSessionLogs().catch(() => [])
      ]);

      if (pol) {
        setPolicy(pol);
        setMaxSessionMinutes(pol.maxSessionMinutes || 60);
        setAutoApproveLowRisk(pol.autoApproveLowRisk);
        setRequireMfaElevation(pol.requireMfaElevation);
        setRequireTicketNumber(pol.requireTicketNumber);
      }

      setRequests(reqList);
      setSessionLogs(logList);
    } catch (err) {
      console.error("Failed to load PAM data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPamData();
  }, [loadPamData]);

  const handleUpdatePolicy = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const updated = await updatePolicy({
        policyName: "MASTER_PAM_POLICY",
        maxSessionMinutes: Number(maxSessionMinutes),
        autoApproveLowRisk,
        requireMfaElevation,
        requireTicketNumber
      });

      setPolicy(updated);
      setMessage({ type: "success", text: "PAM Policy Configuration updated!" });
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to update PAM policy." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!requesterEmail.trim() || !reason.trim()) return;

    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const created = await createAccessRequest({
        requesterEmail: requesterEmail.trim(),
        targetResource,
        requestedRole,
        durationMinutes: Number(durationMinutes),
        reason: reason.trim(),
        ticketNumber: ticketNumber.trim()
      });

      setRequesterEmail("");
      setReason("");
      setTicketNumber("");
      setMessage({
        type: "success",
        text: `JIT Access Request ${created.requestId} submitted! Status: ${created.status}`
      });
      await loadPamData();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to submit JIT access request." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveRequest = async (reqId) => {
    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const approved = await approveRequest(reqId);
      setMessage({ type: "success", text: `JIT Request ${approved.requestId} APPROVED cleanly!` });
      await loadPamData();
    } catch (err) {
      setMessage({ type: "error", text: "Failed to approve JIT request." });
    } finally {
      setActionLoading(false);
    }
  };

  const activeElevationsCount = requests.filter((r) => r.status === "APPROVED").length;

  return (
    <div className="authority-panel-wrapper">
      {/* Header Card */}
      <header className="authority-header-card">
        <div className="authority-header-main">
          <div className="authority-icon-badge bg-amber-500/20 text-amber-400">
            <Zap size={28} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="authority-title">Privileged Access Management (PAM) & JIT Elevation Engine</h2>
              <span className="authority-ver-badge bg-amber-500/20 text-amber-300">
                JIT ELEVATION: ACTIVE ({activeElevationsCount} ACTIVE SESSIONS)
              </span>
            </div>
            <p className="authority-subtitle">
              Just-In-Time credential elevation, break-glass workflow auto-approvals, and keystroke command audit logging
            </p>
          </div>
        </div>

        <div className="authority-header-actions">
          <button
            type="button"
            className="authority-btn authority-btn-secondary"
            onClick={loadPamData}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Sync PAM State
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
        {/* Left Column: Create JIT Request & Policy Config */}
        <div className="space-y-6 lg:col-span-1">
          {/* Submit Request Card */}
          <div className="authority-card">
            <div className="card-header justify-between">
              <div className="flex items-center gap-2">
                <Key size={18} className="text-amber-400" />
                <h3>Request JIT Credential Elevation</h3>
              </div>
            </div>

            <form onSubmit={handleCreateRequest} className="card-body space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Requester Email:</label>
                <input
                  type="email"
                  placeholder="e.g. devops.lead@medtrack-health.org"
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  value={requesterEmail}
                  onChange={(e) => setRequesterEmail(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Target Resource:</label>
                  <select
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                    value={targetResource}
                    onChange={(e) => setTargetResource(e.target.value)}
                  >
                    <option value="PROD_PATIENT_DB">PROD PATIENT DB</option>
                    <option value="K8S_PROD_CLUSTER">K8S PROD CLUSTER</option>
                    <option value="VAULT_SECRETS">VAULT SECRETS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Elevated Role:</label>
                  <select
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                    value={requestedRole}
                    onChange={(e) => setRequestedRole(e.target.value)}
                  >
                    <option value="ROLE_DBA">ROLE DBA</option>
                    <option value="ROLE_SYSADMIN">ROLE SYSADMIN</option>
                    <option value="ROLE_SECURITY_AUDITOR">ROLE AUDITOR</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Duration (Minutes):</label>
                  <input
                    type="number"
                    min="5"
                    max="480"
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Ticket Number:</label>
                  <input
                    type="text"
                    placeholder="e.g. SEC-9011"
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                    value={ticketNumber}
                    onChange={(e) => setTicketNumber(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Justification Reason:</label>
                <textarea
                  rows={2}
                  placeholder="State operational need for elevation..."
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-sans text-xs"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="authority-btn authority-btn-primary bg-amber-600 hover:bg-amber-500 text-white w-full text-xs mt-2"
                disabled={actionLoading}
              >
                Submit Elevation Request
              </button>
            </form>
          </div>

          {/* PAM Policy Settings Card */}
          <div className="authority-card">
            <div className="card-header justify-between">
              <div className="flex items-center gap-2">
                <Sliders size={18} className="text-amber-400" />
                <h3>PAM Policy Rules</h3>
              </div>
            </div>

            <form onSubmit={handleUpdatePolicy} className="card-body space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Max Elevation Timeout (Minutes):</label>
                <input
                  type="number"
                  min="5"
                  max="480"
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  value={maxSessionMinutes}
                  onChange={(e) => setMaxSessionMinutes(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2 pt-1">
                <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 cursor-pointer">
                  <span className="text-slate-300 font-semibold">Auto-Approve Low Risk (&le;30m)</span>
                  <input
                    type="checkbox"
                    className="rounded text-amber-500 focus:ring-amber-500 h-4 w-4"
                    checked={autoApproveLowRisk}
                    onChange={(e) => setAutoApproveLowRisk(e.target.checked)}
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 cursor-pointer">
                  <span className="text-slate-300 font-semibold">Require Step-up MFA Elevation</span>
                  <input
                    type="checkbox"
                    className="rounded text-amber-500 focus:ring-amber-500 h-4 w-4"
                    checked={requireMfaElevation}
                    onChange={(e) => setRequireMfaElevation(e.target.checked)}
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 cursor-pointer">
                  <span className="text-slate-300 font-semibold">Enforce Ticket Number Linking</span>
                  <input
                    type="checkbox"
                    className="rounded text-amber-500 focus:ring-amber-500 h-4 w-4"
                    checked={requireTicketNumber}
                    onChange={(e) => setRequireTicketNumber(e.target.checked)}
                  />
                </label>
              </div>

              <button
                type="submit"
                className="authority-btn authority-btn-secondary w-full text-xs mt-2"
                disabled={actionLoading}
              >
                Save PAM Rules
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: JIT Elevation Requests & Command Logs */}
        <div className="authority-card lg:col-span-2 space-y-6">
          {/* Requests Table */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Zap size={18} className="text-amber-400" /> JIT Credential Elevation Requests ({requests.length})
            </h3>

            <div className="overflow-x-auto rounded-2xl border border-slate-700/50 bg-slate-800/30">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/80 text-slate-400 uppercase font-mono text-[10px]">
                  <tr>
                    <th className="p-3">Request ID</th>
                    <th className="p-3">Requester & Resource</th>
                    <th className="p-3">Role & Duration</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Approval</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {requests.map((r, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/50">
                      <td className="p-3 font-bold text-amber-300">{r.requestId}</td>
                      <td className="p-3 font-sans">
                        <div className="font-semibold text-white">{r.requesterEmail}</div>
                        <div className="text-[10px] text-amber-400 font-mono">{r.targetResource} • Ticket: {r.ticketNumber}</div>
                      </td>
                      <td className="p-3">
                        <div className="text-slate-200 font-semibold">{r.requestedRole}</div>
                        <div className="text-[10px] text-slate-400">{r.durationMinutes} minutes</div>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] ${
                            r.status === "APPROVED"
                              ? "bg-emerald-950 text-emerald-400 border border-emerald-500/30"
                              : "bg-amber-950 text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="p-3 text-right font-sans">
                        {r.status === "PENDING" ? (
                          <button
                            type="button"
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold shadow transition"
                            onClick={() => handleApproveRequest(r.requestId)}
                          >
                            Approve Grant
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400">{r.approvedBy || "AUTOMATED"}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {requests.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-500 font-sans">
                        No JIT elevation requests submitted yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Session Audit Logs Table */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Terminal size={18} className="text-blue-400" /> Elevated Session Command Execution Logs ({sessionLogs.length})
            </h3>

            <div className="overflow-x-auto rounded-2xl border border-slate-700/50 bg-slate-800/30">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/80 text-slate-400 uppercase font-mono text-[10px]">
                  <tr>
                    <th className="p-3">Session ID</th>
                    <th className="p-3">Request ID</th>
                    <th className="p-3">Operator</th>
                    <th className="p-3">Command / Action Executed</th>
                    <th className="p-3 text-right">Risk Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {sessionLogs.map((s, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/50 text-[11px]">
                      <td className="p-3 font-bold text-blue-300">{s.sessionId}</td>
                      <td className="p-3 text-amber-300">{s.requestId}</td>
                      <td className="p-3 text-slate-300">{s.operatorEmail}</td>
                      <td className="p-3 text-emerald-300 truncate max-w-[180px]" title={s.actionExecuted}>
                        {s.actionExecuted}
                      </td>
                      <td className="p-3 text-right font-bold text-amber-400">{s.riskScore}%</td>
                    </tr>
                  ))}
                  {sessionLogs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-slate-500 font-sans">
                        No active PAM session commands logged yet.
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
