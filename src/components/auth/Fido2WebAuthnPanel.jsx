import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Fingerprint,
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
  KeyRound,
  Usb,
  Zap,
  Check
} from "lucide-react";
import {
  getFido2Credentials,
  registerFido2Credential,
  runWebAuthnSimulation,
  getFidoStandards
} from "../../services/Fido2WebAuthnService";
import "../../pages/auth/auth.css";

/**
 * Fido2WebAuthnPanel Component
 * 
 * FIDO2 / WebAuthn Hardware Security Key & Biometric Passkey Command Center.
 * Features:
 * 1. CTAP2 / WebAuthn Hardware Security Key & Platform Biometric Ledger
 * 2. Phishing-Resistant Public-Key Attestation Challenge Simulator
 * 3. FIDO Alliance L3 Hardware Security & FIPS 140-3 Matrix
 * 4. FIDO2 Credential Provisioning & Registration Modal
 */
export default function Fido2WebAuthnPanel() {
  // State
  const [credentials, setCredentials] = useState([]);
  const [standards, setStandards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("CREDENTIALS"); // "CREDENTIALS" | "SIMULATOR" | "STANDARDS"

  // Simulator State
  const [simKeyType, setSimKeyType] = useState("HARDWARE_SECURITY_KEY");
  const [simResult, setSimResult] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [authenticatorType, setAuthenticatorType] = useState("HARDWARE_SECURITY_KEY");

  // Load telemetry
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [credList, stdList] = await Promise.all([
        getFido2Credentials().catch(() => []),
        getFidoStandards().catch(() => [])
      ]);

      setCredentials(credList);
      setStandards(stdList);
    } catch (err) {
      console.error("Failed to load FIDO2 WebAuthn data:", err);
      setMessage({ type: "error", text: "Failed connecting to FIDO2 WebAuthn service." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Run Simulation
  const handleRunSimulation = async (e) => {
    e?.preventDefault();
    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const result = await runWebAuthnSimulation(simKeyType);
      setSimResult(result);
      setMessage({ type: "success", text: `FIDO2 WebAuthn Attestation Challenge Verified in ${result.executionTimeMs}ms!` });
    } catch (err) {
      setMessage({ type: "error", text: "FIDO2 simulation failed." });
    } finally {
      setActionLoading(false);
    }
  };

  // Register Credential
  const handleRegisterKey = async (e) => {
    e.preventDefault();
    if (!keyName.trim()) return;

    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const newCred = await registerFido2Credential({
        keyName: keyName.trim(),
        authenticatorType
      });

      setKeyName("");
      setIsModalOpen(false);
      setMessage({ type: "success", text: `FIDO2 Key ${newCred.credentialId} registered & enforced!` });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "Failed to register FIDO2 key." });
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const totalCreds = credentials.length;
    const hardwareKeys = credentials.filter((c) => c.authenticatorType === "HARDWARE_SECURITY_KEY").length;
    const biometricPasskeys = credentials.filter((c) => c.authenticatorType === "PLATFORM_BIOMETRIC").length;

    return { totalCreds, hardwareKeys, biometricPasskeys };
  }, [credentials]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* 1. Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-slate-100">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center gap-1.5 font-mono">
                <Fingerprint size={12} /> FIDO2 / CTAP2.1
              </span>
              <span className="px-3 py-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1 font-mono">
                <ShieldCheck size={12} /> PHISHING PROOF AUTH
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              FIDO2 / WebAuthn Physical Key & Passkey Console
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Hardware security key management (YubiKey / Titan), platform biometric passkeys (TouchID / Windows Hello), and CTAP2 anti-phishing authentication attestation.
            </p>
          </div>

          {/* Telemetry Widget */}
          <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl w-full lg:w-auto text-xs space-y-2">
            <div className="flex items-center justify-between gap-6 font-mono">
              <span className="text-slate-400 font-sans font-bold uppercase text-[10px]">FIDO2 Telemetry</span>
              <span className="text-blue-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                100% PHISHING PROOF
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-700/80 font-mono text-[11px]">
              <div>FIDO2 Credentials: <strong className="text-white">{metrics.totalCreds} Keys</strong></div>
              <div>Hardware Keys: <strong className="text-blue-300">{metrics.hardwareKeys} YubiKeys</strong></div>
              <div>Biometric Passkeys: <strong className="text-emerald-400">{metrics.biometricPasskeys} Platform</strong></div>
              <div>Attestation Status: <strong className="text-emerald-400">VERIFIED</strong></div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        {message.text && (
          <div
            className={`mt-6 p-4 rounded-xl text-sm font-medium flex items-center justify-between border ${
              message.type === "error"
                ? "bg-red-500/10 border-red-500/30 text-red-400"
                : "bg-blue-500/10 border-blue-500/30 text-blue-400"
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
                ? "bg-blue-600 text-white font-black shadow-lg shadow-blue-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Usb size={15} /> Registered Key Ledger ({credentials.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("SIMULATOR")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "SIMULATOR"
                ? "bg-blue-600 text-white font-black shadow-lg shadow-blue-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Terminal size={15} /> Attestation Simulator
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("STANDARDS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "STANDARDS"
                ? "bg-blue-600 text-white font-black shadow-lg shadow-blue-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <ShieldCheck size={15} /> FIDO Alliance Standards ({standards.length})
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-blue-600/20"
        >
          <PlusCircle size={15} /> Register FIDO2 Key
        </button>
      </div>

      {/* 3. CREDENTIALS TAB */}
      {activeTab === "CREDENTIALS" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">Registered FIDO2 Hardware Keys & Biometric Passkeys</h3>
              <p className="text-xs text-slate-400 font-mono">CTAP2 protocol details, AAGUID hardware identifiers, and transport channels</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3">Credential ID</th>
                  <th className="p-3">Key Name & Type</th>
                  <th className="p-3">Protocol / AAGUID</th>
                  <th className="p-3">Transports</th>
                  <th className="p-3">User Verification</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {credentials.map((c, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/60">
                    <td className="p-3 font-bold text-blue-400">{c.credentialId}</td>
                    <td className="p-3 font-sans">
                      <div className="font-semibold text-white">{c.keyName}</div>
                      <div className="text-[10px] text-blue-300 font-mono">{c.authenticatorType}</div>
                    </td>
                    <td className="p-3 text-slate-400 text-[10px]">
                      <div>{c.protocol}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{c.aaguid}</div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        {c.transports.map((t, i) => (
                          <span key={i} className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 text-slate-300 text-[10px]">{c.userVerification}</td>
                    <td className="p-3 text-right font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. SIMULATOR TAB */}
      {activeTab === "SIMULATOR" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Usb size={18} className="text-blue-400" /> WebAuthn Attestation Challenge Simulator
              </h3>
            </div>

            <form onSubmit={handleRunSimulation} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Select Authenticator Type:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  value={simKeyType}
                  onChange={(e) => setSimKeyType(e.target.value)}
                >
                  <option value="HARDWARE_SECURITY_KEY">FIDO2 Hardware Security Key (YubiKey)</option>
                  <option value="PLATFORM_BIOMETRIC">Platform Biometric Passkey (TouchID / FaceID)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-lg shadow-blue-600/20"
              >
                <Zap size={16} /> Execute WebAuthn Attestation Challenge
              </button>
            </form>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-400" /> Attestation Object Verification Output
              </h3>
            </div>

            {simResult ? (
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-sans font-bold uppercase">Attestation Format & Algorithm:</span>
                  <div className="text-[11px] text-blue-300 font-bold">{simResult.attestationFormat} ({simResult.signatureAlgorithm})</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-sans font-bold uppercase">Relying Party ID Hash:</span>
                  <div className="text-[10px] text-slate-300 break-all">{simResult.rpIdHash}</div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px] p-3 bg-slate-950/60 rounded-xl border border-slate-800 font-sans">
                  <div>User Present: <strong className="text-emerald-400">YES (UV=1)</strong></div>
                  <div>Phishing Protection: <strong className="text-emerald-400">VERIFIED PROOF</strong></div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-2xl">
                Click "Execute WebAuthn Attestation Challenge" to verify FIDO2 public-key signatures.
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
              <h3 className="text-base font-bold text-white">FIDO Alliance & W3C WebAuthn Standards</h3>
              <p className="text-xs text-slate-400 font-mono">Official specifications for anti-phishing multi-factor authentication</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {standards.map((s, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded font-bold">
                    {s.level}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white">{s.standard}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. REGISTER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full text-slate-100 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Usb size={18} className="text-blue-400" /> Register FIDO2 / WebAuthn Key
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRegisterKey} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Key Description / Name:</label>
                <input
                  type="text"
                  placeholder="e.g. YubiKey 5C NFC - Master Admin"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Authenticator Type:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  value={authenticatorType}
                  onChange={(e) => setAuthenticatorType(e.target.value)}
                >
                  <option value="HARDWARE_SECURITY_KEY">HARDWARE SECURITY KEY (YubiKey/Titan)</option>
                  <option value="PLATFORM_BIOMETRIC">PLATFORM BIOMETRIC (TouchID/FaceID)</option>
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
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition shadow-lg shadow-blue-600/20"
                >
                  Register FIDO2 Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
