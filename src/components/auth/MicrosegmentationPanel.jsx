import { useState, useEffect, useCallback } from "react";
import {
  Network,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Sliders,
  Terminal,
  Cpu,
  Search,
  PlusCircle,
  Activity,
  Radio
} from "lucide-react";
import {
  getAllPolicies,
  createRule,
  toggleRuleStatus,
  getAllTunnels,
  establishTunnel,
  terminateTunnel
} from "../../services/MicrosegmentationService";
import "../../pages/auth/auth.css";

export default function MicrosegmentationPanel() {
  const [policies, setPolicies] = useState([]);
  const [tunnels, setTunnels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Rule Form State
  const [sourceSegment, setSourceSegment] = useState("PATIENT_PORTAL_DMZ");
  const [destinationSegment, setDestinationSegment] = useState("PROD_HEALTH_DB");
  const [allowedProtocol, setAllowedProtocol] = useState("TCP");
  const [portRange, setPortRange] = useState("5432");
  const [postureRequirement, setPostureRequirement] = useState("ENCRYPTED_MTLS_ONLY");
  const [action, setAction] = useState("STRICT_ALLOW");

  // Tunnel Form State
  const [userEmail, setUserEmail] = useState("");
  const [sourceIp, setSourceIp] = useState("");
  const [targetSegment, setTargetSegment] = useState("PROD_HEALTH_DB");
  const [tunnelProtocol, setTunnelProtocol] = useState("WIREGUARD_UDP");

  const loadMicrosegmentationData = useCallback(async () => {
    setLoading(true);
    try {
      const [polList, tunList] = await Promise.all([
        getAllPolicies().catch(() => []),
        getAllTunnels().catch(() => [])
      ]);

      setPolicies(polList);
      setTunnels(tunList);
    } catch (err) {
      console.error("Failed to load Microsegmentation data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMicrosegmentationData();
  }, [loadMicrosegmentationData]);

  const handleCreateRule = async (e) => {
    e.preventDefault();
    if (!portRange.trim()) return;

    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const created = await createRule({
        sourceSegment,
        destinationSegment,
        allowedProtocol,
        portRange: portRange.trim(),
        postureRequirement,
        action
      });

      setMessage({ type: "success", text: `Microsegmentation Rule ${created.ruleId} created successfully!` });
      await loadMicrosegmentationData();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to create rule." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleRule = async (ruleId, currentStatus) => {
    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const updated = await toggleRuleStatus(ruleId, currentStatus !== "ACTIVE");
      setMessage({ type: "success", text: `Rule ${updated.ruleId} status updated to ${updated.status}` });
      await loadMicrosegmentationData();
    } catch (err) {
      setMessage({ type: "error", text: "Failed to toggle rule status." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleEstablishTunnel = async (e) => {
    e.preventDefault();
    if (!userEmail.trim() || !sourceIp.trim()) return;

    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const est = await establishTunnel({
        userEmail: userEmail.trim(),
        sourceIp: sourceIp.trim(),
        targetSegment,
        tunnelProtocol
      });

      setUserEmail("");
      setSourceIp("");
      setMessage({ type: "success", text: `SDP Tunnel ${est.sessionId} established cleanly!` });
      await loadMicrosegmentationData();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to establish SDP tunnel." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleTerminateTunnel = async (sessionId) => {
    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const term = await terminateTunnel(sessionId);
      setMessage({ type: "success", text: `SDP Tunnel ${term.sessionId} terminated.` });
      await loadMicrosegmentationData();
    } catch (err) {
      setMessage({ type: "error", text: "Failed to terminate SDP tunnel." });
    } finally {
      setActionLoading(false);
    }
  };

  const activeTunnelsCount = tunnels.filter((t) => t.status === "ESTABLISHED").length;

  return (
    <div className="authority-panel-wrapper">
      {/* Header Card */}
      <header className="authority-header-card">
        <div className="authority-header-main">
          <div className="authority-icon-badge bg-teal-500/20 text-teal-400">
            <Network size={28} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="authority-title">Zero-Trust Microsegmentation & SDP Subsystem</h2>
              <span className="authority-ver-badge bg-teal-500/20 text-teal-300">
                SDP PERIMETER: ACTIVE ({activeTunnelsCount} LIVE TUNNELS)
              </span>
            </div>
            <p className="authority-subtitle">
              Granular segment isolation policies, mTLS posture verification, WireGuard UDP encrypted tunnels, and active connection telemetry
            </p>
          </div>
        </div>

        <div className="authority-header-actions">
          <button
            type="button"
            className="authority-btn authority-btn-secondary"
            onClick={loadMicrosegmentationData}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh Telemetry
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
        {/* Left Column: Create Rule & Establish Tunnel */}
        <div className="space-y-6 lg:col-span-1">
          {/* Create Rule Form */}
          <div className="authority-card">
            <div className="card-header justify-between">
              <div className="flex items-center gap-2">
                <PlusCircle size={18} className="text-teal-400" />
                <h3>Create Isolation Rule</h3>
              </div>
            </div>

            <form onSubmit={handleCreateRule} className="card-body space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Source Segment:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono text-[11px]"
                  value={sourceSegment}
                  onChange={(e) => setSourceSegment(e.target.value)}
                >
                  <option value="PATIENT_PORTAL_DMZ">PATIENT PORTAL DMZ</option>
                  <option value="WORKSTATION_LAN">WORKSTATION LAN</option>
                  <option value="GUEST_WIFI_VLAN">GUEST WIFI VLAN</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Destination Segment:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono text-[11px]"
                  value={destinationSegment}
                  onChange={(e) => setDestinationSegment(e.target.value)}
                >
                  <option value="PROD_HEALTH_DB">PROD HEALTH DB</option>
                  <option value="EHR_VAULT">EHR VAULT</option>
                  <option value="INTERNAL_API_GATEWAY">INTERNAL API GATEWAY</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Protocol:</label>
                  <select
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                    value={allowedProtocol}
                    onChange={(e) => setAllowedProtocol(e.target.value)}
                  >
                    <option value="TCP">TCP</option>
                    <option value="UDP">UDP</option>
                    <option value="ICMP">ICMP</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Port Range:</label>
                  <input
                    type="text"
                    placeholder="e.g. 5432"
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono text-[11px]"
                    value={portRange}
                    onChange={(e) => setPortRange(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Posture Requirement:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono text-[11px]"
                  value={postureRequirement}
                  onChange={(e) => setPostureRequirement(e.target.value)}
                >
                  <option value="ENCRYPTED_MTLS_ONLY">ENCRYPTED MTLS ONLY</option>
                  <option value="DEVICE_POSTURE_PASSED">DEVICE POSTURE PASSED</option>
                  <option value="NONE">NONE</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Rule Action:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                >
                  <option value="STRICT_ALLOW">STRICT ALLOW</option>
                  <option value="BLOCK">BLOCK</option>
                </select>
              </div>

              <button
                type="submit"
                className="authority-btn authority-btn-primary bg-teal-600 hover:bg-teal-500 text-white w-full text-xs mt-2"
                disabled={actionLoading}
              >
                Create Microsegmentation Rule
              </button>
            </form>
          </div>

          {/* Establish Tunnel Form */}
          <div className="authority-card">
            <div className="card-header justify-between">
              <div className="flex items-center gap-2">
                <Radio size={18} className="text-teal-400" />
                <h3>Establish SDP Tunnel</h3>
              </div>
            </div>

            <form onSubmit={handleEstablishTunnel} className="card-body space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">User Email:</label>
                <input
                  type="email"
                  placeholder="e.g. operator@medtrack-health.org"
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-sans"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Source IP Address:</label>
                <input
                  type="text"
                  placeholder="e.g. 10.200.4.12"
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono text-[11px]"
                  value={sourceIp}
                  onChange={(e) => setSourceIp(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Protected Target Segment:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono text-[11px]"
                  value={targetSegment}
                  onChange={(e) => setTargetSegment(e.target.value)}
                >
                  <option value="PROD_HEALTH_DB">PROD HEALTH DB</option>
                  <option value="EHR_VAULT">EHR VAULT</option>
                </select>
              </div>

              <button
                type="submit"
                className="authority-btn authority-btn-secondary w-full text-xs mt-2"
                disabled={actionLoading}
              >
                Establish Encrypted SDP Tunnel
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Isolation Rules & SDP Tunnels */}
        <div className="authority-card lg:col-span-2 space-y-6">
          {/* Rules Table */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Network size={18} className="text-teal-400" /> Active Microsegmentation Rules ({policies.length})
            </h3>

            <div className="overflow-x-auto rounded-2xl border border-slate-700/50 bg-slate-800/30">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/80 text-slate-400 uppercase font-mono text-[10px]">
                  <tr>
                    <th className="p-3">Rule ID</th>
                    <th className="p-3">Source & Target</th>
                    <th className="p-3">Port & Posture</th>
                    <th className="p-3">Action</th>
                    <th className="p-3 text-right">Toggle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {policies.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/50">
                      <td className="p-3 font-bold text-teal-300">{p.ruleId}</td>
                      <td className="p-3 font-sans">
                        <div className="font-semibold text-white">{p.sourceSegment}</div>
                        <div className="text-[10px] text-teal-400 font-mono">➔ {p.destinationSegment}</div>
                      </td>
                      <td className="p-3">
                        <div className="text-slate-200">{p.allowedProtocol}:{p.portRange}</div>
                        <div className="text-[9px] text-slate-400 font-bold">{p.postureRequirement}</div>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] ${
                            p.action === "STRICT_ALLOW"
                              ? "bg-emerald-950 text-emerald-400 border border-emerald-500/30"
                              : "bg-red-950 text-red-400 border border-red-500/30"
                          }`}
                        >
                          {p.action}
                        </span>
                      </td>
                      <td className="p-3 text-right font-sans">
                        <button
                          type="button"
                          className={`px-2.5 py-1 rounded text-[10px] font-bold shadow transition ${
                            p.status === "ACTIVE"
                              ? "bg-slate-800 hover:bg-slate-700 text-slate-300"
                              : "bg-teal-600 hover:bg-teal-500 text-white"
                          }`}
                          onClick={() => handleToggleRule(p.ruleId, p.status)}
                        >
                          {p.status === "ACTIVE" ? "Disable" : "Enable"}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {policies.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-slate-500 font-sans">
                        No microsegmentation rules configured.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* SDP Tunnels Table */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Radio size={18} className="text-blue-400" /> Active Software-Defined Perimeter (SDP) Tunnels ({tunnels.length})
            </h3>

            <div className="overflow-x-auto rounded-2xl border border-slate-700/50 bg-slate-800/30">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/80 text-slate-400 uppercase font-mono text-[10px]">
                  <tr>
                    <th className="p-3">Session ID</th>
                    <th className="p-3">User & Source IP</th>
                    <th className="p-3">Target Segment</th>
                    <th className="p-3">Protocol & Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {tunnels.map((t, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/50 text-[11px]">
                      <td className="p-3 font-bold text-blue-300">{t.sessionId}</td>
                      <td className="p-3 font-sans">
                        <div className="font-semibold text-white">{t.userEmail}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{t.sourceIp}</div>
                      </td>
                      <td className="p-3 font-bold text-teal-300">{t.targetSegment}</td>
                      <td className="p-3 font-sans">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            t.status === "ESTABLISHED"
                              ? "bg-emerald-950 text-emerald-400 border border-emerald-500/30"
                              : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="p-3 text-right font-sans">
                        {t.status === "ESTABLISHED" && (
                          <button
                            type="button"
                            className="px-2.5 py-1 bg-red-600/80 hover:bg-red-500 text-white rounded text-[10px] font-bold shadow transition"
                            onClick={() => handleTerminateTunnel(t.sessionId)}
                          >
                            Terminate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {tunnels.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-500 font-sans">
                        No active SDP tunnel sessions.
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
