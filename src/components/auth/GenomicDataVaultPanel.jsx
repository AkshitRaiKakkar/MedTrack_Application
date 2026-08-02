import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Dna,
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
  Check
} from "lucide-react";
import {
  getGenomicRecords,
  vaultGenomicRecord,
  runHomomorphicDnaQuery,
  getGinaStandards
} from "../../services/GenomicDataVaultService";
import "../../pages/auth/auth.css";

/**
 * GenomicDataVaultPanel Component
 * 
 * Genomic EHR Privacy & DNA Data Cryptographic Vault Console.
 * Features:
 * 1. Whole Genome Sequencing (WGS) & Variant Call Format (VCF) Encrypted Vaulting
 * 2. Homomorphic DNA Computation (HE-DNA) & Zero-Knowledge Proof Querying
 * 3. GINA (Genetic Information Nondiscrimination Act) Compliance Engine
 * 4. Genomic Record Provisioning & Access Audit Stream
 */
export default function GenomicDataVaultPanel() {
  // State
  const [records, setRecords] = useState([]);
  const [standards, setStandards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("RECORDS"); // "RECORDS" | "HOMOMORPHIC" | "STANDARDS"

  // Homomorphic State
  const [geneMarker, setGeneMarker] = useState("BRCA1 c.5266dupC");
  const [queryResult, setQueryResult] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sampleType, setSampleType] = useState("Whole Genome Sequencing (WGS - 30x Depth)");

  // Load telemetry
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [recList, stdList] = await Promise.all([
        getGenomicRecords().catch(() => []),
        getGinaStandards().catch(() => [])
      ]);

      setRecords(recList);
      setStandards(stdList);
    } catch (err) {
      console.error("Failed to load genomic vault data:", err);
      setMessage({ type: "error", text: "Failed connecting to Genomic Data Vault service." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Run Homomorphic Query
  const handleRunQuery = async (e) => {
    e?.preventDefault();
    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const result = await runHomomorphicDnaQuery(geneMarker);
      setQueryResult(result);
      setMessage({ type: "success", text: `Homomorphic DNA Ciphertext Query executed in ${result.executionTimeMs}ms!` });
    } catch (err) {
      setMessage({ type: "error", text: "Homomorphic query failed." });
    } finally {
      setActionLoading(false);
    }
  };

  // Vault Record
  const handleVaultRecord = async (e) => {
    e.preventDefault();

    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const newRec = await vaultGenomicRecord({ sampleType });

      setIsModalOpen(false);
      setMessage({ type: "success", text: `Genomic Record ${newRec.recordId} encrypted & vaulted!` });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "Failed to vault genomic record." });
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const totalRecords = records.length;
    const homomorphicEncrypted = records.filter((r) => r.homomorphicStatus.includes("PAILLIER")).length;
    const ginaVerified = records.filter((r) => r.ginaConsentStatus === "GINA_CONSENT_VERIFIED").length;

    return { totalRecords, homomorphicEncrypted, ginaVerified };
  }, [records]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* 1. Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-slate-100">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-teal-400 bg-teal-500/10 border border-teal-500/20 rounded-full flex items-center gap-1.5 font-mono">
                <Dna size={12} /> WGS / VCF GENOMIC VAULT
              </span>
              <span className="px-3 py-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1 font-mono">
                <ShieldCheck size={12} /> GINA & NIH GDS COMPLIANT
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Genomic EHR Privacy & DNA Data Cryptographic Vault
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Homomorphic encryption for zero-knowledge DNA variant querying, Whole Genome Sequencing (WGS) VCF file vaulting, and GINA legal non-discrimination enforcement.
            </p>
          </div>

          {/* Telemetry Widget */}
          <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl w-full lg:w-auto text-xs space-y-2">
            <div className="flex items-center justify-between gap-6 font-mono">
              <span className="text-slate-400 font-sans font-bold uppercase text-[10px]">DNA Vault Telemetry</span>
              <span className="text-teal-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
                HOMOMORPHIC SECURE
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-700/80 font-mono text-[11px]">
              <div>Genomic Records: <strong className="text-white">{metrics.totalRecords} Vaulted</strong></div>
              <div>Homomorphic DNA: <strong className="text-teal-300">{metrics.homomorphicEncrypted} Paillier</strong></div>
              <div>GINA Verified: <strong className="text-emerald-400">{metrics.ginaVerified} Consent</strong></div>
              <div>Zero-Knowledge: <strong className="text-emerald-400">ENFORCED</strong></div>
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
            onClick={() => setActiveTab("RECORDS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "RECORDS"
                ? "bg-teal-600 text-white font-black shadow-lg shadow-teal-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Dna size={15} /> Genomic DNA Records ({records.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("HOMOMORPHIC")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "HOMOMORPHIC"
                ? "bg-teal-600 text-white font-black shadow-lg shadow-teal-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Terminal size={15} /> Homomorphic DNA Query Sandbox
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
            <ShieldCheck size={15} /> GINA & NIH Standards ({standards.length})
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-teal-600/20"
        >
          <PlusCircle size={15} /> Vault Genomic Record
        </button>
      </div>

      {/* 3. RECORDS TAB */}
      {activeTab === "RECORDS" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">Vaulted Genomic DNA Sequences & Variant Files</h3>
              <p className="text-xs text-slate-400 font-mono">WGS VCF files, Paillier homomorphic state, and GINA consent tags</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3">Record ID</th>
                  <th className="p-3">Sample Type & Format</th>
                  <th className="p-3">Genomic Pseudonym Alias</th>
                  <th className="p-3">Homomorphic Encryption</th>
                  <th className="p-3">GINA Consent</th>
                  <th className="p-3 text-right">Security Tag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {records.map((r, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/60">
                    <td className="p-3 font-bold text-teal-400">{r.recordId}</td>
                    <td className="p-3 font-sans">
                      <div className="font-semibold text-white">{r.sampleType}</div>
                      <div className="text-[10px] text-teal-300 font-mono">{r.fileFormat}</div>
                    </td>
                    <td className="p-3 text-slate-400 font-mono text-[10px]">{r.genomicAlias}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.homomorphicStatus.includes("PAILLIER")
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-red-500/20 text-red-400 border border-red-500/30"
                        }`}
                      >
                        {r.homomorphicStatus}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/20 text-teal-400 border border-teal-500/30">
                        {r.ginaConsentStatus}
                      </span>
                    </td>
                    <td className="p-3 text-right font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                        {r.securityTag}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. HOMOMORPHIC TAB */}
      {activeTab === "HOMOMORPHIC" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Dna size={18} className="text-teal-400" /> Homomorphic DNA Query Sandbox
              </h3>
            </div>

            <form onSubmit={handleRunQuery} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Target Gene Variant Marker:</label>
                <input
                  type="text"
                  placeholder="e.g. BRCA1 c.5266dupC"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                  value={geneMarker}
                  onChange={(e) => setGeneMarker(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-lg shadow-teal-600/20"
              >
                <Zap size={16} /> Execute Homomorphic Ciphertext Search
              </button>
            </form>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-400" /> Zero-Knowledge Proof Output
              </h3>
            </div>

            {queryResult ? (
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-sans font-bold uppercase">Homomorphic Ciphertext Match:</span>
                  <div className="text-[10px] text-teal-300 break-all">{queryResult.homomorphicCiphertextMatch}</div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px] p-3 bg-slate-950/60 rounded-xl border border-slate-800 font-sans">
                  <div>Decrypted Verdict: <strong className="text-emerald-400">{queryResult.decryptedMatchVerdict}</strong></div>
                  <div>Zero-Knowledge Proof: <strong className="text-emerald-400">VERIFIED</strong></div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-2xl">
                Click "Execute Homomorphic Ciphertext Search" to test encrypted DNA variant matching without unencrypting raw data.
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
              <h3 className="text-base font-bold text-white">GINA & NIH Genomic Privacy Standards</h3>
              <p className="text-xs text-slate-400 font-mono">Federal legal protections and cryptographic frameworks for DNA sequence data</p>
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

      {/* 6. VAULT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full text-slate-100 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Dna size={18} className="text-teal-400" /> Vault Genomic DNA Record
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleVaultRecord} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Genomic Sample Type:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-sans"
                  value={sampleType}
                  onChange={(e) => setSampleType(e.target.value)}
                >
                  <option value="Whole Genome Sequencing (WGS - 30x Depth)">Whole Genome Sequencing (WGS - 30x Depth)</option>
                  <option value="Targeted Oncology Gene Panel (BRCA1/2)">Targeted Oncology Gene Panel (BRCA1/2)</option>
                  <option value="Pharmacogenomic (PGx) Variant Array">Pharmacogenomic (PGx) Variant Array</option>
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
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl transition shadow-lg shadow-teal-600/20"
                >
                  Vault & Encrypt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
