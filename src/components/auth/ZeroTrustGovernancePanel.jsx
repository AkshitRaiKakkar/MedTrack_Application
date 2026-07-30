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
  Check
} from "lucide-react";
import {
  getGovernancePolicies,
  createGovernancePolicy,
  getActiveTrustEvaluations,
  evaluateTrustSimulation
} from "../../services/ZeroTrustGovernanceService";
import "../../pages/auth/auth.css";

/**
 * ZeroTrustGovernancePanel Component
 * 
 * Zero Trust Identity Governance & Adaptive Access Policy Command Center.
 * Features:
 * 1. Adaptive Risk-Based Trust Score Simulator Engine
 * 2. Dynamic Policy Rule Configurator & Enforcement Engine
 * 3. Continuous Real-Time User & Device Trust Evaluation Stream
 * 4. Automatic Step-Up MFA & Quarantine Orchestration
 */
export default function ZeroTrustGovernancePanel() {
  // State
  const [policies, setPolicies] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("SIMULATOR"); // "SIMULATOR" | "POLICIES" | "EVALUATIONS"

  // Simulator State
  const [simDevicePosture, setSimDevicePosture] = useState("COMPLIANT_MDM");
  const [simNetworkTrust, setSimNetworkTrust] = useState("INTERNAL_VPC");
  const [simBehaviorScore, setSimBehaviorScore] = useState(85);
  const [simResult, setSimResult] = useState(null);

  // New Policy Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [policyName, setPolicyName] = useState("");
  const [resourceScope, setResourceScope] = useState("EHR_PATIENT_RECORDS");
  const [minTrustScore, setMinTrustScore] = useState(80);
  const [enforcementAction, setEnforcementAction] = useState("REQUIRE_BIOMETRIC_PASSKEY");

  // Load telemetry
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [polList, evalList] = await Promise.all([
        getGovernancePolicies().catch(() => []),
        getActiveTrustEvaluations().catch(() => [])
      ]);

      setPolicies(polList);
      setEvaluations(evalList);
    } catch (err) {
      console.error("Failed to load Zero Trust governance data:", err);
      setMessage({ type: "error", text: "Failed connecting to Zero Trust governance service." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Execute Trust Simulation
  const handleSimulateTrust = async (e) => {
    e?.preventDefault();

    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const result = await evaluateTrustSimulation({
        devicePosture: simDevicePosture,
        networkTrust: simNetworkTrust,
        behaviorScore: Number(simBehaviorScore)
      });
      setSimResult(result);
      setMessage({ type: "success", text: `Trust evaluation completed! Calculated Score: ${result.simulatedTrustScore}` });
    } catch (err) {
      setMessage({ type: "error", text: "Trust simulation failed." });
    } finally {
      setActionLoading(false);
    }
  };

  // Create Policy
  const handleCreatePolicy = async (e) => {
    e.preventDefault();
    if (!policyName.trim()) return;

    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const newPolicy = await createGovernancePolicy({
        policyName: policyName.trim(),
        resourceScope,
        minTrustScore: Number(minTrustScore),
        enforcementAction
      });

      setPolicyName("");
      setIsModalOpen(false);
      setMessage({ type: "success", text: `Policy ${newPolicy.policyId} registered and active across network perimeter!` });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "Failed creating Zero Trust policy." });
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const totalPolicies = policies.length;
    const totalEvaluations = evaluations.length;
    const grantedCount = evaluations.filter((e) => e.verdict === "ACCESS_GRANTED").length;
    const challengeCount = evaluations.filter((e) => e.verdict.includes("STEP_UP")).length;
    const deniedCount = evaluations.filter((e) => e.verdict.includes("DENIED")).length;

    return { totalPolicies, totalEvaluations, grantedCount, challengeCount, deniedCount };
  }, [policies, evaluations]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* 1. Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-slate-100">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-sky-400 bg-sky-500/10 border border-sky-500/20 rounded-full flex items-center gap-1.5 font-mono">
                <Network size={12} /> ZERO TRUST ARCHITECTURE
              </span>
              <span className="px-3 py-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1 font-mono">
                <ShieldCheck size={12} /> ADAPTIVE RISK POLICIES
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Zero Trust Identity Governance & Adaptive Access Console
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Continuous trust score evaluation, device posture verification, dynamic step-up MFA challenge triggers, and automated session quarantine.
            </p>
          </div>

          {/* Telemetry Widget */}
          <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl w-full lg:w-auto text-xs space-y-2">
            <div className="flex items-center justify-between gap-6 font-mono">
              <span className="text-slate-400 font-sans font-bold uppercase text-[10px]">Zero Trust State</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                PROTECTED
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-700/80 font-mono text-[11px]">
              <div>Active Policies: <strong className="text-white">{metrics.totalPolicies} Enforced</strong></div>
              <div>Evaluations Stream: <strong className="text-sky-300">{metrics.totalEvaluations} Verified</strong></div>
              <div>Step-Up Challenges: <strong className="text-amber-400">{metrics.challengeCount} Issued</strong></div>
              <div>Quarantined Sessions: <strong className="text-red-400">{metrics.deniedCount} Blocked</strong></div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        {message.text && (
          <div
            className={`mt-6 p-4 rounded-xl text-sm font-medium flex items-center justify-between border ${
              message.type === "error"
                ? "bg-red-500/10 border-red-500/30 text-red-400"
                : "bg-sky-500/10 border-sky-500/30 text-sky-400"
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
            onClick={() => setActiveTab("SIMULATOR")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "SIMULATOR"
                ? "bg-sky-600 text-white font-black shadow-lg shadow-sky-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <SlidersHorizontal size={15} /> Trust Score Simulator
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("POLICIES")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "POLICIES"
                ? "bg-sky-600 text-white font-black shadow-lg shadow-sky-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Lock size={15} /> Policy Rules ({policies.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("EVALUATIONS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "EVALUATIONS"
                ? "bg-sky-600 text-white font-black shadow-lg shadow-sky-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Activity size={15} /> Live Evaluation Stream ({evaluations.length})
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-sky-600/20"
        >
          <PlusCircle size={15} /> Create Governance Policy
        </button>
      </div>

      {/* 3. SIMULATOR TAB */}
      {activeTab === "SIMULATOR" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Simulation Inputs */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <SlidersHorizontal size={18} className="text-sky-400" /> Trust Score Policy Evaluation Matrix
              </h3>
            </div>

            <form onSubmit={handleSimulateTrust} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Device Posture State:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  value={simDevicePosture}
                  onChange={(e) => setSimDevicePosture(e.target.value)}
                >
                  <option value="COMPLIANT_MDM">COMPLIANT MANAGED DEVICE (MDM)</option>
                  <option value="UNMANAGED_DEVICE">UNMANAGED PERSONAL DEVICE (BYOD)</option>
                  <option value="OUTDATED_OS_COMPROMISED">COMPROMISED / OUTDATED DEVICE</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Network Context:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  value={simNetworkTrust}
                  onChange={(e) => setSimNetworkTrust(e.target.value)}
                >
                  <option value="INTERNAL_VPC">INTERNAL SECURE VPC (10.0.0.0/8)</option>
                  <option value="EXTERNAL_ISP">EXTERNAL ISP BROADBAND</option>
                  <option value="ANONYMOUS_TOR_VPN">ANONYMIZED TOR / UNTRUSTED VPN</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 font-bold mb-1">
                  <span>User Behavior Baseline Score:</span>
                  <span className="text-sky-400 font-mono">{simBehaviorScore} / 100</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={simBehaviorScore}
                  onChange={(e) => setSimBehaviorScore(e.target.value)}
                  className="w-full accent-sky-500 bg-slate-950 rounded-lg cursor-pointer"
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-lg shadow-sky-600/20"
              >
                <Activity size={16} /> Evaluate Trust & Access Verdict
              </button>
            </form>
          </div>

          {/* Right Column: Simulation Verdict Output */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-400" /> Evaluation Verdict Output
              </h3>
            </div>

            {simResult ? (
              <div className="space-y-4 font-mono text-xs">
                <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-2">
                  <span className="text-[10px] text-slate-400 font-sans uppercase tracking-wider font-bold">Calculated Trust Score</span>
                  <div className="text-4xl font-black text-sky-400">{simResult.simulatedTrustScore} / 100</div>
                  <div className="pt-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        simResult.verdict === "ACCESS_GRANTED"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : simResult.verdict.includes("STEP_UP")
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : "bg-red-500/20 text-red-400 border border-red-500/30"
                      }`}
                    >
                      {simResult.verdict}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-[11px]">
                  <div className="font-bold text-slate-300 font-sans border-b border-slate-800 pb-1">Score Breakdown Factors:</div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Device Posture Factor:</span>
                    <strong className="text-emerald-400">{simResult.evaluationFactors.devicePostureBonus}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Network Trust Factor:</span>
                    <strong className="text-sky-300">{simResult.evaluationFactors.networkTrustBonus}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Anomaly Penalty:</span>
                    <strong className="text-red-400">{simResult.evaluationFactors.anomalyDeduction}</strong>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-2xl">
                Click "Evaluate Trust & Access Verdict" to run live Zero Trust access policy simulation.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. POLICIES TAB */}
      {activeTab === "POLICIES" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">Active Zero Trust Policy Rules</h3>
              <p className="text-xs text-slate-400 font-mono">Dynamic policy enforcement and minimum required trust score thresholds</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3">Policy ID</th>
                  <th className="p-3">Policy Name & Scope</th>
                  <th className="p-3">Min Trust Score</th>
                  <th className="p-3">Enforcement Action</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {policies.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/60">
                    <td className="p-3 font-bold text-sky-400">{p.policyId}</td>
                    <td className="p-3 font-sans">
                      <div className="font-semibold text-white">{p.policyName}</div>
                      <div className="text-[10px] text-sky-300 font-mono">{p.resourceScope}</div>
                    </td>
                    <td className="p-3 font-bold text-emerald-400">{p.minTrustScore} / 100</td>
                    <td className="p-3 text-amber-300">{p.enforcementAction}</td>
                    <td className="p-3 text-right font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. EVALUATIONS TAB */}
      {activeTab === "EVALUATIONS" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">Live User & Device Trust Evaluation Stream</h3>
              <p className="text-xs text-slate-400 font-mono">Real-time access decisions across health application workloads</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3">Evaluation ID</th>
                  <th className="p-3">User & Network</th>
                  <th className="p-3">Device Posture</th>
                  <th className="p-3">Trust Score</th>
                  <th className="p-3 text-right">Verdict</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {evaluations.map((e, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/60">
                    <td className="p-3 font-bold text-sky-400">{e.evaluationId}</td>
                    <td className="p-3 font-sans">
                      <div className="font-semibold text-white">{e.userEmail}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{e.networkLocation}</div>
                    </td>
                    <td className="p-3 text-slate-300">{e.devicePosture}</td>
                    <td className="p-3 font-bold text-emerald-400">{e.trustScore} / 100</td>
                    <td className="p-3 text-right font-sans">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          e.verdict === "ACCESS_GRANTED"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : e.verdict.includes("STEP_UP")
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            : "bg-red-500/20 text-red-400 border border-red-500/30"
                        }`}
                      >
                        {e.verdict}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. CREATE POLICY MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full text-slate-100 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Lock size={18} className="text-sky-400" /> Create Zero Trust Policy Rule
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreatePolicy} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Policy Rule Name:</label>
                <input
                  type="text"
                  placeholder="e.g. High-Risk EHR Access Step-Up MFA"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-sans"
                  value={policyName}
                  onChange={(e) => setPolicyName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Resource Scope:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  value={resourceScope}
                  onChange={(e) => setResourceScope(e.target.value)}
                >
                  <option value="EHR_PATIENT_RECORDS">EHR PATIENT RECORDS</option>
                  <option value="ALL_SECURITY_CONSOLE">ALL SECURITY CONSOLE</option>
                  <option value="TELEMETRY_PIPELINES">TELEMETRY PIPELINES</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Minimum Trust Score (0-100):</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  value={minTrustScore}
                  onChange={(e) => setMinTrustScore(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Enforcement Action:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  value={enforcementAction}
                  onChange={(e) => setEnforcementAction(e.target.value)}
                >
                  <option value="REQUIRE_BIOMETRIC_PASSKEY">REQUIRE BIOMETRIC PASSKEY</option>
                  <option value="TERMINATE_SESSION_AND_ALERT">TERMINATE SESSION & ALERT</option>
                  <option value="RESTRICT_TO_READ_ONLY">RESTRICT TO READ ONLY</option>
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
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl transition shadow-lg shadow-sky-600/20"
                >
                  Save Policy Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
