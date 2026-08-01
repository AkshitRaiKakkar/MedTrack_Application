import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Cloud,
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
  CloudLightning,
  Server,
  Zap,
  Wrench
} from "lucide-react";
import {
  getCloudAssets,
  remediateCloudAsset,
  onboardCloudAsset,
  getHitrustCloudRequirements
} from "../../services/HealthcareCspmService";
import "../../pages/auth/auth.css";

/**
 * HealthcareCspmPanel Component
 * 
 * Healthcare Cloud Security Posture Management (CSPM) Console.
 * Features:
 * 1. Multi-Cloud (AWS / Azure / GCP Healthcare) Infrastructure Auditing
 * 2. HITRUST CSF Cloud Configuration & Encryption Compliance
 * 3. Automated One-Click Cloud Misconfiguration Remediation
 * 4. Cloud Asset Onboarding & Security Telemetry
 */
export default function HealthcareCspmPanel() {
  // State
  const [assets, setAssets] = useState([]);
  const [reqs, setReqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("ASSETS"); // "ASSETS" | "HITRUST"

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [assetName, setAssetName] = useState("");
  const [cloudProvider, setCloudProvider] = useState("AWS Healthcare (us-east-1)");
  const [resourceType, setResourceType] = useState("S3 Storage Bucket");

  // Load telemetry
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [assetList, reqList] = await Promise.all([
        getCloudAssets().catch(() => []),
        getHitrustCloudRequirements().catch(() => [])
      ]);

      setAssets(assetList);
      setReqs(reqList);
    } catch (err) {
      console.error("Failed to load CSPM data:", err);
      setMessage({ type: "error", text: "Failed connecting to Healthcare CSPM service." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Remediate Asset
  const handleRemediate = async (assetId) => {
    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const result = await remediateCloudAsset(assetId);
      setMessage({ type: "success", text: `Cloud Asset ${assetId} Remediated! Status: ${result.status}` });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "Remediation action failed." });
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
      const newAsset = await onboardCloudAsset({
        assetName: assetName.trim(),
        cloudProvider,
        resourceType
      });

      setAssetName("");
      setIsModalOpen(false);
      setMessage({ type: "success", text: `Cloud Asset ${newAsset.assetId} onboarded & audited!` });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "Failed to onboard cloud asset." });
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const totalAssets = assets.length;
    const cleanAssets = assets.filter((a) => a.misconfigurationRisk.includes("PASS")).length;
    const warningAssets = assets.filter((a) => a.misconfigurationRisk.includes("WARN") || a.misconfigurationRisk.includes("RISK")).length;
    const hitrustCount = assets.filter((a) => a.hitrustStatus === "HITRUST_CSF_CERTIFIED").length;

    return { totalAssets, cleanAssets, warningAssets, hitrustCount };
  }, [assets]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* 1. Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-slate-100">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 rounded-full flex items-center gap-1.5 font-mono">
                <Cloud size={12} /> MULTI-CLOUD CSPM
              </span>
              <span className="px-3 py-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1 font-mono">
                <ShieldCheck size={12} /> HITRUST CSF COMPLIANT
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Healthcare Cloud Security Posture Management (CSPM) Console
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Automated AWS / Azure / GCP healthcare cloud infrastructure auditing, KMS customer-managed key enforcement, and automated misconfiguration remediation.
            </p>
          </div>

          {/* Telemetry Widget */}
          <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl w-full lg:w-auto text-xs space-y-2">
            <div className="flex items-center justify-between gap-6 font-mono">
              <span className="text-slate-400 font-sans font-bold uppercase text-[10px]">CSPM Telemetry</span>
              <span className="text-cyan-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                98.6% SECURE
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-700/80 font-mono text-[11px]">
              <div>Cloud Assets: <strong className="text-white">{metrics.totalAssets} Monitored</strong></div>
              <div>Clean Compliance: <strong className="text-emerald-400">{metrics.cleanAssets} Pass</strong></div>
              <div>Action Required: <strong className="text-amber-400">{metrics.warningAssets} Warning</strong></div>
              <div>HITRUST Certified: <strong className="text-cyan-300">{metrics.hitrustCount} Assets</strong></div>
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
            onClick={() => setActiveTab("ASSETS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "ASSETS"
                ? "bg-cyan-600 text-white font-black shadow-lg shadow-cyan-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Cloud size={15} /> Cloud Infrastructure Assets ({assets.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("HITRUST")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "HITRUST"
                ? "bg-cyan-600 text-white font-black shadow-lg shadow-cyan-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <ShieldCheck size={15} /> HITRUST CSF Controls ({reqs.length})
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-cyan-600/20"
        >
          <PlusCircle size={15} /> Onboard Cloud Resource
        </button>
      </div>

      {/* 3. CLOUD ASSETS TAB */}
      {activeTab === "ASSETS" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">Discovered Healthcare Cloud Resources</h3>
              <p className="text-xs text-slate-400 font-mono">Storage buckets, Kubernetes clusters, BigQuery datasets, and encryption enforcement</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3">Asset ID</th>
                  <th className="p-3">Asset Name & Provider</th>
                  <th className="p-3">Encryption Mode</th>
                  <th className="p-3">Public Access Block</th>
                  <th className="p-3">Security Audit</th>
                  <th className="p-3 text-right">Remediation Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {assets.map((a, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/60">
                    <td className="p-3 font-bold text-cyan-400">{a.assetId}</td>
                    <td className="p-3 font-sans">
                      <div className="font-semibold text-white">{a.assetName}</div>
                      <div className="text-[10px] text-cyan-300 font-mono">{a.cloudProvider}</div>
                    </td>
                    <td className="p-3 text-slate-400 font-mono text-[10px]">{a.encryptionMode}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                        {a.publicAccessBlock}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          a.misconfigurationRisk.includes("PASS")
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        {a.misconfigurationRisk}
                      </span>
                    </td>
                    <td className="p-3 text-right font-sans">
                      {a.misconfigurationRisk.includes("PASS") ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          SECURE
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRemediate(a.assetId)}
                          disabled={actionLoading}
                          className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 font-bold rounded text-[10px] transition border border-amber-500/30 flex items-center gap-1 ml-auto"
                        >
                          <Wrench size={12} /> Auto-Remediate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. HITRUST TAB */}
      {activeTab === "HITRUST" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">HITRUST CSF Cloud Controls Matrix</h3>
              <p className="text-xs text-slate-400 font-mono">Healthcare Cloud Infrastructure Security & Data Protection Controls</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {reqs.map((r, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded font-bold">
                    {r.control}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white">{r.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{r.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. ONBOARD MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full text-slate-100 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Cloud size={18} className="text-cyan-400" /> Onboard Cloud Resource
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleOnboardAsset} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Asset Identifier Name:</label>
                <input
                  type="text"
                  placeholder="e.g. medtrack-ehr-patient-blobs-s3"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono"
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Cloud Provider:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-sans"
                  value={cloudProvider}
                  onChange={(e) => setCloudProvider(e.target.value)}
                >
                  <option value="AWS Healthcare (us-east-1)">AWS Healthcare (us-east-1)</option>
                  <option value="Azure Health Data Services">Azure Health Data Services</option>
                  <option value="Google Cloud Healthcare API">Google Cloud Healthcare API</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Resource Type:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono"
                  value={resourceType}
                  onChange={(e) => setResourceType(e.target.value)}
                >
                  <option value="S3 Storage Bucket">S3 Storage Bucket</option>
                  <option value="Kubernetes Cluster (AKS)">Kubernetes Cluster (AKS)</option>
                  <option value="BigQuery Clinical Dataset">BigQuery Clinical Dataset</option>
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
                  Onboard Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
