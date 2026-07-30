import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ShieldAlert,
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
  Binary,
  Zap,
  Radio
} from "lucide-react";
import {
  getPqcKeyPairs,
  generatePqcKeyPair,
  runPqcSimulation,
  getNistPqcStandards
} from "../../services/PostQuantumCryptoService";
import "../../pages/auth/auth.css";

/**
 * PostQuantumCryptoPanel Component
 * 
 * Quantum-Resistant Cryptography & Post-Quantum Encryption Engine Console.
 * Features:
 * 1. NIST FIPS 203/204/205 PQC Key Encapsulation (KEM) & Digital Signature Sandbox
 * 2. Cryptographically Relevant Quantum Computer (CRQC) Readiness Telemetry
 * 3. Classical to Hybrid/PQC Migration Key Lifecycle Management
 * 4. PQC Key Pair Generation & Attestation Ledger
 */
export default function PostQuantumCryptoPanel() {
  // State
  const [keys, setKeys] = useState([]);
  const [nistStandards, setNistStandards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("SANDBOX"); // "SANDBOX" | "KEYS" | "STANDARDS"

  // Sandbox State
  const [sandboxAlgorithm, setSandboxAlgorithm] = useState("CRYSTALS-Kyber-1024");
  const [payloadInput, setPayloadInput] = useState(
    "CONFIDENTIAL_PATIENT_GENOMIC_PAYLOAD_SHA256_e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  );
  const [simulationResult, setSimulationResult] = useState(null);

  // New Key Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [keyAlias, setKeyAlias] = useState("");
  const [algorithm, setAlgorithm] = useState("CRYSTALS-Kyber-1024");
  const [keyCategory, setKeyCategory] = useState("KEM_KEY_EXCHANGE");

  // Load telemetry
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [keyList, standardList] = await Promise.all([
        getPqcKeyPairs().catch(() => []),
        getNistPqcStandards().catch(() => [])
      ]);

      setKeys(keyList);
      setNistStandards(standardList);
    } catch (err) {
      console.error("Failed to load PQC cryptography data:", err);
      setMessage({ type: "error", text: "Failed connecting to Post-Quantum cryptography engine." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Execute PQC Sandbox Simulation
  const handleRunSimulation = async (e) => {
    e?.preventDefault();
    if (!payloadInput.trim()) return;

    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const result = await runPqcSimulation(sandboxAlgorithm, payloadInput);
      setSimulationResult(result);
      setMessage({ type: "success", text: `Post-Quantum ${result.operationType} executed in ${result.executionTimeMs}ms!` });
    } catch (err) {
      setMessage({ type: "error", text: "PQC simulation failed." });
    } finally {
      setActionLoading(false);
    }
  };

  // Generate PQC Key Pair
  const handleGenerateKey = async (e) => {
    e.preventDefault();
    if (!keyAlias.trim()) return;

    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const newKey = await generatePqcKeyPair({
        keyAlias: keyAlias.trim(),
        algorithm,
        keyCategory
      });

      setKeyAlias("");
      setIsModalOpen(false);
      setMessage({ type: "success", text: `Post-Quantum Key Pair ${newKey.keyId} generated and registered!` });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "Failed to generate PQC key pair." });
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const totalKeys = keys.length;
    const pqcEnforced = keys.filter((k) => k.status === "ACTIVE_ENFORCED").length;
    const migrationRequired = keys.filter((k) => k.status === "MIGRATION_REQUIRED").length;
    const category5Keys = keys.filter((k) => k.nistPqcLevel === "NIST_CATEGORY_5").length;

    return { totalKeys, pqcEnforced, migrationRequired, category5Keys };
  }, [keys]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* 1. Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-slate-100">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-full flex items-center gap-1.5 font-mono">
                <Binary size={12} /> NIST FIPS 203 / 204 / 205
              </span>
              <span className="px-3 py-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1 font-mono">
                <ShieldCheck size={12} /> QUANTUM-RESISTANT AGILITY
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Post-Quantum Cryptography & Quantum Security Engine
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Lattice-based PQC key encapsulation (CRYSTALS-Kyber), post-quantum digital signatures (CRYSTALS-Dilithium, SPHINCS+), and hybrid classical-quantum TLS 1.3 telemetry.
            </p>
          </div>

          {/* Telemetry Widget */}
          <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl w-full lg:w-auto text-xs space-y-2">
            <div className="flex items-center justify-between gap-6 font-mono">
              <span className="text-slate-400 font-sans font-bold uppercase text-[10px]">Quantum Readiness</span>
              <span className="text-indigo-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                NIST CAT 5
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-700/80 font-mono text-[11px]">
              <div>Active PQC Keys: <strong className="text-white">{metrics.pqcEnforced} Enforced</strong></div>
              <div>Migration Target: <strong className="text-amber-400">{metrics.migrationRequired} Legacy</strong></div>
              <div>NIST Cat 5 Level: <strong className="text-emerald-400">{metrics.category5Keys} Key Pairs</strong></div>
              <div>CRQC Readiness: <strong className="text-indigo-300">94.8% Immune</strong></div>
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
            onClick={() => setActiveTab("SANDBOX")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "SANDBOX"
                ? "bg-indigo-600 text-white font-black shadow-lg shadow-indigo-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Terminal size={15} /> PQC Encryption Sandbox
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("KEYS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "KEYS"
                ? "bg-indigo-600 text-white font-black shadow-lg shadow-indigo-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <KeyRound size={15} /> Key Pair Ledger ({keys.length})
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
            <Binary size={15} /> NIST PQC Standards ({nistStandards.length})
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-indigo-600/20"
        >
          <PlusCircle size={15} /> Generate PQC Key Pair
        </button>
      </div>

      {/* 3. SANDBOX TAB */}
      {activeTab === "SANDBOX" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Input Sandbox */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Lock size={18} className="text-indigo-400" /> Post-Quantum Encapsulation & Signature Engine
              </h3>
            </div>

            <form onSubmit={handleRunSimulation} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Target PQC Algorithm:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  value={sandboxAlgorithm}
                  onChange={(e) => setSandboxAlgorithm(e.target.value)}
                >
                  <option value="CRYSTALS-Kyber-1024">CRYSTALS-Kyber-1024 (FIPS 203 KEM)</option>
                  <option value="CRYSTALS-Dilithium-5">CRYSTALS-Dilithium-5 (FIPS 204 Signature)</option>
                  <option value="SPHINCS+-SHA2-256f">SPHINCS+-SHA2-256f (FIPS 205 Hash Signature)</option>
                  <option value="FALCON-1024">FALCON-1024 (Lattice Signature)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Plaintext / Payload to Encapsulate:</label>
                <textarea
                  rows={5}
                  value={payloadInput}
                  onChange={(e) => setPayloadInput(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-indigo-300 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-lg shadow-indigo-600/20"
              >
                <Zap size={16} /> Execute PQC Encapsulation Simulation
              </button>
            </form>
          </div>

          {/* Right Column: Output Sandbox */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-400" /> Quantum-Safe Ciphertext & Key Output
              </h3>
            </div>

            {simulationResult ? (
              <div className="space-y-4 font-mono text-xs">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="text-[10px] text-slate-400 font-sans uppercase font-bold">Encapsulated Ciphertext (Hex):</span>
                  <div className="text-[10px] text-indigo-300 break-all leading-relaxed bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    {simulationResult.ciphertextHex}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="text-[10px] text-slate-400 font-sans uppercase font-bold">Derived Shared Secret Digest:</span>
                  <div className="text-[10px] text-emerald-400 break-all leading-relaxed bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    {simulationResult.sharedSecretDigest}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px] p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                  <div>Security Standard: <strong className="text-indigo-300">{simulationResult.quantumSecurityCategory}</strong></div>
                  <div>Execution Time: <strong className="text-emerald-400">{simulationResult.executionTimeMs} ms</strong></div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-2xl">
                Click "Execute PQC Encapsulation Simulation" to generate quantum-resistant ciphertext.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. KEYS TAB */}
      {activeTab === "KEYS" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">Post-Quantum Cryptographic Key Pair Ledger</h3>
              <p className="text-xs text-slate-400 font-mono">Continuous key migration tracker from legacy classical to PQC hybrid standard</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3">Key ID</th>
                  <th className="p-3">Key Alias & Category</th>
                  <th className="p-3">PQC Algorithm</th>
                  <th className="p-3">NIST Level</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {keys.map((k, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/60">
                    <td className="p-3 font-bold text-indigo-400">{k.keyId}</td>
                    <td className="p-3 font-sans">
                      <div className="font-semibold text-white">{k.keyAlias}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{k.keyCategory}</div>
                    </td>
                    <td className="p-3 text-indigo-300 font-bold">{k.algorithm}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                        {k.nistPqcLevel}
                      </span>
                    </td>
                    <td className="p-3 text-right font-sans">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          k.status === "ACTIVE_ENFORCED"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        {k.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. STANDARDS TAB */}
      {activeTab === "STANDARDS" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">NIST Post-Quantum Cryptography (PQC) Standardized Suite</h3>
              <p className="text-xs text-slate-400 font-mono">Official FIPS 203, 204, and 205 algorithms for healthcare data protection</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {nistStandards.map((s, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded font-bold">
                    {s.status}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">{s.securityLevel}</span>
                </div>
                <h4 className="text-sm font-bold text-white">{s.name}</h4>
                <p className="text-xs text-slate-400">Type: {s.type}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. GENERATE KEY MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full text-slate-100 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <KeyRound size={18} className="text-indigo-400" /> Generate Post-Quantum Key Pair
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleGenerateKey} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Key Alias / Description:</label>
                <input
                  type="text"
                  placeholder="e.g. EHR_Database_Hybrid_Master_Key"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  value={keyAlias}
                  onChange={(e) => setKeyAlias(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">PQC Algorithm:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  value={algorithm}
                  onChange={(e) => setAlgorithm(e.target.value)}
                >
                  <option value="CRYSTALS-Kyber-1024">CRYSTALS-Kyber-1024 (FIPS 203 KEM)</option>
                  <option value="CRYSTALS-Dilithium-5">CRYSTALS-Dilithium-5 (FIPS 204 Signature)</option>
                  <option value="SPHINCS+-SHA2-256f">SPHINCS+-SHA2-256f (FIPS 205 Signature)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Category:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  value={keyCategory}
                  onChange={(e) => setKeyCategory(e.target.value)}
                >
                  <option value="KEM_KEY_EXCHANGE">KEM KEY EXCHANGE</option>
                  <option value="DIGITAL_SIGNATURE">DIGITAL SIGNATURE</option>
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
                  Generate PQC Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
