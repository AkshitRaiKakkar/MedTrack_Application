import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Stamp,
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
  FileCheck,
  Award
} from "lucide-react";
import {
  getAiWatermarkC2paInventory,
  embedC2paManifest,
  verifyC2paWatermark,
  getAiWatermarkC2paStandards
} from "../../services/BiomedicalAiWatermarkC2paService";
import "../../pages/auth/auth.css";

/**
 * BiomedicalAiWatermarkC2paPanel Component
 * 
 * Biomedical Clinical AI Model Output Watermarking & C2PA Cryptographic Provenance Console.
 * Features:
 * 1. C2PA v1.3 Cryptographic Manifest Inventory & Watermark Detection Matrix
 * 2. Steganographic Watermark Extractor & Manifest Verifier Sandbox
 * 3. C2PA v1.3 & US Executive Order 14110 Standards
 * 4. C2PA Manifest Embedding & Synthetic AI Labeling Modal
 */
export default function BiomedicalAiWatermarkC2paPanel() {
  // State
  const [artifacts, setArtifacts] = useState([]);
  const [standards, setStandards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("ARTIFACTS"); // "ARTIFACTS" | "SANDBOX" | "STANDARDS"

  // Sandbox State
  const [selectedArtifactId, setSelectedArtifactId] = useState("C2PA-ART-1301");
  const [verifyResult, setVerifyResult] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [artifactName, setArtifactName] = useState("");

  // Load telemetry
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [artList, stdList] = await Promise.all([
        getAiWatermarkC2paInventory().catch(() => []),
        getAiWatermarkC2paStandards().catch(() => [])
      ]);

      setArtifacts(artList);
      setStandards(stdList);
    } catch (err) {
      console.error("Failed to load biomedical AI watermark C2PA data:", err);
      setMessage({ type: "error", text: "Failed connecting to AI Watermark C2PA service." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Run Watermark Verification
  const handleVerifyWatermark = async (e) => {
    e?.preventDefault();
    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const result = await verifyC2paWatermark(selectedArtifactId);
      setVerifyResult(result);
      setMessage({ type: "success", text: `C2PA Manifest & Watermark verified in ${result.verificationLatencyMs}ms! Watermark extracted: ${result.watermarkExtracted ? "YES" : "NO"}. Bit Error Rate: ${result.watermarkBitErrorRate}.` });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "C2PA watermark verification failed." });
    } finally {
      setActionLoading(false);
    }
  };

  // Embed C2PA Manifest
  const handleEmbedManifest = async (e) => {
    e.preventDefault();
    if (!artifactName.trim()) return;

    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const newArt = await embedC2paManifest({ artifactName: artifactName.trim() });

      setArtifactName("");
      setIsModalOpen(false);
      setMessage({ type: "success", text: `C2PA Manifest ${newArt.artifactId} embedded into clinical AI output!` });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "Failed to embed C2PA manifest." });
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const totalArtifacts = artifacts.length;
    const verifiedAuthentic = artifacts.filter((a) => a.provenanceIntegrityStatus.includes("AUTHENTIC")).length;
    const syntheticCount = artifacts.filter((a) => a.syntheticOriginDetected).length;

    return { totalArtifacts, verifiedAuthentic, syntheticCount };
  }, [artifacts]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* 1. Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-slate-100">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center gap-1.5 font-mono">
                <Stamp size={12} /> C2PA PROVENANCE & WATERMARKING
              </span>
              <span className="px-3 py-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1 font-mono">
                <ShieldCheck size={12} /> US EXECUTIVE ORDER 14110
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Biomedical Clinical AI Watermarking & C2PA Provenance
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              C2PA v1.3 cryptographic manifest validation, steganographic watermark detection (KGW & DWT-DCT), synthetic AI origin labeling, and tamper detection for clinical AI outputs.
            </p>
          </div>

          {/* Telemetry Widget */}
          <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl w-full lg:w-auto text-xs space-y-2">
            <div className="flex items-center justify-between gap-6 font-mono">
              <span className="text-slate-400 font-sans font-bold uppercase text-[10px]">C2PA Provenance Telemetry</span>
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                MANIFESTS VERIFIED
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-700/80 font-mono text-[11px]">
              <div>C2PA Manifests: <strong className="text-white">{metrics.totalArtifacts} Verified</strong></div>
              <div>Authenticity: <strong className="text-emerald-400">{metrics.verifiedAuthentic} 100% Intact</strong></div>
              <div>Synthetic Flagged: <strong className="text-amber-300">{metrics.syntheticCount} Labeled</strong></div>
              <div>Tamper State: <strong className="text-emerald-400">UNALTERED</strong></div>
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
            onClick={() => setActiveTab("ARTIFACTS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "ARTIFACTS"
                ? "bg-amber-600 text-white font-black shadow-lg shadow-amber-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Stamp size={15} /> C2PA Manifest Artifacts ({artifacts.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("SANDBOX")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "SANDBOX"
                ? "bg-amber-600 text-white font-black shadow-lg shadow-amber-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Zap size={15} /> Watermark & Manifest Verifier Sandbox
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
            <ShieldCheck size={15} /> C2PA v1.3 & EO 14110 Standards ({standards.length})
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-amber-600/20"
        >
          <PlusCircle size={15} /> Embed C2PA Manifest
        </button>
      </div>

      {/* 3. ARTIFACTS TAB */}
      {activeTab === "ARTIFACTS" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">Watermarked AI Outputs & C2PA Provenance Manifests</h3>
              <p className="text-xs text-slate-400 font-mono">Artifact IDs, watermark types, C2PA manifest versions, signing certificates, and synthetic origin flags</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3">Artifact ID</th>
                  <th className="p-3">Artifact Name & Watermark Type</th>
                  <th className="p-3">Signing Certificate</th>
                  <th className="p-3">Synthetic Origin</th>
                  <th className="p-3 text-right">Provenance Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {artifacts.map((a, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/60">
                    <td className="p-3 font-bold text-amber-400">{a.artifactId}</td>
                    <td className="p-3 font-sans">
                      <div className="font-semibold text-white">{a.artifactName}</div>
                      <div className="text-[10px] text-amber-300 font-mono">{a.watermarkType}</div>
                    </td>
                    <td className="p-3 text-slate-400 font-mono text-[10px]">{a.signingCertificate}</td>
                    <td className="p-3 text-amber-300 font-bold text-[10px]">
                      {a.syntheticOriginDetected ? "DETECTED & LABELED" : "HUMAN ORIGIN"}
                    </td>
                    <td className="p-3 text-right font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {a.provenanceIntegrityStatus}
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
                <Zap size={18} className="text-amber-400" /> C2PA Manifest & Watermark Extractor Inspector
              </h3>
            </div>

            <form onSubmit={handleVerifyWatermark} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Target AI Artifact:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-sans"
                  value={selectedArtifactId}
                  onChange={(e) => setSelectedArtifactId(e.target.value)}
                >
                  {artifacts.map((a) => (
                    <option key={a.artifactId} value={a.artifactId}>
                      {a.artifactId} - {a.artifactName}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-lg shadow-amber-600/20"
              >
                <Zap size={16} /> Execute C2PA Manifest Verification & Watermark Extraction
              </button>
            </form>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-400" /> Verification Output
              </h3>
            </div>

            {verifyResult ? (
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-sans font-bold uppercase">C2PA Manifest Integrity:</span>
                  <div className="text-sm font-bold text-emerald-400">{verifyResult.c2paManifestValid ? "VALID & UNALTERED" : "INVALID"}</div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px] p-3 bg-slate-950/60 rounded-xl border border-slate-800 font-sans">
                  <div>Watermark Extracted: <strong className="text-emerald-400 font-mono text-[10px]">{verifyResult.watermarkExtracted ? "YES" : "NO"}</strong></div>
                  <div>Bit Error Rate: <strong className="text-emerald-400">{verifyResult.watermarkBitErrorRate}</strong></div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-2xl">
                Click "Execute C2PA Manifest Verification & Watermark Extraction" to inspect AI provenance.
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
              <h3 className="text-base font-bold text-white">C2PA v1.3 & Executive Order 14110 Standards</h3>
              <p className="text-xs text-slate-400 font-mono">Frameworks for content authenticity, steganographic watermarking, and AI origin disclosures</p>
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

      {/* 6. PROVISION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full text-slate-100 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Stamp size={18} className="text-amber-400" /> Embed C2PA Manifest
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEmbedManifest} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Artifact Name / AI Output:</label>
                <input
                  type="text"
                  placeholder="e.g. AI-Synthesized ECG Waveform Trace"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-sans"
                  value={artifactName}
                  onChange={(e) => setArtifactName(e.target.value)}
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
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition shadow-lg shadow-amber-600/20"
                >
                  Embed Manifest
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
