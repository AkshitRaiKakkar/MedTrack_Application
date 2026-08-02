import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Brain,
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
  Network,
  Smartphone,
  Globe,
  SlidersHorizontal,
  Zap,
  Bot
} from "lucide-react";
import {
  getClinicalAiModels,
  registerClinicalAiModel,
  runAdversarialAttackSimulation,
  getClinicalAiStandards
} from "../../services/ClinicalAiDefenseService";
import "../../pages/auth/auth.css";

/**
 * ClinicalAiDefensePanel Component
 * 
 * Clinical AI Model Security & Adversarial Attack Defense Console.
 * Features:
 * 1. Clinical AI Model Robustness & Poisoning Protection
 * 2. Fast Gradient Sign Method (FGSM) Adversarial Perturbation Simulator
 * 3. Differential Privacy (DP-SGD Epsilon) Budget Monitoring
 * 4. Model Watermarking & FDA Software as a Medical Device (SAMD) Compliance
 */
export default function ClinicalAiDefensePanel() {
  // State
  const [models, setModels] = useState([]);
  const [standards, setStandards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("MODELS"); // "MODELS" | "STANDARDS"

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modelName, setModelName] = useState("");
  const [architecture, setArchitecture] = useState("DenseNet-121 (FP16 Quantized)");

  // Load telemetry
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [modelList, stdList] = await Promise.all([
        getClinicalAiModels().catch(() => []),
        getClinicalAiStandards().catch(() => [])
      ]);

      setModels(modelList);
      setStandards(stdList);
    } catch (err) {
      console.error("Failed to load clinical AI defense data:", err);
      setMessage({ type: "error", text: "Failed connecting to Clinical AI Defense service." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Run Adversarial Sim
  const handleRunAdversarialSim = async (modelId) => {
    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const result = await runAdversarialAttackSimulation(modelId);
      setMessage({ type: "success", text: `Adversarial Attack Simulation on Model ${modelId} complete! Accuracy: ${result.classificationAccuracyUnderAttack}` });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "Adversarial simulation failed." });
    } finally {
      setActionLoading(false);
    }
  };

  // Register Model
  const handleRegisterModel = async (e) => {
    e.preventDefault();
    if (!modelName.trim()) return;

    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const newMod = await registerClinicalAiModel({
        modelName: modelName.trim(),
        architecture
      });

      setModelName("");
      setIsModalOpen(false);
      setMessage({ type: "success", text: `Clinical AI Model ${newMod.modelId} registered & fortified!` });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "Failed to register clinical AI model." });
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const totalModels = models.length;
    const protectedModels = models.filter((m) => m.securityVerdict === "MODEL_CLEAN_PROTECTED").length;
    const fdaAudited = models.filter((m) => m.fdaSamdStatus.includes("FDA_SAMD")).length;

    return { totalModels, protectedModels, fdaAudited };
  }, [models]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* 1. Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-slate-100">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded-full flex items-center gap-1.5 font-mono">
                <Brain size={12} /> CLINICAL AI DEFENSE
              </span>
              <span className="px-3 py-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1 font-mono">
                <ShieldCheck size={12} /> FGSM & PGD ROBUSTNESS
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Clinical AI Model Security & Adversarial Defense
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Adversarial perturbation defense for diagnostic neural networks, differential privacy budgeting (DP-SGD), model watermarking, and FDA SAMD compliance auditing.
            </p>
          </div>

          {/* Telemetry Widget */}
          <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl w-full lg:w-auto text-xs space-y-2">
            <div className="flex items-center justify-between gap-6 font-mono">
              <span className="text-slate-400 font-sans font-bold uppercase text-[10px]">AI Defense Telemetry</span>
              <span className="text-purple-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                NEURAL GUARD ACTIVE
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-700/80 font-mono text-[11px]">
              <div>Clinical Models: <strong className="text-white">{metrics.totalModels} Deployed</strong></div>
              <div>Protected Status: <strong className="text-purple-300">{metrics.protectedModels} Fortified</strong></div>
              <div>FDA SAMD Audited: <strong className="text-emerald-400">{metrics.fdaAudited} Compliant</strong></div>
              <div>DP-SGD Epsilon: <strong className="text-emerald-400">ENFORCED</strong></div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        {message.text && (
          <div
            className={`mt-6 p-4 rounded-xl text-sm font-medium flex items-center justify-between border ${
              message.type === "error"
                ? "bg-red-500/10 border-red-500/30 text-red-400"
                : "bg-purple-500/10 border-purple-500/30 text-purple-400"
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
            onClick={() => setActiveTab("MODELS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "MODELS"
                ? "bg-purple-600 text-white font-black shadow-lg shadow-purple-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Brain size={15} /> Clinical AI Models ({models.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("STANDARDS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "STANDARDS"
                ? "bg-purple-600 text-white font-black shadow-lg shadow-purple-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <ShieldCheck size={15} /> FDA SAMD & NIST AI Standards ({standards.length})
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-purple-600/20"
        >
          <PlusCircle size={15} /> Register & Fortify AI Model
        </button>
      </div>

      {/* 3. MODELS TAB */}
      {activeTab === "MODELS" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">Clinical AI Diagnostic Models & Robustness Matrix</h3>
              <p className="text-xs text-slate-400 font-mono">Adversarial defense, differential privacy budgets, and watermarking</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3">Model ID</th>
                  <th className="p-3">Model Name & Architecture</th>
                  <th className="p-3">Adversarial Defense</th>
                  <th className="p-3">DP Epsilon</th>
                  <th className="p-3">FDA SAMD Status</th>
                  <th className="p-3 text-right">Adversarial Sim</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {models.map((m, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/60">
                    <td className="p-3 font-bold text-purple-400">{m.modelId}</td>
                    <td className="p-3 font-sans">
                      <div className="font-semibold text-white">{m.modelName}</div>
                      <div className="text-[10px] text-purple-300 font-mono">{m.architecture}</div>
                    </td>
                    <td className="p-3 text-slate-400 font-mono text-[10px]">{m.adversarialDefense}</td>
                    <td className="p-3 text-emerald-400 font-mono text-[10px] font-bold">{m.differentialPrivacyEpsilon}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          m.fdaSamdStatus.includes("FDA_SAMD")
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        {m.fdaSamdStatus}
                      </span>
                    </td>
                    <td className="p-3 text-right font-sans">
                      <button
                        type="button"
                        onClick={() => handleRunAdversarialSim(m.modelId)}
                        disabled={actionLoading}
                        className="px-2.5 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-bold rounded text-[10px] transition border border-purple-500/30 flex items-center gap-1 ml-auto"
                      >
                        <Zap size={12} /> Test Attack
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. STANDARDS TAB */}
      {activeTab === "STANDARDS" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">FDA SAMD & NIST AI Risk Management Standards</h3>
              <p className="text-xs text-slate-400 font-mono">Frameworks for securing clinical machine learning algorithms</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {standards.map((s, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded font-bold">
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

      {/* 5. REGISTER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full text-slate-100 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Brain size={18} className="text-purple-400" /> Register Clinical AI Model
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRegisterModel} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Clinical Model Name:</label>
                <input
                  type="text"
                  placeholder="e.g. MedScan-RadNet"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-sans"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Neural Architecture:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                  value={architecture}
                  onChange={(e) => setArchitecture(e.target.value)}
                >
                  <option value="DenseNet-121 (FP16 Quantized)">DenseNet-121 (FP16 Quantized)</option>
                  <option value="Transformer-XL (Clinical BERT)">Transformer-XL (Clinical BERT)</option>
                  <option value="U-Net Convolutional Network">U-Net Convolutional Network</option>
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
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition shadow-lg shadow-purple-600/20"
                >
                  Register & Fortify
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
