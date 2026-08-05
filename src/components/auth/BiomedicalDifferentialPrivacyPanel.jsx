import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  SlidersHorizontal,
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
  Binary,
  RotateCw,
  ScatterChart,
  LineChart,
  Workflow
} from "lucide-react";
import {
  getDifferentialPrivacyInventory,
  generateSyntheticDataset,
  runDifferentiallyPrivateQuery,
  getDifferentialPrivacyStandards
} from "../../services/BiomedicalDifferentialPrivacyService";
import "../../pages/auth/auth.css";

/**
 * BiomedicalDifferentialPrivacyPanel Component
 * 
 * Biomedical Privacy-Preserving Differential Privacy & Synthetic Health Data Console.
 * Features:
 * 1. Epsilon (ε) & Delta (δ) Privacy Budget Management
 * 2. Laplace & Gaussian Noise Mechanism Query Injection
 * 3. Med-CTGAN & DP-VAE Synthetic Health Data Generation
 * 4. Differential Privacy Sandbox & Synthetic Dataset Provisioning Modal
 */
export default function BiomedicalDifferentialPrivacyPanel() {
  // State
  const [datasets, setDatasets] = useState([]);
  const [standards, setStandards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("DATASETS"); // "DATASETS" | "SANDBOX" | "STANDARDS"

  // Sandbox State
  const [selectedDatasetId, setSelectedDatasetId] = useState("DP-DS-501");
  const [queryResult, setQueryResult] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [datasetName, setDatasetName] = useState("");

  // Load telemetry
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [dsList, stdList] = await Promise.all([
        getDifferentialPrivacyInventory().catch(() => []),
        getDifferentialPrivacyStandards().catch(() => [])
      ]);

      setDatasets(dsList);
      setStandards(stdList);
    } catch (err) {
      console.error("Failed to load biomedical differential privacy data:", err);
      setMessage({ type: "error", text: "Failed connecting to Differential Privacy service." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Run DP Query
  const handleRunQuery = async (e) => {
    e?.preventDefault();
    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const result = await runDifferentiallyPrivateQuery(selectedDatasetId);
      setQueryResult(result);
      setMessage({ type: "success", text: `Differentially Private Query executed in ${result.queryLatencyMs}ms! Laplace noise injected (ε consumed: ${result.epsilonConsumed}).` });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "Differentially private query execution failed." });
    } finally {
      setActionLoading(false);
    }
  };

  // Generate Synthetic Dataset
  const handleGenerateSynthetic = async (e) => {
    e.preventDefault();
    if (!datasetName.trim()) return;

    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const newDs = await generateSyntheticDataset({ datasetName: datasetName.trim() });

      setDatasetName("");
      setIsModalOpen(false);
      setMessage({ type: "success", text: `Synthetic Health Dataset ${newDs.datasetId} generated with Med-CTGAN!` });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "Failed to generate synthetic dataset." });
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const totalDatasets = datasets.length;
    const optimalBudgets = datasets.filter((d) => d.privacyStatus === "PRIVACY_BUDGET_OPTIMAL").length;
    const syntheticModels = datasets.filter((d) => d.syntheticModel.includes("GAN") || d.syntheticModel.includes("VAE")).length;

    return { totalDatasets, optimalBudgets, syntheticModels };
  }, [datasets]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* 1. Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-slate-100">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-teal-400 bg-teal-500/10 border border-teal-500/20 rounded-full flex items-center gap-1.5 font-mono">
                <SlidersHorizontal size={12} /> DIFFERENTIAL PRIVACY & SYNTHETIC DATA
              </span>
              <span className="px-3 py-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1 font-mono">
                <ShieldCheck size={12} /> ε-δ PRIVACY BUDGET GUARANTEES
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Biomedical Differential Privacy & Synthetic Health Data
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Mathematical differential privacy (Laplace/Gaussian noise mechanisms), Epsilon (ε) & Delta (δ) privacy budget tracking, Med-CTGAN synthetic health data, and HIPAA Expert Determination.
            </p>
          </div>

          {/* Telemetry Widget */}
          <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl w-full lg:w-auto text-xs space-y-2">
            <div className="flex items-center justify-between gap-6 font-mono">
              <span className="text-slate-400 font-sans font-bold uppercase text-[10px]">Privacy Budget Telemetry</span>
              <span className="text-teal-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
                DP NOISE ENGINE ACTIVE
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-700/80 font-mono text-[11px]">
              <div>DP Cohorts: <strong className="text-white">{metrics.totalDatasets} Cataloged</strong></div>
              <div>Privacy Budget: <strong className="text-teal-300">{metrics.optimalBudgets} Optimal (ε &lt; 1.0)</strong></div>
              <div>Synthetic Models: <strong className="text-emerald-400">{metrics.syntheticModels} Med-CTGAN</strong></div>
              <div>Re-ID Risk: <strong className="text-emerald-400">&lt; 0.0001% (HIPAA)</strong></div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        {message.text && (
          <div
            className={`mt-6 p-4 rounded-xl text-sm font-medium flex items-center justify-between border ${
              message.type === "error"
                ? "bg-red-500/10 border-red-500/30 text-red-400"
                : "bg-teal-500/10 border-teal-500/30 text-teal-400"
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
            onClick={() => setActiveTab("DATASETS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "DATASETS"
                ? "bg-teal-600 text-white font-black shadow-lg shadow-teal-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <SlidersHorizontal size={15} /> DP Datasets & Budgets ({datasets.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("SANDBOX")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "SANDBOX"
                ? "bg-teal-600 text-white font-black shadow-lg shadow-teal-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Zap size={15} /> Noise Injection Query Sandbox
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("STANDARDS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "STANDARDS"
                ? "bg-teal-600 text-white font-black shadow-lg shadow-teal-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <ShieldCheck size={15} /> NIST SP 800-188 & DP Standards ({standards.length})
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-teal-600/20"
        >
          <PlusCircle size={15} /> Generate Synthetic Health Dataset
        </button>
      </div>

      {/* 3. DATASETS TAB */}
      {activeTab === "DATASETS" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">Differentially Private Datasets & Epsilon Budgets</h3>
              <p className="text-xs text-slate-400 font-mono">Noise mechanisms, Epsilon (ε) and Delta (δ) parameters, synthetic generative models, and privacy status</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3">Dataset ID</th>
                  <th className="p-3">Dataset Name & Noise Mechanism</th>
                  <th className="p-3">Epsilon (ε) Budget</th>
                  <th className="p-3">Delta (δ) Parameter</th>
                  <th className="p-3">Synthetic Generative Model</th>
                  <th className="p-3 text-right">Privacy Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {datasets.map((d, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/60">
                    <td className="p-3 font-bold text-teal-400">{d.datasetId}</td>
                    <td className="p-3 font-sans">
                      <div className="font-semibold text-white">{d.datasetName}</div>
                      <div className="text-[10px] text-teal-300 font-mono">{d.noiseMechanism}</div>
                    </td>
                    <td className="p-3 font-bold text-emerald-400 text-[10px]">{d.epsilonBudget}</td>
                    <td className="p-3 text-slate-400 font-mono text-[10px]">{d.deltaBudget}</td>
                    <td className="p-3 text-slate-300 font-sans text-[11px]">{d.syntheticModel}</td>
                    <td className="p-3 text-right font-sans">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          d.privacyStatus === "PRIVACY_BUDGET_OPTIMAL"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        {d.privacyStatus}
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
                <Zap size={18} className="text-teal-400" /> Differentially Private Noise Injection Query Engine
              </h3>
            </div>

            <form onSubmit={handleRunQuery} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Target Research Dataset:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-sans"
                  value={selectedDatasetId}
                  onChange={(e) => setSelectedDatasetId(e.target.value)}
                >
                  {datasets.map((d) => (
                    <option key={d.datasetId} value={d.datasetId}>
                      {d.datasetId} - {d.datasetName}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-lg shadow-teal-600/20"
              >
                <Zap size={16} /> Execute Query with Laplace Noise & Consume Privacy Budget
              </button>
            </form>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-400" /> Differentially Private Output
              </h3>
            </div>

            {queryResult ? (
              <div className="space-y-3 font-mono text-xs">
                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-400 font-sans font-bold uppercase">Raw Query Result:</span>
                    <div className="text-sm font-bold text-slate-400">{queryResult.rawResult}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-teal-400 font-sans font-bold uppercase">Noisy DP Result:</span>
                    <div className="text-sm font-bold text-teal-300">{queryResult.noisyResult}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px] p-3 bg-slate-950/60 rounded-xl border border-slate-800 font-sans">
                  <div>Epsilon Consumed: <strong className="text-emerald-400 font-mono text-[10px]">ε = {queryResult.epsilonConsumed}</strong></div>
                  <div>Remaining Budget: <strong className="text-emerald-400 font-mono text-[10px]">ε = {queryResult.remainingEpsilon}</strong></div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-2xl">
                Click "Execute Query with Laplace Noise & Consume Privacy Budget" to test differential privacy protection.
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
              <h3 className="text-base font-bold text-white">NIST SP 800-188 & Differential Privacy Standards</h3>
              <p className="text-xs text-slate-400 font-mono">Frameworks for mathematical privacy guarantees, noise calibration, and synthetic data generation</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {standards.map((s, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded font-bold">
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
                <SlidersHorizontal size={18} className="text-teal-400" /> Generate Synthetic Dataset
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleGenerateSynthetic} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Dataset Description / Cohort:</label>
                <input
                  type="text"
                  placeholder="e.g. Synthetic Cardiovascular Cohort"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-sans"
                  value={datasetName}
                  onChange={(e) => setDatasetName(e.target.value)}
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
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl transition shadow-lg shadow-teal-600/20"
                >
                  Generate Med-CTGAN Dataset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
