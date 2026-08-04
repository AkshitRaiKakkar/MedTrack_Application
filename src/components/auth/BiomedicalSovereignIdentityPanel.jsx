import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  UserCheck,
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
  Activity,
  Smartphone,
  Globe,
  SlidersHorizontal,
  Zap,
  Check,
  IdCard,
  QrCode,
  Fingerprint
} from "lucide-react";
import {
  getVerifiableCredentials,
  issueVerifiableCredential,
  verifyCredentialPresentation,
  getSovereignIdentityStandards
} from "../../services/BiomedicalSovereignIdentityService";
import "../../pages/auth/auth.css";

/**
 * BiomedicalSovereignIdentityPanel Component
 * 
 * Biomedical Sovereign Identity & Decentralized Identifiers (W3C DID / VC) Console.
 * Features:
 * 1. W3C Decentralized Identifiers (DID:ION, DID:WEB, DID:CHEQD)
 * 2. W3C Verifiable Credentials (VC) for Board Certified Clinicians & Patients
 * 3. BBS+ Zero-Knowledge Proof (ZKP) Selective Attribute Disclosure
 * 4. Credential Verification Simulator Sandbox & VC Issuance Modal
 */
export default function BiomedicalSovereignIdentityPanel() {
  // State
  const [credentials, setCredentials] = useState([]);
  const [standards, setStandards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("CREDENTIALS"); // "CREDENTIALS" | "VERIFICATION" | "STANDARDS"

  // Sandbox State
  const [selectedCredId, setSelectedCredId] = useState("VC-DID-1001");
  const [zkpResult, setZkpResult] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [holderDid, setHolderDid] = useState("");
  const [credentialType, setCredentialType] = useState("MedicalLicenseCredential (Board Certified Physician)");

  // Load telemetry
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [credList, stdList] = await Promise.all([
        getVerifiableCredentials().catch(() => []),
        getSovereignIdentityStandards().catch(() => [])
      ]);

      setCredentials(credList);
      setStandards(stdList);
    } catch (err) {
      console.error("Failed to load biomedical sovereign identity data:", err);
      setMessage({ type: "error", text: "Failed connecting to Sovereign Identity DID/VC service." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Run ZKP Verification
  const handleVerifyZkp = async (e) => {
    e?.preventDefault();
    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const result = await verifyCredentialPresentation(selectedCredId);
      setZkpResult(result);
      setMessage({ type: "success", text: `ZKP Presentation verified in ${result.verificationLatencyMs}ms! Revealed claims: ${result.revealedClaimsOnly.join(", ")}` });
    } catch (err) {
      setMessage({ type: "error", text: "ZKP Credential verification failed." });
    } finally {
      setActionLoading(false);
    }
  };

  // Issue Credential
  const handleIssueCredential = async (e) => {
    e.preventDefault();
    if (!holderDid.trim()) return;

    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const newCred = await issueVerifiableCredential({
        holderDid: holderDid.trim(),
        credentialType
      });

      setHolderDid("");
      setIsModalOpen(false);
      setMessage({ type: "success", text: `Verifiable Credential ${newCred.credentialId} issued with BBS+ signature!` });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "Failed to issue Verifiable Credential." });
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const totalCredentials = credentials.length;
    const validCredentials = credentials.filter((c) => c.verificationVerdict === "VERIFIABLE_CREDENTIAL_VALID").length;
    const activeStatus = credentials.filter((c) => c.revocationStatus === "ACTIVE_NOT_REVOKED").length;

    return { totalCredentials, validCredentials, activeStatus };
  }, [credentials]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* 1. Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-slate-100">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-full flex items-center gap-1.5 font-mono">
                <IdCard size={12} /> SOVEREIGN IDENTITY & W3C DIDs
              </span>
              <span className="px-3 py-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1 font-mono">
                <ShieldCheck size={12} /> W3C VC 2.0 & BBS+ ZKP
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Biomedical Self-Sovereign Identity (DID & VC)
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              W3C Decentralized Identifiers (DID:ION, DID:WEB), Verifiable Credentials for clinicians & patients, BBS+ zero-knowledge selective disclosure, and tamper-evident cryptographic proofs.
            </p>
          </div>

          {/* Telemetry Widget */}
          <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl w-full lg:w-auto text-xs space-y-2">
            <div className="flex items-center justify-between gap-6 font-mono">
              <span className="text-slate-400 font-sans font-bold uppercase text-[10px]">DID Telemetry</span>
              <span className="text-indigo-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                VC RESOLVER ACTIVE
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-700/80 font-mono text-[11px]">
              <div>Issued VCs: <strong className="text-white">{metrics.totalCredentials} Cataloged</strong></div>
              <div>Valid VCs: <strong className="text-indigo-300">{metrics.validCredentials} Verified</strong></div>
              <div>Non-Revoked: <strong className="text-emerald-400">{metrics.activeStatus} Active</strong></div>
              <div>ZKP Proofs: <strong className="text-emerald-400">BBS+ ENFORCED</strong></div>
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
            onClick={() => setActiveTab("CREDENTIALS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "CREDENTIALS"
                ? "bg-indigo-600 text-white font-black shadow-lg shadow-indigo-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <IdCard size={15} /> Verifiable Credentials ({credentials.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("VERIFICATION")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "VERIFICATION"
                ? "bg-indigo-600 text-white font-black shadow-lg shadow-indigo-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Fingerprint size={15} /> ZKP Verification Sandbox
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
            <ShieldCheck size={15} /> W3C DID & VC Standards ({standards.length})
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-indigo-600/20"
        >
          <PlusCircle size={15} /> Issue Verifiable Credential
        </button>
      </div>

      {/* 3. CREDENTIALS TAB */}
      {activeTab === "CREDENTIALS" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">W3C Verifiable Credentials & DID Registry</h3>
              <p className="text-xs text-slate-400 font-mono">Holder DIDs, issuer DIDs, credential types, BBS+ ZKP signatures, and revocation states</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs text-slate-300">
              <tbody className="divide-y divide-slate-800 font-mono">
                {credentials.map((c, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/60">
                    <td className="p-3 font-bold text-indigo-400">{c.credentialId}</td>
                    <td className="p-3 font-sans">
                      <div className="font-semibold text-white">{c.credentialType}</div>
                      <div className="text-[10px] text-indigo-300 font-mono">Holder: {c.holderDid}</div>
                    </td>
                    <td className="p-3 text-slate-400 font-mono text-[10px]">Issuer: {c.issuerDid}</td>
                    <td className="p-3 text-slate-400 font-mono text-[10px]">{c.zkpDisclosureType}</td>
                    <td className="p-3 font-bold text-emerald-400 font-mono text-[10px]">{c.revocationStatus}</td>
                    <td className="p-3 text-right font-sans">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          c.verificationVerdict === "VERIFIABLE_CREDENTIAL_VALID"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-red-500/20 text-red-400 border border-red-500/30"
                        }`}
                      >
                        {c.verificationVerdict}
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
                <Fingerprint size={18} className="text-indigo-400" /> ZKP Selective Disclosure Sandbox
              </h3>
            </div>

            <form onSubmit={handleVerifyZkp} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Target Verifiable Credential:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
                  value={selectedCredId}
                  onChange={(e) => setSelectedCredId(e.target.value)}
                >
                  {credentials.map((c) => (
                    <option key={c.credentialId} value={c.credentialId}>
                      {c.credentialId} - {c.credentialType}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-lg shadow-indigo-600/20"
              >
                <Zap size={16} /> Verify ZKP Presentation & BBS+ Signature
              </button>
            </form>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-400" /> ZKP Verification Output
              </h3>
            </div>

            {zkpResult ? (
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-sans font-bold uppercase">Revealed Claims (Zero-Knowledge Selective Disclosure):</span>
                  <div className="text-[10px] text-indigo-300 font-bold">{zkpResult.revealedClaimsOnly.join(", ")}</div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px] p-3 bg-slate-950/60 rounded-xl border border-slate-800 font-sans">
                  <div>Concealed Claims: <strong className="text-emerald-400">{zkpResult.concealedClaimsCount} Protected</strong></div>
                  <div>ZKP Signature: <strong className="text-emerald-400">VALID (AUTHENTIC)</strong></div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-2xl">
                Click "Verify ZKP Presentation & BBS+ Signature" to test selective disclosure privacy.
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
              <h3 className="text-base font-bold text-white">W3C DID & Verifiable Credential Standards</h3>
              <p className="text-xs text-slate-400 font-mono">Frameworks for decentralized digital identity and zero-knowledge attribute verification</p>
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

      {/* 6. ISSUE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full text-slate-100 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <IdCard size={18} className="text-indigo-400" /> Issue Verifiable Credential
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleIssueCredential} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Holder DID URN:</label>
                <input
                  type="text"
                  placeholder="e.g. did:ion:EiA9x4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
                  value={holderDid}
                  onChange={(e) => setHolderDid(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Credential Type:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
                  value={credentialType}
                  onChange={(e) => setCredentialType(e.target.value)}
                >
                  <option value="MedicalLicenseCredential (Board Certified Physician)">MedicalLicenseCredential (Board Certified Physician)</option>
                  <option value="PatientHealthPass (Vaccination & Immunity ZKP)">PatientHealthPass (Vaccination & Immunity ZKP)</option>
                  <option value="HospitalPrivilegesCredential">HospitalPrivilegesCredential</option>
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
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition shadow-lg shadow-indigo-600/20"
                >
                  Issue W3C Credential
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
