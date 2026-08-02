import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Globe,
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
  SlidersHorizontal,
  Route,
  KeyRound,
  ShieldAlert,
  Zap
} from "lucide-react";
import {
  getApiRoutes,
  onboardApiRoute,
  auditApiRouteOwasp,
  getApiSecurityStandards
} from "../../services/ApiGatewaySecurityService";
import "../../pages/auth/auth.css";

/**
 * ApiGatewaySecurityPanel Component
 * 
 * Healthcare API Gateway Security & OAuth 2.1 DPoP Console.
 * Features:
 * 1. OAuth 2.1 mTLS & DPoP (Demonstrating Proof-of-Possession) Token Binds
 * 2. Rate Limiting & Bot Defense Traffic Rules
 * 3. OWASP API Security Top 10 Automated Vulnerability Audit Engine
 * 4. API Route Onboarding & Security Telemetry
 */
export default function ApiGatewaySecurityPanel() {
  // State
  const [routes, setRoutes] = useState([]);
  const [standards, setStandards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("ROUTES"); // "ROUTES" | "STANDARDS"

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [endpoint, setEndpoint] = useState("");
  const [httpMethod, setHttpMethod] = useState("GET / POST");

  // Load telemetry
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [routeList, stdList] = await Promise.all([
        getApiRoutes().catch(() => []),
        getApiSecurityStandards().catch(() => [])
      ]);

      setRoutes(routeList);
      setStandards(stdList);
    } catch (err) {
      console.error("Failed to load API Gateway security data:", err);
      setMessage({ type: "error", text: "Failed connecting to API Gateway service." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Audit OWASP
  const handleAuditOwasp = async (routeId) => {
    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const result = await auditApiRouteOwasp(routeId);
      setMessage({ type: "success", text: `API Route ${routeId} OWASP Audit Complete! Verdict: ${result.owaspVerdict}` });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "OWASP audit failed." });
    } finally {
      setActionLoading(false);
    }
  };

  // Onboard Route
  const handleOnboardRoute = async (e) => {
    e.preventDefault();
    if (!endpoint.trim()) return;

    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const newRoute = await onboardApiRoute({
        endpoint: endpoint.trim(),
        httpMethod
      });

      setEndpoint("");
      setIsModalOpen(false);
      setMessage({ type: "success", text: `API Gateway Route ${newRoute.routeId} onboarded & protected!` });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "Failed to onboard API route." });
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const totalRoutes = routes.length;
    const dpopRoutes = routes.filter((r) => r.authType.includes("DPoP")).length;
    const owaspClean = routes.filter((r) => r.owaspAuditScore.includes("100%")).length;

    return { totalRoutes, dpopRoutes, owaspClean };
  }, [routes]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* 1. Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-slate-100">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-full flex items-center gap-1.5 font-mono">
                <Route size={12} /> OAUTH 2.1 & DPoP SECURITY
              </span>
              <span className="px-3 py-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1 font-mono">
                <ShieldCheck size={12} /> OWASP API TOP 10 ENFORCED
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Healthcare API Gateway & OAuth 2.1 Token Console
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              DPoP (Demonstrating Proof-of-Possession) token binding, mTLS client certificates, rate limiting, and OWASP API vulnerability auditing.
            </p>
          </div>

          {/* Telemetry Widget */}
          <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl w-full lg:w-auto text-xs space-y-2">
            <div className="flex items-center justify-between gap-6 font-mono">
              <span className="text-slate-400 font-sans font-bold uppercase text-[10px]">Gateway Telemetry</span>
              <span className="text-indigo-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                GATEWAY ACTIVE
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-700/80 font-mono text-[11px]">
              <div>API Routes: <strong className="text-white">{metrics.totalRoutes} Enforced</strong></div>
              <div>OAuth 2.1 DPoP: <strong className="text-indigo-300">{metrics.dpopRoutes} Bound</strong></div>
              <div>OWASP Clean: <strong className="text-emerald-400">{metrics.owaspClean} Audited</strong></div>
              <div>mTLS Status: <strong className="text-emerald-400">ACTIVE</strong></div>
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
            onClick={() => setActiveTab("ROUTES")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "ROUTES"
                ? "bg-indigo-600 text-white font-black shadow-lg shadow-indigo-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Route size={15} /> API Gateway Routes ({routes.length})
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
            <ShieldCheck size={15} /> OAuth 2.1 & OWASP Standards ({standards.length})
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-indigo-600/20"
        >
          <PlusCircle size={15} /> Onboard API Route
        </button>
      </div>

      {/* 3. ROUTES TAB */}
      {activeTab === "ROUTES" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">Healthcare API Gateway Endpoints & Token Security</h3>
              <p className="text-xs text-slate-400 font-mono">DPoP token binding, rate limiting, and OWASP audit status</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3">Route ID</th>
                  <th className="p-3">Endpoint & Method</th>
                  <th className="p-3">Auth & Token Bind</th>
                  <th className="p-3">Rate Limit</th>
                  <th className="p-3">OWASP Audit</th>
                  <th className="p-3 text-right">Audit Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {routes.map((r, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/60">
                    <td className="p-3 font-bold text-indigo-400">{r.routeId}</td>
                    <td className="p-3 font-sans">
                      <div className="font-semibold text-white">{r.endpoint}</div>
                      <div className="text-[10px] text-indigo-300 font-mono">{r.httpMethod}</div>
                    </td>
                    <td className="p-3 text-slate-400 font-mono text-[10px]">{r.authType}</td>
                    <td className="p-3 text-slate-300 text-[10px]">{r.rateLimit}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.owaspAuditScore.includes("100%")
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        {r.owaspAuditScore}
                      </span>
                    </td>
                    <td className="p-3 text-right font-sans">
                      <button
                        type="button"
                        onClick={() => handleAuditOwasp(r.routeId)}
                        disabled={actionLoading}
                        className="px-2.5 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 font-bold rounded text-[10px] transition border border-indigo-500/30 flex items-center gap-1 ml-auto"
                      >
                        <ShieldCheck size={12} /> OWASP Audit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. STANDARDS TAB */}
      {activeTab === "STANDARDS" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">OAuth 2.1 & OWASP API Security Specifications</h3>
              <p className="text-xs text-slate-400 font-mono">Standards for securing healthcare REST & gRPC API gateways</p>
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

      {/* 5. ONBOARD MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full text-slate-100 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Route size={18} className="text-indigo-400" /> Onboard API Gateway Route
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleOnboardRoute} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">API Endpoint Path:</label>
                <input
                  type="text"
                  placeholder="e.g. /api/v1/clinical/encounters"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">HTTP Methods:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  value={httpMethod}
                  onChange={(e) => setHttpMethod(e.target.value)}
                >
                  <option value="GET / POST">GET / POST</option>
                  <option value="POST / PUT / DELETE">POST / PUT / DELETE</option>
                  <option value="gRPC Stream">gRPC Stream</option>
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
                  Onboard & Protect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
