import { useState, useEffect, useCallback } from "react";
import {
  Cloud,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Server,
  Sliders,
  Terminal,
  Cpu,
  Lock,
  Search,
  PlusCircle
} from "lucide-react";
import {
  getAllAccounts,
  registerCloudAccount,
  getAllFindings,
  ingestFinding,
  remediateFinding
} from "../../services/CspmService";
import "../../pages/auth/auth.css";

export default function CspmPanel() {
  const [accounts, setAccounts] = useState([]);
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Account Form State
  const [accountNumber, setAccountNumber] = useState("");
  const [provider, setProvider] = useState("AWS");
  const [accountName, setAccountName] = useState("");
  const [region, setRegion] = useState("us-west-2");

  // Ingest Finding Form State
  const [findingAccNum, setFindingAccNum] = useState("AWS-19203910");
  const [resourceId, setResourceId] = useState("");
  const [resourceType, setResourceType] = useState("S3_BUCKET");
  const [severity, setSeverity] = useState("CRITICAL");
  const [benchmark, setBenchmark] = useState("HIPAA_CLOUD_SECURITY");
  const [description, setDescription] = useState("");
  const [remediationCommand, setRemediationCommand] = useState("");

  const loadCspmData = useCallback(async () => {
    setLoading(true);
    try {
      const [accList, findList] = await Promise.all([
        getAllAccounts().catch(() => []),
        getAllFindings().catch(() => [])
      ]);

      setAccounts(accList);
      setFindings(findList);
      if (accList.length > 0) {
        setFindingAccNum(accList[0].accountNumber);
      }
    } catch (err) {
      console.error("Failed to load CSPM data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCspmData();
  }, [loadCspmData]);

  const handleRegisterAccount = async (e) => {
    e.preventDefault();
    if (!accountNumber.trim() || !accountName.trim()) return;

    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const registered = await registerCloudAccount({
        accountNumber: accountNumber.trim(),
        provider,
        accountName: accountName.trim(),
        region
      });

      setAccountNumber("");
      setAccountName("");
      setMessage({ type: "success", text: `Cloud Account ${registered.accountNumber} registered successfully!` });
      await loadCspmData();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to register cloud account." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleIngestFinding = async (e) => {
    e.preventDefault();
    if (!resourceId.trim() || !description.trim()) return;

    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const ingested = await ingestFinding({
        accountNumber: findingAccNum,
        resourceId: resourceId.trim(),
        resourceType,
        severity,
        benchmark,
        description: description.trim(),
        remediationCommand: remediationCommand.trim()
      });

      setResourceId("");
      setDescription("");
      setRemediationCommand("");
      setMessage({ type: "success", text: `CSPM Finding ${ingested.findingId} recorded!` });
      await loadCspmData();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to ingest CSPM finding." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemediate = async (findId) => {
    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const remediated = await remediateFinding(findId);
      setMessage({ type: "success", text: `Remediation executed for ${remediated.findingId}! Status: REMEDIATED` });
      await loadCspmData();
    } catch (err) {
      setMessage({ type: "error", text: "Remediation trigger failed." });
    } finally {
      setActionLoading(false);
    }
  };

  const openFindingsCount = findings.filter((f) => f.status === "OPEN").length;

  return (
    <div className="authority-panel-wrapper">
      {/* Header Card */}
      <header className="authority-header-card">
        <div className="authority-header-main">
          <div className="authority-icon-badge bg-sky-500/20 text-sky-400">
            <Cloud size={28} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="authority-title">Cloud Security Posture Management (CSPM) Subsystem</h2>
              <span className="authority-ver-badge bg-sky-500/20 text-sky-300">
                MULTI-CLOUD: ACTIVE ({openFindingsCount} OPEN MISCONFIGURATIONS)
              </span>
            </div>
            <p className="authority-subtitle">
              AWS, Azure, and GCP continuous posture scanning, CIS Benchmark enforcement, and zero-touch CLI auto-remediations
            </p>
          </div>
        </div>

        <div className="authority-header-actions">
          <button
            type="button"
            className="authority-btn authority-btn-secondary"
            onClick={loadCspmData}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Scan Cloud Assets
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
        {/* Left Column: Register Account & Ingest Finding */}
        <div className="space-y-6 lg:col-span-1">
          {/* Register Cloud Account Form */}
          <div className="authority-card">
            <div className="card-header justify-between">
              <div className="flex items-center gap-2">
                <PlusCircle size={18} className="text-sky-400" />
                <h3>Connect Multi-Cloud Account</h3>
              </div>
            </div>

            <form onSubmit={handleRegisterAccount} className="card-body space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Cloud Provider:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                >
                  <option value="AWS">AMAZON WEB SERVICES (AWS)</option>
                  <option value="AZURE">MICROSOFT AZURE</option>
                  <option value="GCP">GOOGLE CLOUD PLATFORM (GCP)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Account Number / ID:</label>
                <input
                  type="text"
                  placeholder="e.g. AWS-19203910"
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Account Name:</label>
                <input
                  type="text"
                  placeholder="e.g. Production-Medical-Infrastructure"
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-sans"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Primary Region:</label>
                <input
                  type="text"
                  placeholder="e.g. us-west-2"
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="authority-btn authority-btn-primary bg-sky-600 hover:bg-sky-500 text-white w-full text-xs mt-2"
                disabled={actionLoading}
              >
                Register Cloud Account
              </button>
            </form>
          </div>

          {/* Ingest Finding Form */}
          <div className="authority-card">
            <div className="card-header justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-400" />
                <h3>Ingest CSPM Misconfiguration</h3>
              </div>
            </div>

            <form onSubmit={handleIngestFinding} className="card-body space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Resource ID / URI:</label>
                <input
                  type="text"
                  placeholder="e.g. s3://medtrack-patient-records"
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono text-[11px]"
                  value={resourceId}
                  onChange={(e) => setResourceId(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Resource Type:</label>
                  <select
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                    value={resourceType}
                    onChange={(e) => setResourceType(e.target.value)}
                  >
                    <option value="S3_BUCKET">S3 BUCKET</option>
                    <option value="IAM_ROLE">IAM ROLE</option>
                    <option value="K8S_CLUSTER">K8S CLUSTER</option>
                    <option value="SECURITY_GROUP">SECURITY GROUP</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Severity:</label>
                  <select
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Benchmark standard:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  value={benchmark}
                  onChange={(e) => setBenchmark(e.target.value)}
                >
                  <option value="HIPAA_CLOUD_SECURITY">HIPAA CLOUD SECURITY</option>
                  <option value="CIS_AWS_FOUNDATIONS_1_5">CIS AWS FOUNDATIONS 1.5</option>
                  <option value="CIS_K8S_BENCHMARK_1_7">CIS K8S BENCHMARK 1.7</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description:</label>
                <textarea
                  rows={2}
                  placeholder="Describe cloud misconfiguration..."
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-sans text-xs"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Remediation Command (CLI/Terraform):</label>
                <input
                  type="text"
                  placeholder="aws s3api put-public-access-block..."
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono text-[10px]"
                  value={remediationCommand}
                  onChange={(e) => setRemediationCommand(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="authority-btn authority-btn-secondary w-full text-xs mt-2"
                disabled={actionLoading}
              >
                Ingest Finding
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Connected Accounts & Misconfigurations */}
        <div className="authority-card lg:col-span-2 space-y-6">
          {/* Connected Accounts Table */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Cloud size={18} className="text-sky-400" /> Connected Cloud Accounts ({accounts.length})
            </h3>

            <div className="overflow-x-auto rounded-2xl border border-slate-700/50 bg-slate-800/30">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/80 text-slate-400 uppercase font-mono text-[10px]">
                  <tr>
                    <th className="p-3">Account Number</th>
                    <th className="p-3">Provider & Name</th>
                    <th className="p-3">Region</th>
                    <th className="p-3 text-right">Sync Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {accounts.map((a, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/50">
                      <td className="p-3 font-bold text-sky-300">{a.accountNumber}</td>
                      <td className="p-3 font-sans">
                        <div className="font-semibold text-white">{a.accountName}</div>
                        <div className="text-[10px] text-sky-400 font-mono">{a.provider}</div>
                      </td>
                      <td className="p-3 text-slate-300">{a.region}</td>
                      <td className="p-3 text-right">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                          {a.syncStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {accounts.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-slate-500 font-sans">
                        No cloud accounts connected.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Security Findings Table */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Terminal size={18} className="text-emerald-400" /> CSPM Security Findings ({findings.length})
            </h3>

            <div className="overflow-x-auto rounded-2xl border border-slate-700/50 bg-slate-800/30">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/80 text-slate-400 uppercase font-mono text-[10px]">
                  <tr>
                    <th className="p-3">Finding ID</th>
                    <th className="p-3">Resource & Benchmark</th>
                    <th className="p-3">Severity</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Remediation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {findings.map((f, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/50">
                      <td className="p-3 font-bold text-sky-300">{f.findingId}</td>
                      <td className="p-3 font-sans">
                        <div className="font-semibold text-white truncate max-w-[160px]" title={f.resourceId}>
                          {f.resourceId}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">{f.benchmark}</div>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            f.severity === "CRITICAL"
                              ? "bg-red-950 text-red-400 border border-red-500/30"
                              : "bg-amber-950 text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          {f.severity}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] ${
                            f.status === "REMEDIATED"
                              ? "bg-emerald-950 text-emerald-400 border border-emerald-500/30"
                              : "bg-amber-950 text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          {f.status}
                        </span>
                      </td>
                      <td className="p-3 text-right font-sans">
                        {f.status === "OPEN" ? (
                          <button
                            type="button"
                            className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-[10px] font-bold shadow transition"
                            onClick={() => handleRemediate(f.findingId)}
                          >
                            Auto-Fix
                          </button>
                        ) : (
                          <span className="text-[10px] text-emerald-400 font-bold">FIXED</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {findings.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-500 font-sans">
                        No CSPM findings detected.
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
