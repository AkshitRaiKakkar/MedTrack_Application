import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Radar,
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
  Crosshair,
  GitBranch,
  ShieldAlert
} from "lucide-react";
import {
  getCtemAssets,
  onboardCtemAsset,
  runAttackPathSimulation,
  getCtemStandards
} from "../../services/HealthcareCtemService";
import "../../pages/auth/auth.css";

/**
 * HealthcareCtemPanel Component
 * 
 * Healthcare Continuous Threat Exposure Management (CTEM) & Attack Surface Console.
 * Features:
 * 1. Gartner CTEM Framework (Scoping, Discovery, Prioritization, Validation, Mobilization)
 * 2. FIRST EPSS Exploit Probability & CVSS 4.0 Vulnerability Prioritization
 * 3. CISA Known Exploited Vulnerabilities (KEV) Catalog Tracking
 * 4. Attack Surface Path Analysis Simulator Sandbox & Asset Onboarding Modal
 */
export default function HealthcareCtemPanel() {
  // State
  const [assets, setAssets] = useState([]);
  const [standards, setStandards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("ASSETS"); // "ASSETS" | "ATTACK_PATH" | "STANDARDS"

  // Sandbox State
  const [selectedAssetId, setSelectedAssetId] = useState("CTEM-AST-901");
  const [simResult, setSimResult] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [assetName, setAssetName] = useState("");

  // Load telemetry
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [astList, stdList] = await Promise.all([
        getCtemAssets().catch(() => []),
        getCtemStandards().catch(() => [])
      ]);

      setAssets(astList);
      setStandards(stdList);
    } catch (err) {
      console.error("Failed to load healthcare CTEM data:", err);
      setMessage({ type: "error", text: "Failed connecting to Continuous Threat Exposure Management service." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Run Attack Path Sim
  const handleRunAttackPathSim = async (e) => {
    e?.preventDefault();
    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const result = await runAttackPathSimulation(selectedAssetId);
      setSimResult(result);
      setMessage({ type: "success", text: `Attack Path Analysis completed in ${result.simulationLatencyMs}ms! Blast Radius: ${result.attackBlastRadius}` });
    } catch (err) {
      setMessage({ type: "error", text: "Attack Path simulation failed." });
    } finally {
      setActionLoading(false);
    }
  };

  // Onboard Asset
  const handleOnboardAsset = async (e) => {
    e.preventDefault();
    if (!assetName.trim()) return;

    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const newAst = await onboardCtemAsset({ assetName: assetName.trim() });

      setAssetName("");
      setIsModalOpen(false);
      setMessage({ type: "success", text: `CTEM Asset ${newAst.assetId} onboarded to attack surface catalog!` });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "Failed to onboard CTEM asset." });
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const totalAssets = assets.length;
    const criticalExposures = assets.filter((a) => a.exposureVerdict.includes("CRITICAL")).length;
    const cisaKevCount = assets.filter((a) => a.cisaKevStatus === "CISA_KEV_EXPLOITED_VULNERABILITY").length;

    return { totalAssets, criticalExposures, cisaKevCount };
  }, [assets]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* 1. Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-slate-100">
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center gap-1.5 font-mono">
                <Radar size={12} /> CONTINUOUS THREAT EXPOSURE MANAGEMENT (CTEM)
              </span>
              <span className="px-3 py-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1 font-mono">
                <ShieldCheck size={12} /> GARTNER CTEM & EPSS v3.0
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Healthcare CTEM & Attack Surface Exposure
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Gartner 5-phase CTEM framework, FIRST EPSS exploit probability scoring, CISA Known Exploited Vulnerabilities (KEV) catalog tracking, and attack path simulation.
            </p>
          </div>

          {/* Telemetry Widget */}
          <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl w-full lg:w-auto text-xs space-y-2">
            <div className="flex items-center justify-between gap-6 font-mono">
              <span className="text-slate-400 font-sans font-bold uppercase text-[10px]">CTEM Telemetry</span>
              <span className="text-rose-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                SURFACE SCAN ACTIVE
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-700/80 font-mono text-[11px]">
              <div>Scanned Assets: <strong className="text-white">{metrics.totalAssets} Cataloged</strong></div>
              <div>Critical Exposures: <strong className="text-rose-300">{metrics.criticalExposures} Critical</strong></div>
              <div>CISA KEV Vulnerabilities: <strong className="text-rose-400">{metrics.cisaKevCount} Exploited</strong></div>
              <div>Scoring Model: <strong className="text-emerald-400">EPSS v3.0 + CVSS 4.0</strong></div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        {message.text && (
          <div
            className={`mt-6 p-4 rounded-xl text-sm font-medium flex items-center justify-between border ${
              message.type === "error"
                ? "bg-red-500/10 border-red-500/30 text-red-400"
                : "bg-rose-500/10 border-rose-500/30 text-rose-400"
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
            onClick={() => setActiveTab("ASSETS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "ASSETS"
                ? "bg-rose-600 text-white font-black shadow-lg shadow-rose-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Radar size={15} /> Attack Surface Assets ({assets.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ATTACK_PATH")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "ATTACK_PATH"
                ? "bg-rose-600 text-white font-black shadow-lg shadow-rose-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <GitBranch size={15} /> Attack Path Simulator
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("STANDARDS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "STANDARDS"
                ? "bg-rose-600 text-white font-black shadow-lg shadow-rose-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <ShieldCheck size={15} /> Gartner & CISA Standards ({standards.length})
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-rose-600/20"
        >
          <PlusCircle size={15} /> Onboard Attack Surface Asset
        </button>
      </div>

      {/* 3. ASSETS TAB */}
      {activeTab === "ASSETS" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">CTEM Attack Surface Assets & Exploit Probabilities</h3>
              <p className="text-xs text-slate-400 font-mono">CVSS scores, EPSS probabilities, CISA KEV status, and attack surface entry points</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3">Asset ID</th>
                  <th className="p-3">Asset Name & Category</th>
                  <th className="p-3">CVSS / EPSS Exploit Risk</th>
                  <th className="p-3">Attack Surface Vector</th>
                  <th className="p-3">CISA KEV Catalog</th>
                  <th className="p-3 text-right">Verdict</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {assets.map((a, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/60">
                    <td className="p-3 font-bold text-rose-400">{a.assetId}</td>
                    <td className="p-3 font-sans">
                      <div className="font-semibold text-white">{a.assetName}</div>
                      <div className="text-[10px] text-rose-300 font-mono">{a.exposureCategory}</div>
                    </td>
                    <td className="p-3 font-mono text-[10px]">
                      <span className="font-bold text-white">CVSS {a.cvssScore}</span>
                      <div className="text-rose-300">{a.epssExploitProbability}</div>
                    </td>
                    <td className="p-3 text-slate-400 font-mono text-[10px]">{a.attackSurfacePath}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          a.cisaKevStatus === "CISA_KEV_EXPLOITED_VULNERABILITY"
                            ? "bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {a.cisaKevStatus}
                      </span>
                    </td>
                    <td className="p-3 text-right font-sans">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          a.exposureVerdict.includes("CRITICAL")
                            ? "bg-red-500/20 text-red-400 border border-red-500/30"
                            : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        }`}
                      >
                        {a.exposureVerdict}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. ATTACK_PATH TAB */}
      {activeTab === "ATTACK_PATH" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <GitBranch size={18} className="text-rose-400" /> Attack Surface Path Simulator
              </h3>
            </div>

            <form onSubmit={handleRunAttackPathSim} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Target Exposure Asset:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-sans"
                  value={selectedAssetId}
                  onChange={(e) => setSelectedAssetId(e.target.value)}
                >
                  {assets.map((a) => (
                    <option key={a.assetId} value={a.assetId}>
                      {a.assetId} - {a.assetName}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-lg shadow-rose-600/20"
              >
                <Crosshair size={16} /> Simulate Breach Attack Vector & Blast Radius
              </button>
            </form>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-400" /> Attack Path Remediation Output
              </h3>
            </div>

            {simResult ? (
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-sans font-bold uppercase">Simulated Exploit Path:</span>
                  <div className="text-[10px] text-rose-300">{simResult.simulatedExploitPath}</div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px] p-3 bg-slate-950/60 rounded-xl border border-slate-800 font-sans">
                  <div>Blast Radius: <strong className="text-rose-400">{simResult.attackBlastRadius}</strong></div>
                  <div>Remediation: <strong className="text-emerald-400 font-mono text-[10px]">{simResult.remediationAction}</strong></div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-2xl">
                Click "Simulate Breach Attack Vector & Blast Radius" to trace exploit chains and blast radius.
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
              <h3 className="text-base font-bold text-white">Gartner CTEM & CISA KEV Framework Standards</h3>
              <p className="text-xs text-slate-400 font-mono">Specifications for continuous threat exposure management and exploit-driven vulnerability remediation</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {standards.map((s, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded font-bold">
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

      {/* 6. ONBOARD MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full text-slate-100 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Radar size={18} className="text-rose-400" /> Onboard Attack Surface Asset
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleOnboardAsset} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Asset Name:</label>
                <input
                  type="text"
                  placeholder="e.g. Telehealth Web Portal Gateway"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-sans"
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
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
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition shadow-lg shadow-rose-600/20"
                >
                  Onboard to CTEM Catalog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
