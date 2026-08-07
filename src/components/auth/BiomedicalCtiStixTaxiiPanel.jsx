import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Radar,
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
  Radio
} from "lucide-react";
import {
  getCtiStixTaxiiInventory,
  ingestTaxiiFeed,
  enforceIocBlocklist,
  getCtiStixTaxiiStandards
} from "../../services/BiomedicalCtiStixTaxiiService";
import "../../pages/auth/auth.css";

/**
 * BiomedicalCtiStixTaxiiPanel Component
 * 
 * Biomedical Cyber Threat Intelligence (CTI) & STIX/TAXII Threat Sharing Console.
 * Features:
 * 1. Health-ISAC & CISA STIX 2.1 Threat Feed Inventory & TAXII 2.1 Synchronization
 * 2. Automated IoC Firewall & eBPF Blocklist Injection Sandbox
 * 3. OASIS STIX/TAXII 2.1 & Health-ISAC Standards
 * 4. TAXII Threat Feed Subscription & Ingestion Modal
 */
export default function BiomedicalCtiStixTaxiiPanel() {
  // State
  const [feeds, setFeeds] = useState([]);
  const [standards, setStandards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("FEEDS"); // "FEEDS" | "SANDBOX" | "STANDARDS"

  // Sandbox State
  const [selectedFeedId, setSelectedFeedId] = useState("CTI-FEED-1001");
  const [enforceResult, setEnforceResult] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedName, setFeedName] = useState("");

  // Load telemetry
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [fdList, stdList] = await Promise.all([
        getCtiStixTaxiiInventory().catch(() => []),
        getCtiStixTaxiiStandards().catch(() => [])
      ]);

      setFeeds(fdList);
      setStandards(stdList);
    } catch (err) {
      console.error("Failed to load biomedical CTI STIX/TAXII data:", err);
      setMessage({ type: "error", text: "Failed connecting to CTI STIX/TAXII service." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Run IoC Enforcement
  const handleEnforceIoc = async (e) => {
    e?.preventDefault();
    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const result = await enforceIocBlocklist(selectedFeedId);
      setEnforceResult(result);
      setMessage({ type: "success", text: `Automated IoC Enforcement completed in ${result.latencyMs}ms! ${result.iocsPushedToFirewall} IoCs pushed to Firewall, ${result.ebpfRulesInjected} eBPF rules injected.` });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "Automated IoC enforcement failed." });
    } finally {
      setActionLoading(false);
    }
  };

  // Ingest TAXII Feed
  const handleIngestFeed = async (e) => {
    e.preventDefault();
    if (!feedName.trim()) return;

    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const newFd = await ingestTaxiiFeed({ feedName: feedName.trim() });

      setFeedName("");
      setIsModalOpen(false);
      setMessage({ type: "success", text: `TAXII 2.1 Threat Feed ${newFd.feedId} subscribed & synchronized with STIX 2.1 graph!` });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "Failed to subscribe to TAXII threat feed." });
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const totalFeeds = feeds.length;
    const synchronizedCount = feeds.filter((f) => f.feedStatus.includes("ACTIVE")).length;
    const highConfidenceFeeds = feeds.filter((f) => f.confidenceScore >= 95).length;

    return { totalFeeds, synchronizedCount, highConfidenceFeeds };
  }, [feeds]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* 1. Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-slate-100">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 rounded-full flex items-center gap-1.5 font-mono">
                <Radar size={12} /> CYBER THREAT INTELLIGENCE (CTI)
              </span>
              <span className="px-3 py-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1 font-mono">
                <ShieldCheck size={12} /> STIX 2.1 & TAXII 2.1 PROTOCOL
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Biomedical CTI & STIX/TAXII Threat Sharing
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Real-time Health-ISAC & CISA threat intelligence feed ingestion, STIX 2.1 JSON-LD graph objects, TAXII 2.1 RESTful synchronization, and automated firewall IoC blocklist injection.
            </p>
          </div>

          {/* Telemetry Widget */}
          <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl w-full lg:w-auto text-xs space-y-2">
            <div className="flex items-center justify-between gap-6 font-mono">
              <span className="text-slate-400 font-sans font-bold uppercase text-[10px]">TAXII Feed Telemetry</span>
              <span className="text-cyan-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                TAXII 2.1 SYNCED
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-700/80 font-mono text-[11px]">
              <div>CTI Feeds: <strong className="text-white">{metrics.totalFeeds} Connected</strong></div>
              <div>Health-ISAC Feed: <strong className="text-cyan-300">STIX 2.1 Active</strong></div>
              <div>High Confidence: <strong className="text-emerald-400">{metrics.highConfidenceFeeds} (&gt;= 95%)</strong></div>
              <div>IoC Enforcement: <strong className="text-emerald-400">AUTOMATED BLOCK</strong></div>
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
            onClick={() => setActiveTab("FEEDS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "FEEDS"
                ? "bg-cyan-600 text-white font-black shadow-lg shadow-cyan-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Radar size={15} /> CTI Threat Feeds ({feeds.length})
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
            <Zap size={15} /> IoC Enforcement & Firewall Sandbox
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
            <ShieldCheck size={15} /> OASIS STIX/TAXII 2.1 Standards ({standards.length})
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-cyan-600/20"
        >
          <PlusCircle size={15} /> Subscribe TAXII 2.1 Feed
        </button>
      </div>

      {/* 3. FEEDS TAB */}
      {activeTab === "FEEDS" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">TAXII 2.1 Feeds & Active STIX 2.1 Indicators</h3>
              <p className="text-xs text-slate-400 font-mono">Feed IDs, TAXII server endpoints, confidence scores, active IoCs, and synchronization status</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3">Feed ID</th>
                  <th className="p-3">Feed Name & TAXII Endpoint</th>
                  <th className="p-3">Confidence Score</th>
                  <th className="p-3">Active IoC Indicators</th>
                  <th className="p-3 text-right">Feed Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {feeds.map((f, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/60">
                    <td className="p-3 font-bold text-cyan-400">{f.feedId}</td>
                    <td className="p-3 font-sans">
                      <div className="font-semibold text-white">{f.feedName}</div>
                      <div className="text-[10px] text-cyan-300 font-mono">{f.taxiiServerUrl}</div>
                    </td>
                    <td className="p-3 text-emerald-400 font-bold text-[10px]">{f.confidenceScore}%</td>
                    <td className="p-3 text-slate-300 font-mono text-[10px]">
                      {f.activeIocs.join(", ")}
                    </td>
                    <td className="p-3 text-right font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {f.feedStatus}
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
                <Zap size={18} className="text-cyan-400" /> Automated IoC Blocklist & Firewall Enforcer
              </h3>
            </div>

            <form onSubmit={handleEnforceIoc} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Target TAXII CTI Feed:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-sans"
                  value={selectedFeedId}
                  onChange={(e) => setSelectedFeedId(e.target.value)}
                >
                  {feeds.map((f) => (
                    <option key={f.feedId} value={f.feedId}>
                      {f.feedId} - {f.feedName}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-lg shadow-cyan-600/20"
              >
                <Zap size={16} /> Execute Automated IoC Enforcement & Firewall Injection
              </button>
            </form>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-400" /> Enforcement Output
              </h3>
            </div>

            {enforceResult ? (
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-sans font-bold uppercase">Enforcement State:</span>
                  <div className="text-sm font-bold text-emerald-400">{enforceResult.enforcementStatus}</div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px] p-3 bg-slate-950/60 rounded-xl border border-slate-800 font-sans">
                  <div>Firewall IoCs Pushed: <strong className="text-emerald-400 font-mono text-[10px]">{enforceResult.iocsPushedToFirewall} Rules</strong></div>
                  <div>eBPF Rules Injected: <strong className="text-emerald-400">{enforceResult.ebpfRulesInjected} Rules</strong></div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-2xl">
                Click "Execute Automated IoC Enforcement & Firewall Injection" to push threat blocklists.
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
              <h3 className="text-base font-bold text-white">OASIS STIX 2.1 & TAXII 2.1 Standards</h3>
              <p className="text-xs text-slate-400 font-mono">Frameworks for structured threat information expression, automated intelligence exchange, and Health-ISAC feeds</p>
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
                <Radar size={18} className="text-cyan-400" /> Subscribe TAXII 2.1 Feed
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleIngestFeed} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Feed Name / Provider:</label>
                <input
                  type="text"
                  placeholder="e.g. Global Bio-Pharma Threat Feed"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-sans"
                  value={feedName}
                  onChange={(e) => setFeedName(e.target.value)}
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
                  Subscribe Feed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
