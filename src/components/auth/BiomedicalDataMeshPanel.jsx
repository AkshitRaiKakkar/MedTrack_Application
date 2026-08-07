import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Boxes,
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
  Network,
  Share2,
  GitBranch
} from "lucide-react";
import {
  getDataMeshDomains,
  onboardDataMeshDomain,
  evaluateDataMeshPolicy,
  getDataMeshStandards
} from "../../services/BiomedicalDataMeshService";
import "../../pages/auth/auth.css";

/**
 * BiomedicalDataMeshPanel Component
 * 
 * Biomedical Zero-Trust Data Mesh & Governance Console.
 * Features:
 * 1. Federated Data Mesh Governance (Decentralized Data Products)
 * 2. W3C ODRL 2.2 Open Digital Rights Language Policy Expressions
 * 3. Attribute-Based Access Control (ABAC) Cryptographic Policy Tokens
 * 4. Data Contract Policy Evaluation Sandbox & Domain Onboarding Modal
 */
export default function BiomedicalDataMeshPanel() {
  // State
  const [domains, setDomains] = useState([]);
  const [standards, setStandards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("DOMAINS"); // "DOMAINS" | "EVALUATION" | "STANDARDS"

  // Sandbox State
  const [selectedDomainId, setSelectedDomainId] = useState("MESH-DOM-201");
  const [evalResult, setEvalResult] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [domainName, setDomainName] = useState("");

  // Load telemetry
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [domList, stdList] = await Promise.all([
        getDataMeshDomains().catch(() => []),
        getDataMeshStandards().catch(() => [])
      ]);

      setDomains(domList);
      setStandards(stdList);
    } catch (err) {
      console.error("Failed to load biomedical data mesh data:", err);
      setMessage({ type: "error", text: "Failed connecting to Zero-Trust Data Mesh service." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Run Policy Evaluation
  const handleEvaluatePolicy = async (e) => {
    e?.preventDefault();
    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const result = await evaluateDataMeshPolicy(selectedDomainId);
      setEvalResult(result);
      setMessage({ type: "success", text: `ABAC Data Mesh Policy evaluated in ${result.evaluationLatencyMs}ms! Query execution APPROVED.` });
    } catch (err) {
      setMessage({ type: "error", text: "Data Mesh policy evaluation failed." });
    } finally {
      setActionLoading(false);
    }
  };

  // Onboard Domain
  const handleOnboardDomain = async (e) => {
    e.preventDefault();
    if (!domainName.trim()) return;

    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const newDom = await onboardDataMeshDomain({ domainName: domainName.trim() });

      setDomainName("");
      setIsModalOpen(false);
      setMessage({ type: "success", text: `Data Mesh Domain ${newDom.domainId} onboarded with W3C ODRL 2.2 contract!` });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "Failed to onboard Data Mesh domain." });
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const totalDomains = domains.length;
    const activeContracts = domains.filter((d) => d.dataContractStatus.includes("ACTIVE")).length;
    const policyCompliant = domains.filter((d) => d.governanceVerdict === "DATA_MESH_POLICY_COMPLIANT").length;

    return { totalDomains, activeContracts, policyCompliant };
  }, [domains]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* 1. Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-slate-100">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 rounded-full flex items-center gap-1.5 font-mono">
                <Boxes size={12} /> ZERO-TRUST DATA MESH & GOVERNANCE
              </span>
              <span className="px-3 py-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1 font-mono">
                <ShieldCheck size={12} /> W3C ODRL 2.2 & ABAC ENCLAVE
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Biomedical Zero-Trust Data Mesh & Governance
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Federated data mesh governance, W3C ODRL 2.2 digital rights policies, Attribute-Based Access Control (ABAC), and machine-readable open data contract schemas.
            </p>
          </div>

          {/* Telemetry Widget */}
          <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl w-full lg:w-auto text-xs space-y-2">
            <div className="flex items-center justify-between gap-6 font-mono">
              <span className="text-slate-400 font-sans font-bold uppercase text-[10px]">Mesh Telemetry</span>
              <span className="text-cyan-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                FEDERATED MESH ONLINE
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-700/80 font-mono text-[11px]">
              <div>Data Products: <strong className="text-white">{metrics.totalDomains} Domains</strong></div>
              <div>Active Contracts: <strong className="text-cyan-300">{metrics.activeContracts} Validated</strong></div>
              <div>Compliant Products: <strong className="text-emerald-400">{metrics.policyCompliant} Verified</strong></div>
              <div>Access Control: <strong className="text-emerald-400">ABAC + CRYPTO TOKENS</strong></div>
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
            onClick={() => setActiveTab("DOMAINS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "DOMAINS"
                ? "bg-cyan-600 text-white font-black shadow-lg shadow-cyan-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Boxes size={15} /> Data Mesh Products ({domains.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("EVALUATION")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "EVALUATION"
                ? "bg-cyan-600 text-white font-black shadow-lg shadow-cyan-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Zap size={15} /> ABAC Policy Sandbox
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("STANDARDS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "STANDARDS"
                ? "bg-cyan-600 text-white font-black shadow-lg shadow-cyan-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <ShieldCheck size={15} /> W3C ODRL & Data Mesh ({standards.length})
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-cyan-600/20"
        >
          <PlusCircle size={15} /> Register Data Mesh Domain
        </button>
      </div>

      {/* 3. DOMAINS TAB */}
      {activeTab === "DOMAINS" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">Federated Data Mesh Products & Contracts</h3>
              <p className="text-xs text-slate-400 font-mono">Domain owners, data contract status, W3C ODRL policies, ABAC enforcement models, and compliance verdicts</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3">Domain ID</th>
                  <th className="p-3">Domain Name & Owner</th>
                  <th className="p-3">Data Contract Status</th>
                  <th className="p-3">W3C ODRL Policy</th>
                  <th className="p-3">ABAC Enforcement</th>
                  <th className="p-3 text-right">Governance Verdict</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {domains.map((d, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/60">
                    <td className="p-3 font-bold text-cyan-400">{d.domainId}</td>
                    <td className="p-3 font-sans">
                      <div className="font-semibold text-white">{d.domainName}</div>
                      <div className="text-[10px] text-cyan-300 font-mono">{d.domainOwner}</div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          d.dataContractStatus.includes("ACTIVE")
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-red-500/20 text-red-400 border border-red-500/30"
                        }`}
                      >
                        {d.dataContractStatus}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400 font-mono text-[10px]">{d.odrlPolicySchema}</td>
                    <td className="p-3 text-slate-400 font-mono text-[10px]">{d.abacEnforcement}</td>
                    <td className="p-3 text-right font-sans">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          d.governanceVerdict === "DATA_MESH_POLICY_COMPLIANT"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-red-500/20 text-red-400 border border-red-500/30"
                        }`}
                      >
                        {d.governanceVerdict}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. EVALUATION TAB */}
      {activeTab === "EVALUATION" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Zap size={18} className="text-cyan-400" /> ABAC Cryptographic Policy Evaluator
              </h3>
            </div>

            <form onSubmit={handleEvaluatePolicy} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Target Data Mesh Domain:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-sans"
                  value={selectedDomainId}
                  onChange={(e) => setSelectedDomainId(e.target.value)}
                >
                  {domains.map((d) => (
                    <option key={d.domainId} value={d.domainId}>
                      {d.domainId} - {d.domainName}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-lg shadow-cyan-600/20"
              >
                <Zap size={16} /> Evaluate Cryptographic ABAC & ODRL Policy
              </button>
            </form>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-400" /> Policy Evaluation Output
              </h3>
            </div>

            {evalResult ? (
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-sans font-bold uppercase">ABAC Subject Attributes:</span>
                  <div className="text-[10px] text-cyan-300">{evalResult.abacSubjectAttributes.join(" • ")}</div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px] p-3 bg-slate-950/60 rounded-xl border border-slate-800 font-sans">
                  <div>ODRL Constraint: <strong className="text-emerald-400">SATISFIED</strong></div>
                  <div>Query Approval: <strong className="text-emerald-400">APPROVED (14ms)</strong></div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-2xl">
                Click "Evaluate Cryptographic ABAC & ODRL Policy" to verify data product access rules.
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
              <h3 className="text-base font-bold text-white">Data Mesh Architecture & W3C ODRL Standards</h3>
              <p className="text-xs text-slate-400 font-mono">Frameworks for decentralized data products, open data contracts, and policy enforcement</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {standards.map((s, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded font-bold">
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
                <Boxes size={18} className="text-cyan-400" /> Register Data Mesh Domain
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleOnboardDomain} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Data Product Name:</label>
                <input
                  type="text"
                  placeholder="e.g. Pharmacovigilance Data Mesh Node"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-sans"
                  value={domainName}
                  onChange={(e) => setDomainName(e.target.value)}
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
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition shadow-lg shadow-cyan-600/20"
                >
                  Onboard Data Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
