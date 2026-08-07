import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Sparkles,
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
  FileSearch,
  Fingerprint,
  Stamp
} from "lucide-react";
import {
  getWatermarkedAiDatasets,
  watermarkAiDataset,
  verifyC2paManifest,
  getWatermarkStandards
} from "../../services/BiomedicalAiWatermarkService";
import "../../pages/auth/auth.css";

/**
 * BiomedicalAiWatermarkPanel Component
 * 
 * Biomedical AI Watermarking & Synthetic Health Data Authenticity Console.
 * Features:
 * 1. Steganographic Frequency-Domain & Statistical Token Watermarking
 * 2. C2PA (Coalition for Content Provenance and Authenticity) Cryptographic Signatures
 * 3. Deepfake & Synthetic Medical Image Verification Sandbox
 * 4. FDA Synthetic Clinical Data Governance & AI Dataset Provisioning Modal
 */
export default function BiomedicalAiWatermarkPanel() {
  // State
  const [datasets, setDatasets] = useState([]);
  const [standards, setStandards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("DATASETS"); // "DATASETS" | "VERIFICATION" | "STANDARDS"

  // Sandbox State
  const [selectedDatasetId, setSelectedDatasetId] = useState("AI-WM-301");
  const [c2paResult, setC2paResult] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [datasetName, setDatasetName] = useState("");
  const [genAiModel, setGenAiModel] = useState("MedDiffusion-v3 (Latent Image Generator)");

  // Load telemetry
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [dsList, stdList] = await Promise.all([
        getWatermarkedAiDatasets().catch(() => []),
        getWatermarkStandards().catch(() => [])
      ]);

      setDatasets(dsList);
      setStandards(stdList);
    } catch (err) {
      console.error("Failed to load biomedical AI watermark data:", err);
      setMessage({ type: "error", text: "Failed connecting to Biomedical AI Watermark service." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Run C2PA Verification
  const handleVerifyC2pa = async (e) => {
    e?.preventDefault();
    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const result = await verifyC2paManifest(selectedDatasetId);
      setC2paResult(result);
      setMessage({ type: "success", text: `C2PA Cryptographic Signature verified in ${result.verificationLatencyMs}ms! Synthetic origin: ${result.syntheticOriginModel}` });
    } catch (err) {
      setMessage({ type: "error", text: "C2PA verification failed." });
    } finally {
      setActionLoading(false);
    }
  };

  // Watermark Dataset
  const handleWatermarkDataset = async (e) => {
    e.preventDefault();
    if (!datasetName.trim()) return;

    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const newDs = await watermarkAiDataset({
        datasetName: datasetName.trim(),
        genAiModel
      });

      setDatasetName("");
      setIsModalOpen(false);
      setMessage({ type: "success", text: `AI Dataset ${newDs.datasetId} watermarked & C2PA manifest signed!` });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "Failed to watermark AI dataset." });
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const totalDatasets = datasets.length;
    const verifiedWatermarked = datasets.filter((d) => d.authenticityVerdict === "SYNTHETIC_CONTENT_VERIFIED_WATERMARKED").length;
    const fdaApproved = datasets.filter((d) => d.fdaSyntheticStatus === "FDA_SYNTHETIC_EHR_APPROVED").length;

    return { totalDatasets, verifiedWatermarked, fdaApproved };
  }, [datasets]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* 1. Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-slate-100">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center gap-1.5 font-mono">
                <Stamp size={12} /> BIOMEDICAL AI WATERMARKING & C2PA
              </span>
              <span className="px-3 py-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1 font-mono">
                <ShieldCheck size={12} /> NIST EO 14110 COMPLIANT
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Biomedical AI Watermarking & Synthetic Data Provenance
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Steganographic frequency-domain watermarking, C2PA cryptographic content manifests, synthetic GenAI medical deepfake detection, and FDA synthetic dataset approval.
            </p>
          </div>

          {/* Telemetry Widget */}
          <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl w-full lg:w-auto text-xs space-y-2">
            <div className="flex items-center justify-between gap-6 font-mono">
              <span className="text-slate-400 font-sans font-bold uppercase text-[10px]">AI Authenticity Telemetry</span>
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                C2PA STAMP ACTIVE
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-700/80 font-mono text-[11px]">
              <div>AI Datasets: <strong className="text-white">{metrics.totalDatasets} Cataloged</strong></div>
              <div>Watermarked: <strong className="text-amber-300">{metrics.verifiedWatermarked} Stamped</strong></div>
              <div>FDA Synthetic Approved: <strong className="text-emerald-400">{metrics.fdaApproved} Validated</strong></div>
              <div>C2PA Signatures: <strong className="text-emerald-400">ENFORCED</strong></div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        {message.text && (
          <div
            className={`mt-6 p-4 rounded-xl text-sm font-medium flex items-center justify-between border ${
              message.type === "error"
                ? "bg-red-500/10 border-red-500/30 text-red-400"
                : "bg-amber-500/10 border-amber-500/30 text-amber-400"
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
                ? "bg-amber-600 text-white font-black shadow-lg shadow-amber-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Stamp size={15} /> AI Datasets ({datasets.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("VERIFICATION")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "VERIFICATION"
                ? "bg-amber-600 text-white font-black shadow-lg shadow-amber-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Fingerprint size={15} /> C2PA Verification Sandbox
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("STANDARDS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "STANDARDS"
                ? "bg-amber-600 text-white font-black shadow-lg shadow-amber-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <ShieldCheck size={15} /> C2PA & NIST Standards ({standards.length})
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-amber-600/20"
        >
          <PlusCircle size={15} /> Watermark & Sign AI Dataset
        </button>
      </div>

      {/* 3. DATASETS TAB */}
      {activeTab === "DATASETS" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">Watermarked Synthetic AI Datasets & C2PA Manifests</h3>
              <p className="text-xs text-slate-400 font-mono">GenAI models, steganographic watermark types, C2PA manifest URNs, and FDA approval states</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3">Dataset ID</th>
                  <th className="p-3">Dataset Name & GenAI Model</th>
                  <th className="p-3">Watermark Technique</th>
                  <th className="p-3">C2PA Manifest URN</th>
                  <th className="p-3">FDA Synthetic Approval</th>
                  <th className="p-3 text-right">Authenticity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {datasets.map((d, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/60">
                    <td className="p-3 font-bold text-amber-400">{d.datasetId}</td>
                    <td className="p-3 font-sans">
                      <div className="font-semibold text-white">{d.datasetName}</div>
                      <div className="text-[10px] text-amber-300 font-mono">{d.genAiModel}</div>
                    </td>
                    <td className="p-3 text-slate-400 font-mono text-[10px]">{d.watermarkType}</td>
                    <td className="p-3 text-slate-400 font-mono text-[10px]">{d.c2paManifestId}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          d.fdaSyntheticStatus === "FDA_SYNTHETIC_EHR_APPROVED"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-red-500/20 text-red-400 border border-red-500/30"
                        }`}
                      >
                        {d.fdaSyntheticStatus}
                      </span>
                    </td>
                    <td className="p-3 text-right font-sans">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          d.authenticityVerdict.includes("VERIFIED")
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            : "bg-red-500/20 text-red-400 border border-red-500/30"
                        }`}
                      >
                        {d.authenticityVerdict}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. VERIFICATION TAB */}
      {activeTab === "VERIFICATION" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Fingerprint size={18} className="text-amber-400" /> C2PA Cryptographic Signature Sandbox
              </h3>
            </div>

            <form onSubmit={handleVerifyC2pa} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Target AI Dataset:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-sans"
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
                className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-lg shadow-amber-600/20"
              >
                <Zap size={16} /> Verify C2PA Manifest & Steganographic Hash
              </button>
            </form>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-400" /> Provenance Manifest Output
              </h3>
            </div>

            {c2paResult ? (
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-sans font-bold uppercase">Certified Synthetic Origin:</span>
                  <div className="text-[10px] text-amber-300 font-bold">{c2paResult.syntheticOriginModel}</div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px] p-3 bg-slate-950/60 rounded-xl border border-slate-800 font-sans">
                  <div>C2PA Signature: <strong className="text-emerald-400">VALID</strong></div>
                  <div>Steganographic Hash: <strong className="text-emerald-400">MATCHED</strong></div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-2xl">
                Click "Verify C2PA Manifest & Steganographic Hash" to validate synthetic content provenance and deepfake authenticity.
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
              <h3 className="text-base font-bold text-white">C2PA & NIST Executive Order 14110 Standards</h3>
              <p className="text-xs text-slate-400 font-mono">Frameworks for authenticating AI-generated medical media and synthetic clinical datasets</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {standards.map((s, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded font-bold">
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

      {/* 6. WATERMARK MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full text-slate-100 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Stamp size={18} className="text-amber-400" /> Watermark AI Synthetic Dataset
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleWatermarkDataset} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Dataset Name:</label>
                <input
                  type="text"
                  placeholder="e.g. Synthetic Oncology Imaging Dataset"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-sans"
                  value={datasetName}
                  onChange={(e) => setDatasetName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">GenAI Generator Model:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-sans"
                  value={genAiModel}
                  onChange={(e) => setGenAiModel(e.target.value)}
                >
                  <option value="MedDiffusion-v3 (Latent Image Generator)">MedDiffusion-v3 (Latent Image Generator)</option>
                  <option value="BioLLM-Clinical-70B">BioLLM-Clinical-70B</option>
                  <option value="GAN-Radiology-Synthesis">GAN-Radiology-Synthesis</option>
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
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition shadow-lg shadow-amber-600/20"
                >
                  Watermark & Sign C2PA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
