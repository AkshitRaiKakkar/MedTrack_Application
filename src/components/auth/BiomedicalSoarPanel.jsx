import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ShieldAlert,
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
  SlidersHorizontal,
  Zap,
  Check,
  Play,
  Siren,
  Workflow
} from "lucide-react";
import {
  getSoarPlaybooks,
  deploySoarPlaybook,
  runPlaybookSimulation,
  getSoarStandards
} from "../../services/BiomedicalSoarService";
import "../../pages/auth/auth.css";

/**
 * BiomedicalSoarPanel Component
 * 
 * Biomedical Incident Response & SOAR Playbook Automation Console.
 * Features:
 * 1. Autonomous Medical Ransomware & IoMT Network Isolation
 * 2. PHI Data Breach Rate Limiting & Account Freezing Playbooks
 * 3. NIST SP 800-61 Incident Handling & HIPAA Breach Reporting Telemetry
 * 4. Playbook Deployment & Real-Time Threat Containment Sandbox
 */
export default function BiomedicalSoarPanel() {
  // State
  const [playbooks, setPlaybooks] = useState([]);
  const [standards, setStandards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("PLAYBOOKS"); // "PLAYBOOKS" | "SANDBOX" | "STANDARDS"

  // Sandbox State
  const [selectedPlaybookId, setSelectedPlaybookId] = useState("SOAR-PB-501");
  const [simResult, setSimResult] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [playbookName, setPlaybookName] = useState("");
  const [targetTrigger, setTargetTrigger] = useState("Unusual SMB Port 445 File Encryption");

  // Load telemetry
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [pbList, stdList] = await Promise.all([
        getSoarPlaybooks().catch(() => []),
        getSoarStandards().catch(() => [])
      ]);

      setPlaybooks(pbList);
      setStandards(stdList);
    } catch (err) {
      console.error("Failed to load biomedical SOAR data:", err);
      setMessage({ type: "error", text: "Failed connecting to Biomedical SOAR service." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Run Playbook Sim
  const handleRunPlaybookSim = async (e) => {
    e?.preventDefault();
    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const result = await runPlaybookSimulation(selectedPlaybookId);
      setSimResult(result);
      setMessage({ type: "success", text: `Playbook ${selectedPlaybookId} executed in ${result.executionTimeMs}ms! ${result.affectedAssetsIsolated} assets isolated.` });
    } catch (err) {
      setMessage({ type: "error", text: "Playbook simulation failed." });
    } finally {
      setActionLoading(false);
    }
  };

  // Deploy Playbook
  const handleDeployPlaybook = async (e) => {
    e.preventDefault();
    if (!playbookName.trim()) return;

    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const newPb = await deploySoarPlaybook({
        playbookName: playbookName.trim(),
        targetTrigger
      });

      setPlaybookName("");
      setIsModalOpen(false);
      setMessage({ type: "success", text: `SOAR Playbook ${newPb.playbookId} deployed & active!` });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "Failed to deploy SOAR playbook." });
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const totalPlaybooks = playbooks.length;
    const activeReady = playbooks.filter((p) => p.executionState === "PLAYBOOK_ACTIVE_READY").length;
    const hipaaRequired = playbooks.filter((p) => p.hipaaNotificationRequired).length;

    return { totalPlaybooks, activeReady, hipaaRequired };
  }, [playbooks]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* 1. Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-slate-100">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-red-400 bg-red-500/10 border border-red-500/20 rounded-full flex items-center gap-1.5 font-mono">
                <Siren size={12} /> BIOMEDICAL SOAR & PLAYBOOK AUTOMATION
              </span>
              <span className="px-3 py-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1 font-mono">
                <ShieldCheck size={12} /> NIST SP 800-61 & HIPAA
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Biomedical Incident Response & SOAR Automation
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Autonomous IoMT medical ransomware isolation, automated PHI data breach containment, sub-15-second SLA triggers, and HIPAA breach reporting workflows.
            </p>
          </div>

          {/* Telemetry Widget */}
          <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl w-full lg:w-auto text-xs space-y-2">
            <div className="flex items-center justify-between gap-6 font-mono">
              <span className="text-slate-400 font-sans font-bold uppercase text-[10px]">SOAR Telemetry</span>
              <span className="text-red-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                AUTONOMOUS GUARD
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-700/80 font-mono text-[11px]">
              <div>Active Playbooks: <strong className="text-white">{metrics.totalPlaybooks} Deployed</strong></div>
              <div>Ready State: <strong className="text-emerald-400">{metrics.activeReady} Ready</strong></div>
              <div>HIPAA Alerts: <strong className="text-red-300">{metrics.hipaaRequired} Enforced</strong></div>
              <div>Avg Response SLA: <strong className="text-emerald-400 font-bold">&lt; 15s SLA</strong></div>
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
            onClick={() => setActiveTab("PLAYBOOKS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "PLAYBOOKS"
                ? "bg-red-600 text-white font-black shadow-lg shadow-red-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Workflow size={15} /> SOAR Playbooks ({playbooks.length})
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
            <Play size={15} /> Incident Containment Sandbox
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
            <ShieldCheck size={15} /> NIST & HIPAA Standards ({standards.length})
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-red-600/20"
        >
          <PlusCircle size={15} /> Deploy SOAR Playbook
        </button>
      </div>

      {/* 3. PLAYBOOKS TAB */}
      {activeTab === "PLAYBOOKS" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">Autonomous Incident Containment Playbooks</h3>
              <p className="text-xs text-slate-400 font-mono">Automated triggers, containment actions, response SLAs, and HIPAA notifications</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3">Playbook ID</th>
                  <th className="p-3">Playbook Name & Actions</th>
                  <th className="p-3">Target Threat Trigger</th>
                  <th className="p-3">Response SLA</th>
                  <th className="p-3">HIPAA Alert</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {playbooks.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/60">
                    <td className="p-3 font-bold text-red-400">{p.playbookId}</td>
                    <td className="p-3 font-sans">
                      <div className="font-semibold text-white">{p.playbookName}</div>
                      <div className="text-[10px] text-red-300 font-mono">{p.automatedActions}</div>
                    </td>
                    <td className="p-3 text-slate-400 font-mono text-[10px]">{p.targetTrigger}</td>
                    <td className="p-3 font-bold text-emerald-400 font-mono text-[10px]">{p.slaTarget}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.hipaaNotificationRequired
                            ? "bg-red-500/20 text-red-400 border border-red-500/30"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {p.hipaaNotificationRequired ? "HIPAA BREACH ALERT" : "INTERNAL ONLY"}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {p.executionState}
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
                <Play size={18} className="text-red-400" /> Incident Containment Playbook Sandbox
              </h3>
            </div>

            <form onSubmit={handleRunPlaybookSim} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Target Playbook:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-sans"
                  value={selectedPlaybookId}
                  onChange={(e) => setSelectedPlaybookId(e.target.value)}
                >
                  {playbooks.map((p) => (
                    <option key={p.playbookId} value={p.playbookId}>
                      {p.playbookId} - {p.playbookName}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-lg shadow-red-600/20"
              >
                <Zap size={16} /> Simulate Threat Trigger & Execute Playbook
              </button>
            </form>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-400" /> Containment Execution Output
              </h3>
            </div>

            {simResult ? (
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-sans font-bold uppercase">Mitigation Status:</span>
                  <div className="text-[10px] text-emerald-400 font-bold">{simResult.mitigationStatus}</div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px] p-3 bg-slate-950/60 rounded-xl border border-slate-800 font-sans">
                  <div>Execution Time: <strong className="text-emerald-400">{simResult.executionTimeMs} ms</strong></div>
                  <div>Isolated Assets: <strong className="text-red-400">{simResult.affectedAssetsIsolated} Workloads</strong></div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-2xl">
                Click "Simulate Threat Trigger & Execute Playbook" to test autonomous incident containment workflows.
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
              <h3 className="text-base font-bold text-white">NIST SP 800-61 & HIPAA Breach Incident Standards</h3>
              <p className="text-xs text-slate-400 font-mono">Frameworks for automated incident response and regulatory breach notifications</p>
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

      {/* 6. DEPLOY MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full text-slate-100 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Siren size={18} className="text-red-400" /> Deploy Autonomous SOAR Playbook
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleDeployPlaybook} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Playbook Name:</label>
                <input
                  type="text"
                  placeholder="e.g. IoMT Medical Device Ransomware Quarantine"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-sans"
                  value={playbookName}
                  onChange={(e) => setPlaybookName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Target Threat Trigger:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-sans"
                  value={targetTrigger}
                  onChange={(e) => setTargetTrigger(e.target.value)}
                >
                  <option value="Unusual SMB Port 445 File Encryption">Unusual SMB Port 445 File Encryption</option>
                  <option value="Exfiltration > 10,000 EHR Records in 60s">Exfiltration &gt; 10,000 EHR Records in 60s</option>
                  <option value="Unencrypted Medical Image Bucket ACL Change">Unencrypted Medical Image Bucket ACL Change</option>
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
                  Deploy Playbook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
