import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Cpu,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Sliders,
  Terminal,
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
  Network,
  Smartphone,
  Globe,
  SlidersHorizontal,
  Bot,
  BrainCircuit,
  BarChart3,
  Scale
} from "lucide-react";
import {
  getAiModels,
  registerAiModel,
  runFairnessAudit,
  getEuAiActCategories
} from "../../services/AiModelGovernanceService";
import "../../pages/auth/auth.css";

/**
 * AiModelGovernancePanel Component
 * 
 * Healthcare AI Model Risk & Algorithmic Bias Governance Command Center.
 * Features:
 * 1. EU AI Act Risk Tier Audit & Classification Engine
 * 2. Demographic Parity & Disparate Impact Fairness Sandbox
 * 3. Model Concept Drift Monitoring & Telemetry
 * 4. Clinical AI Model Registration & Governance Ledger
 */
export default function AiModelGovernancePanel() {
  // State
  const [models, setModels] = useState([]);
  const [euCategories, setEuCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("REGISTRY"); // "REGISTRY" | "FAIRNESS" | "EU_AI_ACT"

  // Fairness Audit State
  const [selectedAuditModelId, setSelectedAuditModelId] = useState("AI-MDL-701");
  const [protectedAttribute, setProtectedAttribute] = useState("GENDER");
  const [auditResult, setAuditResult] = useState(null);

  // New Model Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modelName, setModelName] = useState("");
  const [version, setVersion] = useState("v1.0.0");
  const [framework, setFramework] = useState("PyTorch 2.2");
  const [euRiskCategory, setEuRiskCategory] = useState("HIGH_RISK");

  // Load telemetry
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [modelList, euList] = await Promise.all([
        getAiModels().catch(() => []),
        getEuAiActCategories().catch(() => [])
      ]);

      setModels(modelList);
      setEuCategories(euList);
      if (modelList.length > 0) {
        setSelectedAuditModelId(modelList[0].modelId);
      }
    } catch (err) {
      console.error("Failed to load AI model governance data:", err);
      setMessage({ type: "error", text: "Failed connecting to AI governance service." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Execute Fairness Audit
  const handleRunAudit = async (e) => {
    e?.preventDefault();

    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const result = await runFairnessAudit(selectedAuditModelId, protectedAttribute);
      setAuditResult(result);
      setMessage({ type: "success", text: `Algorithmic Fairness Audit executed! Disparate Impact Ratio: ${result.disparateImpactRatio}` });
    } catch (err) {
      setMessage({ type: "error", text: "Fairness audit processing failed." });
    } finally {
      setActionLoading(false);
    }
  };

  // Create Model Registration
  const handleRegisterModel = async (e) => {
    e.preventDefault();
    if (!modelName.trim()) return;

    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const newModel = await registerAiModel({
        modelName: modelName.trim(),
        version,
        framework,
        euRiskCategory
      });

      setModelName("");
      setIsModalOpen(false);
      setMessage({ type: "success", text: `AI Model ${newModel.modelId} registered for governance audit!` });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "Failed to register AI model." });
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const totalModels = models.length;
    const highRiskModels = models.filter((m) => m.euRiskCategory === "HIGH_RISK").length;
    const driftedModels = models.filter((m) => m.driftStatus !== "STABLE").length;
    const approvedModels = models.filter((m) => m.status === "APPROVED_FOR_CLINICAL_USE").length;

    return { totalModels, highRiskModels, driftedModels, approvedModels };
  }, [models]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* 1. Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-slate-100">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 rounded-full flex items-center gap-1.5 font-mono">
                <BrainCircuit size={12} /> EU AI ACT COMPLIANT
              </span>
              <span className="px-3 py-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1 font-mono">
                <Scale size={12} /> ALGORITHMIC FAIRNESS ENGINE
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              AI Model Risk & Algorithmic Bias Governance Console
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Clinical AI model registration, EU AI Act risk tier compliance, demographic parity bias auditing, and continuous concept drift tracking.
            </p>
          </div>

          {/* Telemetry Widget */}
          <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl w-full lg:w-auto text-xs space-y-2">
            <div className="flex items-center justify-between gap-6 font-mono">
              <span className="text-slate-400 font-sans font-bold uppercase text-[10px]">Clinical AI Governance</span>
              <span className="text-cyan-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                MONITORED
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-700/80 font-mono text-[11px]">
              <div>Models Registered: <strong className="text-white">{metrics.totalModels} Active</strong></div>
              <div>EU High-Risk Models: <strong className="text-amber-400">{metrics.highRiskModels} Classed</strong></div>
              <div>Drift Alerts: <strong className="text-red-400">{metrics.driftedModels} Flagged</strong></div>
              <div>Approved Clinical: <strong className="text-emerald-400">{metrics.approvedModels} Verified</strong></div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        {message.text && (
          <div
            className={`mt-6 p-4 rounded-xl text-sm font-medium flex items-center justify-between border ${
              message.type === "error"
                ? "bg-red-500/10 border-red-500/30 text-red-400"
                : "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
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
            onClick={() => setActiveTab("REGISTRY")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "REGISTRY"
                ? "bg-cyan-600 text-white font-black shadow-lg shadow-cyan-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Bot size={15} /> Model Registry ({models.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("FAIRNESS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "FAIRNESS"
                ? "bg-cyan-600 text-white font-black shadow-lg shadow-cyan-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Scale size={15} /> Fairness & Bias Audit
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("EU_AI_ACT")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "EU_AI_ACT"
                ? "bg-cyan-600 text-white font-black shadow-lg shadow-cyan-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <BrainCircuit size={15} /> EU AI Act Matrix ({euCategories.length})
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-cyan-600/20"
        >
          <PlusCircle size={15} /> Register AI Model
        </button>
      </div>

      {/* 3. MODEL REGISTRY TAB */}
      {activeTab === "REGISTRY" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">Registered Clinical AI/ML Models</h3>
              <p className="text-xs text-slate-400 font-mono">EU AI Act risk classification, disparate impact metrics, and concept drift status</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3">Model ID</th>
                  <th className="p-3">Model Name & Framework</th>
                  <th className="p-3">EU Risk Category</th>
                  <th className="p-3">Disparate Impact</th>
                  <th className="p-3">Drift State</th>
                  <th className="p-3 text-right">Approval Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {models.map((m, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/60">
                    <td className="p-3 font-bold text-cyan-400">{m.modelId}</td>
                    <td className="p-3 font-sans">
                      <div className="font-semibold text-white">{m.modelName}</div>
                      <div className="text-[10px] text-cyan-300 font-mono">{m.framework} ({m.version})</div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        {m.euRiskCategory}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-slate-200">
                      {m.biasDisparateImpactRatio} <span className="text-[10px] text-slate-500">(4/5ths Rule)</span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          m.driftStatus === "STABLE"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-red-500/20 text-red-400 border border-red-500/30"
                        }`}
                      >
                        {m.driftStatus}
                      </span>
                    </td>
                    <td className="p-3 text-right font-sans">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          m.status === "APPROVED_FOR_CLINICAL_USE"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. FAIRNESS AUDIT TAB */}
      {activeTab === "FAIRNESS" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Input Config */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Scale size={18} className="text-cyan-400" /> Algorithmic Bias Audit Configurator
              </h3>
            </div>

            <form onSubmit={handleRunAudit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Target AI Model:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono"
                  value={selectedAuditModelId}
                  onChange={(e) => setSelectedAuditModelId(e.target.value)}
                >
                  {models.map((m) => (
                    <option key={m.modelId} value={m.modelId}>{m.modelId} - {m.modelName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Protected Demographic Attribute:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono"
                  value={protectedAttribute}
                  onChange={(e) => setProtectedAttribute(e.target.value)}
                >
                  <option value="GENDER">GENDER / SEX</option>
                  <option value="AGE_GROUP">AGE COHORT (&gt; 65yo)</option>
                  <option value="ETHNICITY">ETHNICITY / RACE</option>
                  <option value="INSURANCE_TIER">INSURANCE / PAYER STATUS</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-lg shadow-cyan-600/20"
              >
                <Scale size={16} /> Run Demographic Parity Audit
              </button>
            </form>
          </div>

          {/* Right Column: Audit Output */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-400" /> Fairness Audit Verdict Output
              </h3>
            </div>

            {auditResult ? (
              <div className="space-y-4 font-mono text-xs">
                <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-2">
                  <span className="text-[10px] text-slate-400 font-sans uppercase tracking-wider font-bold">Disparate Impact Ratio (4/5ths Rule)</span>
                  <div className="text-4xl font-black text-cyan-400">{auditResult.disparateImpactRatio}</div>
                  <div className="pt-2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {auditResult.fourFifthsRuleStatus}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Demographic Parity Diff:</span>
                    <strong className="text-emerald-400">{auditResult.demographicParityDifference}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Equalized Odds Diff:</span>
                    <strong className="text-cyan-300">{auditResult.equalizedOddsDifference}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Sample Cohort Size:</span>
                    <strong className="text-white">{auditResult.sampleSizeEvaluated.toLocaleString()} Patients</strong>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-2xl">
                Click "Run Demographic Parity Audit" to calculate algorithmic fairness metrics.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. EU AI ACT TAB */}
      {activeTab === "EU_AI_ACT" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">EU AI Act Risk Classification Matrix</h3>
              <p className="text-xs text-slate-400 font-mono">European Union Artificial Intelligence Regulation risk tiers for healthcare AI</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {euCategories.map((c, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded font-bold">
                    {c.tier}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white">{c.label}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{c.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. REGISTER MODEL MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full text-slate-100 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Bot size={18} className="text-cyan-400" /> Register Clinical AI Model
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRegisterModel} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Model Name:</label>
                <input
                  type="text"
                  placeholder="e.g. Sepsis Early Warning Classifier"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-sans"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Version:</label>
                  <input
                    type="text"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Framework:</label>
                  <input
                    type="text"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono"
                    value={framework}
                    onChange={(e) => setFramework(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">EU AI Act Risk Category:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono"
                  value={euRiskCategory}
                  onChange={(e) => setEuRiskCategory(e.target.value)}
                >
                  <option value="HIGH_RISK">HIGH RISK CLINICAL AI</option>
                  <option value="LIMITED_RISK">LIMITED RISK CHATBOT</option>
                  <option value="MINIMAL_RISK">MINIMAL / NO RISK</option>
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
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition shadow-lg shadow-cyan-600/20"
                >
                  Register Model
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
