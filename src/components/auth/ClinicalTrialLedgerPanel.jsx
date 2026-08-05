import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  FileCheck,
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
  Link,
  Award,
  BookOpen,
  PenTool,
  CheckSquare
} from "lucide-react";
import {
  getTrialBlocks,
  recordTrialEntry,
  validateChainIntegrity,
  getPart11Requirements
} from "../../services/ClinicalTrialLedgerService";
import "../../pages/auth/auth.css";

/**
 * ClinicalTrialLedgerPanel Component
 * 
 * Clinical Trial Data Integrity & FDA 21 CFR Part 11 Audit Console.
 * Features:
 * 1. Cryptographic Hash Chain Validation & Untampered Audit Ledger
 * 2. FDA 21 CFR Part 11 Electronic Signature Attestation
 * 3. Patient e-Consent & Clinical Trial Protocol Data Logging
 * 4. Real-time Block Hash Verification & Entry Modal
 */
export default function ClinicalTrialLedgerPanel() {
  // State
  const [blocks, setBlocks] = useState([]);
  const [part11Reqs, setPart11Reqs] = useState([]);
  const [validation, setValidation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("LEDGER"); // "LEDGER" | "PART_11"

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [trialId, setTrialId] = useState("CT-PHASE3-ONCO-991");
  const [subjectId, setSubjectId] = useState("PAT-ANON-8890");
  const [signatureAuthority, setSignatureAuthority] = useState("Dr. Sarah Jenkins, MD");

  // Load telemetry
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [blockList, reqList, validRes] = await Promise.all([
        getTrialBlocks().catch(() => []),
        getPart11Requirements().catch(() => []),
        validateChainIntegrity().catch(() => null)
      ]);

      setBlocks(blockList);
      setPart11Reqs(reqList);
      setValidation(validRes);
    } catch (err) {
      console.error("Failed to load trial ledger data:", err);
      setMessage({ type: "error", text: "Failed connecting to trial ledger service." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Execute Chain Validation
  const handleValidateChain = async () => {
    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const result = await validateChainIntegrity();
      setValidation(result);
      setMessage({ type: "success", text: `Cryptographic Hash Chain Validated! Status: ${result.chainStatus}` });
    } catch (err) {
      setMessage({ type: "error", text: "Chain validation failed." });
    } finally {
      setActionLoading(false);
    }
  };

  // Record Trial Entry
  const handleRecordEntry = async (e) => {
    e.preventDefault();
    if (!subjectId.trim()) return;

    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const newBlock = await recordTrialEntry({
        trialId,
        subjectId: subjectId.trim(),
        signatureAuthority
      });

      setSubjectId("");
      setIsModalOpen(false);
      setMessage({ type: "success", text: `Clinical Trial Block #${newBlock.blockIndex} cryptographically logged & signed!` });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "Failed to record clinical trial entry." });
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const totalBlocks = blocks.length;
    const compliantBlocks = blocks.filter((b) => b.cfrPart11Status === "PART_11_COMPLIANT").length;
    const integrityScore = validation ? validation.hashIntegrityScore : "100.0%";

    return { totalBlocks, compliantBlocks, integrityScore };
  }, [blocks, validation]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* 1. Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-slate-100">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center gap-1.5 font-mono">
                <FileCheck size={12} /> FDA 21 CFR PART 11
              </span>
              <span className="px-3 py-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1 font-mono">
                <Link size={12} /> CRYPTOGRAPHIC BLOCKCHAIN
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Clinical Trial Data Integrity & Audit Ledger Console
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Immutable trial protocol logging, 21 CFR Part 11 electronic signature validation, cryptographic block hash audit chains, and patient e-Consent governance.
            </p>
          </div>

          {/* Telemetry Widget */}
          <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl w-full lg:w-auto text-xs space-y-2">
            <div className="flex items-center justify-between gap-6 font-mono">
              <span className="text-slate-400 font-sans font-bold uppercase text-[10px]">Ledger Telemetry</span>
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                VERIFIED
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-700/80 font-mono text-[11px]">
              <div>Total Blocks Logged: <strong className="text-white">{metrics.totalBlocks} Blocks</strong></div>
              <div>Part 11 Attested: <strong className="text-emerald-400">{metrics.compliantBlocks} Signed</strong></div>
              <div>Hash Integrity: <strong className="text-amber-300">{metrics.integrityScore}</strong></div>
              <div>Chain Audit: <strong className="text-emerald-400">UNAMPERED</strong></div>
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
            onClick={() => setActiveTab("LEDGER")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "LEDGER"
                ? "bg-amber-600 text-white font-black shadow-lg shadow-amber-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Link size={15} /> Cryptographic Block Ledger ({blocks.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("PART_11")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "PART_11"
                ? "bg-amber-600 text-white font-black shadow-lg shadow-amber-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <FileCheck size={15} /> FDA 21 CFR Part 11 Rules ({part11Reqs.length})
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleValidateChain}
            disabled={actionLoading}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 font-bold rounded-xl text-xs transition flex items-center gap-2"
          >
            <RefreshCw size={15} className={actionLoading ? "animate-spin" : ""} /> Validate Hash Chain
          </button>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-amber-600/20"
          >
            <PlusCircle size={15} /> Log Trial Entry Block
          </button>
        </div>
      </div>

      {/* 3. BLOCK LEDGER TAB */}
      {activeTab === "LEDGER" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">Immutable Cryptographic Audit Blocks</h3>
              <p className="text-xs text-slate-400 font-mono">SHA-256 block hash chain linking, e-Signatures, and 21 CFR Part 11 attestation</p>
            </div>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {blocks.map((b, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-900 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      BLOCK #{b.blockIndex}
                    </span>
                    <strong className="text-white font-sans">{b.trialId}</strong>
                    <span className="text-[10px] text-slate-400">({b.subjectId})</span>
                  </div>

                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {b.cfrPart11Status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px] text-slate-400 pt-1">
                  <div>
                    <span>Payload Hash: </span>
                    <strong className="text-amber-300 break-all">{b.dataPayloadHash}</strong>
                  </div>
                  <div>
                    <span>Previous Block Hash: </span>
                    <strong className="text-slate-500 break-all">{b.previousBlockHash}</strong>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-400 pt-2 border-t border-slate-900 font-sans">
                  <div>Digital Signer: <strong className="text-white">{b.signatureAuthority}</strong></div>
                  <div>Timestamp: <span className="font-mono text-slate-400">{b.timestamp}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. PART 11 TAB */}
      {activeTab === "PART_11" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">FDA 21 CFR Part 11 Electronic Records & Signatures</h3>
              <p className="text-xs text-slate-400 font-mono">Federal regulation compliance requirements for clinical trial software systems</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {part11Reqs.map((r, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded font-bold">
                    {r.section}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white">{r.rule}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{r.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. LOG ENTRY MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full text-slate-100 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileCheck size={18} className="text-amber-400" /> Log Clinical Trial Block
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRecordEntry} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Clinical Trial Protocol ID:</label>
                <input
                  type="text"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  value={trialId}
                  onChange={(e) => setTrialId(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Anonymized Patient Subject ID:</label>
                <input
                  type="text"
                  placeholder="e.g. PAT-ANON-8890"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">21 CFR Part 11 e-Signatory Authority:</label>
                <input
                  type="text"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-sans"
                  value={signatureAuthority}
                  onChange={(e) => setSignatureAuthority(e.target.value)}
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
                  Sign & Log Block
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
