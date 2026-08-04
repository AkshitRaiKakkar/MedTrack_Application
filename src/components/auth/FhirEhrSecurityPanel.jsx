import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  FileHeart,
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
  Share2,
  KeyRound,
  Shield
} from "lucide-react";
import {
  getFhirResources,
  registerFhirResource,
  auditSmartScopes,
  getFhirSecurityStandards
} from "../../services/FhirEhrSecurityService";
import "../../pages/auth/auth.css";

/**
 * FhirEhrSecurityPanel Component
 * 
 * HL7 FHIR R4 Interoperability & EHR Data Security Command Center.
 * Features:
 * 1. SMART on FHIR OAuth 2.0 Scope Security & Access Control Auditor
 * 2. Field-Level Patient Record AES-256-GCM Encryption Matrix
 * 3. HL7 Confidentiality Security Labeling & USCDI Mapping
 * 4. FHIR Resource Onboarding & Audit Engine
 */
export default function FhirEhrSecurityPanel() {
  // State
  const [resources, setResources] = useState([]);
  const [standards, setStandards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("RESOURCES"); // "RESOURCES" | "SMART_SCOPES" | "STANDARDS"

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [resourceType, setResourceType] = useState("Patient / Observation");
  const [smartScope, setSmartScope] = useState("patient/Patient.read patient/Observation.read");
  const [securityTag, setSecurityTag] = useState("RESTRICTED_PHI");

  // Load telemetry
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [resList, stdList] = await Promise.all([
        getFhirResources().catch(() => []),
        getFhirSecurityStandards().catch(() => [])
      ]);

      setResources(resList);
      setStandards(stdList);
    } catch (err) {
      console.error("Failed to load FHIR security data:", err);
      setMessage({ type: "error", text: "Failed connecting to FHIR EHR security service." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Audit SMART Scopes
  const handleAuditScope = async (resourceId) => {
    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const result = await auditSmartScopes(resourceId);
      setMessage({ type: "success", text: `Resource ${resourceId} SMART Scopes Audited! Verdict: ${result.auditVerdict}` });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "SMART scope audit failed." });
    } finally {
      setActionLoading(false);
    }
  };

  // Register FHIR Resource
  const handleRegisterResource = async (e) => {
    e.preventDefault();

    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const newRes = await registerFhirResource({
        resourceType,
        smartOnFhirScope: smartScope,
        securityTag
      });

      setIsModalOpen(false);
      setMessage({ type: "success", text: `FHIR Resource ${newRes.resourceId} registered & encrypted!` });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "Failed to register FHIR resource." });
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const totalResources = resources.length;
    const encryptedCount = resources.filter((r) => r.encryptionMode.includes("AES-256")).length;
    const smartAuthorized = resources.filter((r) => r.smartAuthStatus === "SMART_OAUTH2_AUTHORIZED").length;
    const highRiskAudit = resources.filter((r) => r.securityTag === "HIGH_RISK_AUDIT").length;

    return { totalResources, encryptedCount, smartAuthorized, highRiskAudit };
  }, [resources]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* 1. Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-slate-100">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded-full flex items-center gap-1.5 font-mono">
                <FileHeart size={12} /> HL7 FHIR R4 COMPLIANT
              </span>
              <span className="px-3 py-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1 font-mono">
                <Share2 size={12} /> SMART ON FHIR OAUTH 2.0
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              HL7 FHIR R4 Interoperability & EHR Data Security Console
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Granular SMART on FHIR OAuth2 access controls, field-level AES-256-GCM patient record encryption, USCDI v1 data element mapping, and HIPAA security rule auditing.
            </p>
          </div>

          {/* Telemetry Widget */}
          <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl w-full lg:w-auto text-xs space-y-2">
            <div className="flex items-center justify-between gap-6 font-mono">
              <span className="text-slate-400 font-sans font-bold uppercase text-[10px]">FHIR Telemetry</span>
              <span className="text-purple-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                INTEROPERABLE
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-700/80 font-mono text-[11px]">
              <div>FHIR Resources: <strong className="text-white">{metrics.totalResources} Managed</strong></div>
              <div>Field Encrypted: <strong className="text-emerald-400">{metrics.encryptedCount} AES-256</strong></div>
              <div>SMART Authorized: <strong className="text-purple-300">{metrics.smartAuthorized} Active</strong></div>
              <div>High Risk Flagged: <strong className="text-amber-400">{metrics.highRiskAudit} Audit</strong></div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        {message.text && (
          <div
            className={`mt-6 p-4 rounded-xl text-sm font-medium flex items-center justify-between border ${
              message.type === "error"
                ? "bg-red-500/10 border-red-500/30 text-red-400"
                : "bg-purple-500/10 border-purple-500/30 text-purple-400"
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
            onClick={() => setActiveTab("RESOURCES")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "RESOURCES"
                ? "bg-purple-600 text-white font-black shadow-lg shadow-purple-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <FileHeart size={15} /> FHIR Resources ({resources.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("STANDARDS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "STANDARDS"
                ? "bg-purple-600 text-white font-black shadow-lg shadow-purple-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Share2 size={15} /> Standards & Profiles ({standards.length})
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-purple-600/20"
        >
          <PlusCircle size={15} /> Onboard FHIR Resource
        </button>
      </div>

      {/* 3. FHIR RESOURCES TAB */}
      {activeTab === "RESOURCES" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">Registered FHIR R4 Resources & Security Tags</h3>
              <p className="text-xs text-slate-400 font-mono">Field-level encryption, SMART scopes, and HIPAA confidentiality tags</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3">Resource ID</th>
                  <th className="p-3">Type & FHIR Version</th>
                  <th className="p-3">SMART OAuth Scopes</th>
                  <th className="p-3">Field Encryption</th>
                  <th className="p-3">Security Tag</th>
                  <th className="p-3 text-right">Scope Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {resources.map((r, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/60">
                    <td className="p-3 font-bold text-purple-400">{r.resourceId}</td>
                    <td className="p-3 font-sans">
                      <div className="font-semibold text-white">{r.resourceType}</div>
                      <div className="text-[10px] text-purple-300 font-mono">{r.fhirVersion}</div>
                    </td>
                    <td className="p-3 text-slate-400 font-mono text-[10px] break-all max-w-xs">{r.smartOnFhirScope}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.encryptionMode.includes("AES-256")
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-red-500/20 text-red-400 border border-red-500/30"
                        }`}
                      >
                        {r.encryptionMode}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                        {r.securityTag}
                      </span>
                    </td>
                    <td className="p-3 text-right font-sans">
                      <button
                        type="button"
                        onClick={() => handleAuditScope(r.resourceId)}
                        disabled={actionLoading}
                        className="px-2.5 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-bold rounded text-[10px] transition border border-purple-500/30 flex items-center gap-1 ml-auto"
                      >
                        <ShieldCheck size={12} /> Audit Scope
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
              <h3 className="text-base font-bold text-white">FHIR R4 Security Standards & Implementation Specifications</h3>
              <p className="text-xs text-slate-400 font-mono">Official HL7, SMART, and ONC interoperability security rules</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {standards.map((s, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded font-bold">
                    {s.standard}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white">{s.profile}</h4>
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
                <FileHeart size={18} className="text-purple-400" /> Onboard FHIR R4 Resource
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRegisterResource} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Resource Type:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-sans"
                  value={resourceType}
                  onChange={(e) => setResourceType(e.target.value)}
                >
                  <option value="Patient / Observation">Patient / Observation</option>
                  <option value="MedicationRequest / DiagnosticReport">MedicationRequest / DiagnosticReport</option>
                  <option value="Encounter / Condition">Encounter / Condition</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">SMART on FHIR Scope:</label>
                <input
                  type="text"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                  value={smartScope}
                  onChange={(e) => setSmartScope(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Confidentiality Tag:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                  value={securityTag}
                  onChange={(e) => setSecurityTag(e.target.value)}
                >
                  <option value="RESTRICTED_PHI">RESTRICTED_PHI (Encrypted)</option>
                  <option value="CONFIDENTIAL_CLINICAL">CONFIDENTIAL_CLINICAL</option>
                  <option value="HIGH_RISK_AUDIT">HIGH_RISK_AUDIT</option>
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
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition shadow-lg shadow-purple-600/20"
                >
                  Onboard Resource
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
