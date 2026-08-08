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
  Zap,
  Check,
  ShieldAlert,
  Share2,
  FileCheck,
  Network
} from "lucide-react";
import {
  getZeroTrustDataMeshInventory,
  provisionDataMeshPolicy,
  evaluateOdrlAccessRights,
  getZeroTrustDataMeshStandards
} from "../../services/BiomedicalZeroTrustDataMeshService";
import "../../pages/auth/auth.css";

/**
 * BiomedicalZeroTrustDataMeshPanel Component
 * 
 * Biomedical Zero-Trust Data Mesh & W3C ODRL 2.2 Policy Engine Console.
 * Features:
 * 1. W3C ODRL 2.2 Data Product Inventory & Purpose-Bound Access Rights Matrix
 * 2. ODRL 2.2 Rights Evaluation & Duty Verification Sandbox
 * 3. W3C ODRL 2.2 & FAIR Data Principles Standards
 * 4. Data Product & ODRL Contract Provisioning Modal
 */
export default function BiomedicalZeroTrustDataMeshPanel() {
  // State
  const [products, setProducts] = useState([]);
  const [standards, setStandards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("PRODUCTS"); // "PRODUCTS" | "SANDBOX" | "STANDARDS"

  // Sandbox State
  const [selectedProductId, setSelectedProductId] = useState("MESH-PROD-1701");
  const [evalResult, setEvalResult] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productName, setProductName] = useState("");

  // Load telemetry
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [pdList, stdList] = await Promise.all([
        getZeroTrustDataMeshInventory().catch(() => []),
        getZeroTrustDataMeshStandards().catch(() => [])
      ]);

      setProducts(pdList);
      setStandards(stdList);
    } catch (err) {
      console.error("Failed to load biomedical zero-trust data mesh data:", err);
      setMessage({ type: "error", text: "Failed connecting to Zero-Trust Data Mesh service." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Run ODRL Rights Evaluation
  const handleEvaluateRights = async (e) => {
    e?.preventDefault();
    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const result = await evaluateOdrlAccessRights(selectedProductId);
      setEvalResult(result);
      setMessage({ type: "success", text: `ODRL 2.2 Rights Evaluation completed in ${result.evaluationLatencyMs}ms! Access Decision: ${result.odrlDecision}. Purpose Matched: ${result.purposeConstraintMatched ? "YES" : "NO"}.` });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "ODRL rights evaluation failed." });
    } finally {
      setActionLoading(false);
    }
  };

  // Provision Data Mesh Product
  const handleProvisionProduct = async (e) => {
    e.preventDefault();
    if (!productName.trim()) return;

    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const newPd = await provisionDataMeshPolicy({ productName: productName.trim() });

      setProductName("");
      setIsModalOpen(false);
      setMessage({ type: "success", text: `Zero-Trust Data Mesh Product ${newPd.productId} published with W3C ODRL 2.2 agreement contract!` });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "Failed to provision data mesh product." });
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const totalProducts = products.length;
    const publishedCount = products.filter((p) => p.dataProductStatus.includes("PUBLISHED")).length;
    const totalActions = products.reduce((acc, curr) => acc + curr.grantedActions.length, 0);

    return { totalProducts, publishedCount, totalActions };
  }, [products]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* 1. Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-slate-100">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 rounded-full flex items-center gap-1.5 font-mono">
                <Boxes size={12} /> ZERO-TRUST DATA MESH
              </span>
              <span className="px-3 py-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1 font-mono">
                <ShieldCheck size={12} /> W3C ODRL 2.2 COMPLIANT
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Biomedical Zero-Trust Data Mesh & ODRL Engine
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Decentralized domain-driven biomedical data products, W3C ODRL 2.2 digital rights contracts, purpose-bound access control, FAIR data principles, and automated duty enforcement.
            </p>
          </div>

          {/* Telemetry Widget */}
          <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl w-full lg:w-auto text-xs space-y-2">
            <div className="flex items-center justify-between gap-6 font-mono">
              <span className="text-slate-400 font-sans font-bold uppercase text-[10px]">ODRL Rights Telemetry</span>
              <span className="text-cyan-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                POLICY ENGINE ACTIVE
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-700/80 font-mono text-[11px]">
              <div>Data Products: <strong className="text-white">{metrics.totalProducts} Published</strong></div>
              <div>Granted Actions: <strong className="text-cyan-300">{metrics.totalActions} Active Rights</strong></div>
              <div>Evaluation Latency: <strong className="text-emerald-400">12 ms</strong></div>
              <div>Domain Governance: <strong className="text-emerald-400">FEDERATED ABAC</strong></div>
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
            onClick={() => setActiveTab("PRODUCTS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "PRODUCTS"
                ? "bg-cyan-600 text-white font-black shadow-lg shadow-cyan-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Boxes size={15} /> Data Mesh Products ({products.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("SANDBOX")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "SANDBOX"
                ? "bg-cyan-600 text-white font-black shadow-lg shadow-cyan-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Zap size={15} /> ODRL 2.2 Rights Evaluation Sandbox
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
            <ShieldCheck size={15} /> W3C ODRL & FAIR Standards ({standards.length})
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-cyan-600/20"
        >
          <PlusCircle size={15} /> Publish Data Mesh Product
        </button>
      </div>

      {/* 3. PRODUCTS TAB */}
      {activeTab === "PRODUCTS" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">Decentralized Domain Data Products & ODRL Contracts</h3>
              <p className="text-xs text-slate-400 font-mono">Product IDs, domain owners, W3C ODRL 2.2 policies, granted actions, and duty constraints</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3">Product ID</th>
                  <th className="p-3">Product Name & Domain Owner</th>
                  <th className="p-3">ODRL Policy Type</th>
                  <th className="p-3">Granted Actions & Duties</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {products.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/60">
                    <td className="p-3 font-bold text-cyan-400">{p.productId}</td>
                    <td className="p-3 font-sans">
                      <div className="font-semibold text-white">{p.productName}</div>
                      <div className="text-[10px] text-cyan-300 font-mono">{p.domainOwner}</div>
                    </td>
                    <td className="p-3 text-slate-400 font-mono text-[10px]">{p.odrlPolicyType}</td>
                    <td className="p-3 text-emerald-400 font-bold text-[10px]">
                      {p.grantedActions.join(", ")} | <span className="text-slate-400">{p.dutyConstraints.join(", ")}</span>
                    </td>
                    <td className="p-3 text-right font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {p.dataProductStatus}
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
                <Zap size={18} className="text-cyan-400" /> ODRL 2.2 Rights & Duty Evaluator
              </h3>
            </div>

            <form onSubmit={handleEvaluateRights} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Target Data Product:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-sans"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                >
                  {products.map((p) => (
                    <option key={p.productId} value={p.productId}>
                      {p.productId} - {p.productName}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-lg shadow-cyan-600/20"
              >
                <Zap size={16} /> Execute ODRL 2.2 Access Rights Evaluation
              </button>
            </form>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-400" /> Evaluation Output
              </h3>
            </div>

            {evalResult ? (
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-sans font-bold uppercase">ODRL Access Decision:</span>
                  <div className="text-sm font-bold text-emerald-400">{evalResult.odrlDecision}</div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px] p-3 bg-slate-950/60 rounded-xl border border-slate-800 font-sans">
                  <div>Purpose Constraint: <strong className="text-emerald-400 font-mono text-[10px]">{evalResult.purposeConstraintMatched ? "MATCHED" : "UNMATCHED"}</strong></div>
                  <div>Duty Verification: <strong className="text-emerald-400">{evalResult.dutyVerificationPassed ? "PASSED" : "FAILED"}</strong></div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-2xl">
                Click "Execute ODRL 2.2 Access Rights Evaluation" to test digital rights contracts.
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
              <h3 className="text-base font-bold text-white">W3C ODRL 2.2 & Data Mesh Standards</h3>
              <p className="text-xs text-slate-400 font-mono">Frameworks for open digital rights, domain-driven data mesh, and FAIR scientific data principles</p>
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

      {/* 6. PROVISION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full text-slate-100 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Boxes size={18} className="text-cyan-400" /> Publish Data Mesh Product
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleProvisionProduct} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Data Product Name:</label>
                <input
                  type="text"
                  placeholder="e.g. Neurology Brain MRI Federated Data Product"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-sans"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
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
                  Publish Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
