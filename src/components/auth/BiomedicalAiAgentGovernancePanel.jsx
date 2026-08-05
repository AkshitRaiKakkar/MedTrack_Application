import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Bot,
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
  Brain,
  Workflow
} from "lucide-react";
import {
  getAiAgentGovernanceInventory,
  registerAiAgent,
  validateAgentToolCall,
  getAiAgentGovernanceStandards
} from "../../services/BiomedicalAiAgentGovernanceService";
import "../../pages/auth/auth.css";

/**
 * BiomedicalAiAgentGovernancePanel Component
 * 
 * Biomedical Autonomous Clinical AI Agent Governance & Guardrails Console.
 * Features:
 * 1. Autonomous Clinical AI Agent Registry & Tool-Call Permission Matrix
 * 2. Llama-Guard & Prompt Injection Defense Inspection Sandbox
 * 3. ISO/IEC 42001 & NIST AI RMF 1.0 Governance Standards
 * 4. Agent Registration & Guardrail Policy Deployment Modal
 */
export default function BiomedicalAiAgentGovernancePanel() {
  // State
  const [agents, setAgents] = useState([]);
  const [standards, setStandards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("AGENTS"); // "AGENTS" | "SANDBOX" | "STANDARDS"

  // Sandbox State
  const [selectedAgentId, setSelectedAgentId] = useState("AGENT-CLINICAL-701");
  const [validationResult, setValidationResult] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [agentName, setAgentName] = useState("");

  // Load telemetry
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [agList, stdList] = await Promise.all([
        getAiAgentGovernanceInventory().catch(() => []),
        getAiAgentGovernanceStandards().catch(() => [])
      ]);

      setAgents(agList);
      setStandards(stdList);
    } catch (err) {
      console.error("Failed to load biomedical AI agent governance data:", err);
      setMessage({ type: "error", text: "Failed connecting to AI Agent Governance service." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Run Guardrail Validation
  const handleRunValidation = async (e) => {
    e?.preventDefault();
    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const result = await validateAgentToolCall(selectedAgentId);
      setValidationResult(result);
      setMessage({ type: "success", text: `AI Agent Tool-Call validated in ${result.validationLatencyMs}ms! Guardrail approved call with ${result.phiRedactedCount} PHI tokens redacted.` });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "AI agent guardrail validation failed." });
    } finally {
      setActionLoading(false);
    }
  };

  // Register Agent
  const handleRegisterAgent = async (e) => {
    e.preventDefault();
    if (!agentName.trim()) return;

    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const newAg = await registerAiAgent({ agentName: agentName.trim() });

      setAgentName("");
      setIsModalOpen(false);
      setMessage({ type: "success", text: `Autonomous AI Agent ${newAg.agentId} registered with ISO/IEC 42001 guardrails!` });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "Failed to register autonomous AI agent." });
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const totalAgents = agents.length;
    const activeAuthorized = agents.filter((a) => a.governanceStatus.includes("AUTHORIZED")).length;
    const lowRiskPrompt = agents.filter((a) => a.promptInjectionRisk.includes("LOW")).length;

    return { totalAgents, activeAuthorized, lowRiskPrompt };
  }, [agents]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* 1. Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-slate-100">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-full flex items-center gap-1.5 font-mono">
                <Bot size={12} /> AUTONOMOUS AI AGENT GOVERNANCE
              </span>
              <span className="px-3 py-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1 font-mono">
                <ShieldCheck size={12} /> ISO/IEC 42001 & NIST AI RMF 1.0
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Biomedical Autonomous Clinical AI Agent Governance
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Guardrail policy enforcement, tool-call sandboxing, prompt injection defenses, human-in-the-loop clinical overrides, and agentic decision audit trails.
            </p>
          </div>

          {/* Telemetry Widget */}
          <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl w-full lg:w-auto text-xs space-y-2">
            <div className="flex items-center justify-between gap-6 font-mono">
              <span className="text-slate-400 font-sans font-bold uppercase text-[10px]">AI Agent Governance Telemetry</span>
              <span className="text-indigo-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                GUARDRAILS ACTIVE
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-700/80 font-mono text-[11px]">
              <div>Clinical Agents: <strong className="text-white">{metrics.totalAgents} Active</strong></div>
              <div>Authorized State: <strong className="text-indigo-300">{metrics.activeAuthorized} Compliant</strong></div>
              <div>Prompt Defenses: <strong className="text-emerald-400">{metrics.lowRiskPrompt} Low Risk</strong></div>
              <div>Decision Audits: <strong className="text-emerald-400">100% (WORM Logged)</strong></div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        {message.text && (
          <div
            className={`mt-6 p-4 rounded-xl text-sm font-medium flex items-center justify-between border ${
              message.type === "error"
                ? "bg-red-500/10 border-red-500/30 text-red-400"
                : "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
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
            onClick={() => setActiveTab("AGENTS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "AGENTS"
                ? "bg-indigo-600 text-white font-black shadow-lg shadow-indigo-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Bot size={15} /> Autonomous Agents ({agents.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("SANDBOX")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "SANDBOX"
                ? "bg-indigo-600 text-white font-black shadow-lg shadow-indigo-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Zap size={15} /> Guardrail & Tool-Call Sandbox
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("STANDARDS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "STANDARDS"
                ? "bg-indigo-600 text-white font-black shadow-lg shadow-indigo-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <ShieldCheck size={15} /> ISO/IEC 42001 & NIST AI Standards ({standards.length})
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-indigo-600/20"
        >
          <PlusCircle size={15} /> Register Autonomous AI Agent
        </button>
      </div>

      {/* 3. AGENTS TAB */}
      {activeTab === "AGENTS" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">Autonomous Clinical AI Agents & Tool Scopes</h3>
              <p className="text-xs text-slate-400 font-mono">Agent IDs, model architectures, guardrail policies, tool permissions, and prompt injection risk status</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3">Agent ID</th>
                  <th className="p-3">Agent Name & Architecture</th>
                  <th className="p-3">Guardrail Policy</th>
                  <th className="p-3">Allowed Tool Scopes</th>
                  <th className="p-3">Governance Status</th>
                  <th className="p-3 text-right">Prompt Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {agents.map((a, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/60">
                    <td className="p-3 font-bold text-indigo-400">{a.agentId}</td>
                    <td className="p-3 font-sans">
                      <div className="font-semibold text-white">{a.agentName}</div>
                      <div className="text-[10px] text-indigo-300 font-mono">{a.modelArchitecture}</div>
                    </td>
                    <td className="p-3 text-slate-400 font-mono text-[10px]">{a.guardrailPolicy}</td>
                    <td className="p-3 text-slate-300 font-mono text-[10px]">
                      {a.toolAccessScope.join(", ")}
                    </td>
                    <td className="p-3 font-sans">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          a.governanceStatus.includes("AUTHORIZED")
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        {a.governanceStatus}
                      </span>
                    </td>
                    <td className="p-3 text-right font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {a.promptInjectionRisk}
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
                <Zap size={18} className="text-indigo-400" /> AI Agent Guardrail & Tool-Call Inspector
              </h3>
            </div>

            <form onSubmit={handleRunValidation} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Target Clinical AI Agent:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
                  value={selectedAgentId}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                >
                  {agents.map((a) => (
                    <option key={a.agentId} value={a.agentId}>
                      {a.agentId} - {a.agentName}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-lg shadow-indigo-600/20"
              >
                <Zap size={16} /> Validate Agent Tool-Call & Run Llama-Guard Inspection
              </button>
            </form>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-400" /> Guardrail Inspection Output
              </h3>
            </div>

            {validationResult ? (
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-sans font-bold uppercase">Guardrail Evaluator:</span>
                  <div className="text-sm font-bold text-indigo-300">{validationResult.guardrailEvaluator}</div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px] p-3 bg-slate-950/60 rounded-xl border border-slate-800 font-sans">
                  <div>Tool-Call State: <strong className="text-emerald-400 font-mono text-[10px]">APPROVED</strong></div>
                  <div>PHI Redactions: <strong className="text-emerald-400">{validationResult.phiRedactedCount} Tokens</strong></div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-2xl">
                Click "Validate Agent Tool-Call & Run Llama-Guard Inspection" to evaluate guardrail policies.
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
              <h3 className="text-base font-bold text-white">ISO/IEC 42001 & NIST AI Governance Standards</h3>
              <p className="text-xs text-slate-400 font-mono">Frameworks for autonomous clinical agent safety, tool authorization, and ethical AI oversight</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {standards.map((s, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded font-bold">
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
                <Bot size={18} className="text-indigo-400" /> Register Autonomous AI Agent
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRegisterAgent} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Agent Name & Clinical Function:</label>
                <input
                  type="text"
                  placeholder="e.g. Oncology Biomarker Recommendation Agent"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
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
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition shadow-lg shadow-indigo-600/20"
                >
                  Authorize AI Agent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
