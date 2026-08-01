import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Skull,
  ShieldAlert,
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
  Radio,
  RadioTower,
  Zap,
  Target,
  FileJson
} from "lucide-react";
import {
  getThreatFeeds,
  ingestThreatIndicator,
  syncTaxiiFeed,
  getTaxiiCollections
} from "../../services/ThreatIntelService";
import "../../pages/auth/auth.css";

/**
 * ThreatIntelPanel Component
 * 
 * STIX 2.1 / TAXII 2.1 Biomedical Cyber Threat Intelligence Command Center.
 * Features:
 * 1. STIX 2.1 Threat Object Ingestion & MITRE ATT&CK Mapping
 * 2. TAXII 2.1 Feed Server Synchronization (H-ISAC & CISA HHS)
 * 3. Healthcare IOC (Indicators of Compromise) Blacklist Enforcement
 * 4. Threat Indicator Ingestion & Intelligence Search Sandbox
 */
export default function ThreatIntelPanel() {
  // State
  const [feeds, setFeeds] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("FEEDS"); // "FEEDS" | "TAXII"

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [threatActor, setThreatActor] = useState("");
  const [iocType, setIocType] = useState("Malicious IP / C2 Domain");
  const [iocValue, setIocValue] = useState("");

  // Load telemetry
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [feedList, colList] = await Promise.all([
        getThreatFeeds().catch(() => []),
        getTaxiiCollections().catch(() => [])
      ]);

      setFeeds(feedList);
      setCollections(colList);
    } catch (err) {
      console.error("Failed to load STIX/TAXII threat intel data:", err);
      setMessage({ type: "error", text: "Failed connecting to threat intelligence service." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Sync TAXII Feed
  const handleSyncTaxii = async () => {
    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const result = await syncTaxiiFeed();
      setMessage({ type: "success", text: `TAXII 2.1 Synchronized! Ingested ${result.newIndicatorsIngested} new STIX indicators.` });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "TAXII sync failed." });
    } finally {
      setActionLoading(false);
    }
  };

  // Ingest Indicator
  const handleIngestIndicator = async (e) => {
    e.preventDefault();
    if (!iocValue.trim()) return;

    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const newIoc = await ingestThreatIndicator({
        threatActor: threatActor.trim() || "APT Syndicate",
        iocType,
        iocValue: iocValue.trim()
      });

      setThreatActor("");
      setIocValue("");
      setIsModalOpen(false);
      setMessage({ type: "success", text: `STIX Indicator ${newIoc.indicatorId} ingested & blocked!` });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "Failed to ingest STIX indicator." });
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const totalFeeds = feeds.length;
    const activeBlocked = feeds.filter((f) => f.status === "ACTIVE_BLOCKED" || f.status === "SIGNATURE_ENFORCED").length;
    const highConfidence = feeds.filter((f) => f.confidenceScore.includes("HIGH") || f.confidenceScore.includes("CRITICAL")).length;

    return { totalFeeds, activeBlocked, highConfidence };
  }, [feeds]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* 1. Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-slate-100">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-red-400 bg-red-500/10 border border-red-500/20 rounded-full flex items-center gap-1.5 font-mono">
                <Skull size={12} /> STIX 2.1 / TAXII 2.1
              </span>
              <span className="px-3 py-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1 font-mono">
                <RadioTower size={12} /> H-ISAC THREAT SHARING
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Biomedical Cyber Threat Intelligence Console
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Automated STIX 2.1 indicator ingestion, TAXII 2.1 real-time threat feeds, H-ISAC healthcare IOC sharing, and MITRE ATT&CK ransomware signature enforcement.
            </p>
          </div>

          {/* Telemetry Widget */}
          <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl w-full lg:w-auto text-xs space-y-2">
            <div className="flex items-center justify-between gap-6 font-mono">
              <span className="text-slate-400 font-sans font-bold uppercase text-[10px]">Threat Level</span>
              <span className="text-red-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                EHR THREAT DEFENSE
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-700/80 font-mono text-[11px]">
              <div>Total STIX IOCs: <strong className="text-white">{metrics.totalFeeds} Indicators</strong></div>
              <div>Active Blocked: <strong className="text-emerald-400">{metrics.activeBlocked} Enforced</strong></div>
              <div>High Confidence: <strong className="text-red-400">{metrics.highConfidence} High/Critical</strong></div>
              <div>TAXII Status: <strong className="text-emerald-400">SYNCHRONIZED</strong></div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        {message.text && (
          <div
            className={`mt-6 p-4 rounded-xl text-sm font-medium flex items-center justify-between border ${
              message.type === "error"
                ? "bg-red-500/10 border-red-500/30 text-red-400"
                : "bg-red-500/10 border-red-500/30 text-red-400"
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
                ? "bg-red-600 text-white font-black shadow-lg shadow-red-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Target size={15} /> STIX Threat Indicators ({feeds.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("TAXII")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "TAXII"
                ? "bg-red-600 text-white font-black shadow-lg shadow-red-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <RadioTower size={15} /> TAXII Collections ({collections.length})
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSyncTaxii}
            disabled={actionLoading}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-red-400 border border-red-500/30 font-bold rounded-xl text-xs transition flex items-center gap-2"
          >
            <RefreshCw size={15} className={actionLoading ? "animate-spin" : ""} /> Sync TAXII Feeds
          </button>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-red-600/20"
          >
            <PlusCircle size={15} /> Ingest STIX Indicator
          </button>
        </div>
      </div>

      {/* 3. STIX INDICATORS TAB */}
      {activeTab === "FEEDS" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">Ingested STIX 2.1 Indicators of Compromise</h3>
              <p className="text-xs text-slate-400 font-mono">Healthcare ransomware hashes, malicious C2 IP addresses, and MITRE ATT&CK tactics</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3">Indicator ID</th>
                  <th className="p-3">Threat Actor & Target</th>
                  <th className="p-3">IOC Value / Hash</th>
                  <th className="p-3">MITRE ATT&CK</th>
                  <th className="p-3">Confidence</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {feeds.map((f, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/60">
                    <td className="p-3 font-bold text-red-400">{f.indicatorId}</td>
                    <td className="p-3 font-sans">
                      <div className="font-semibold text-white">{f.threatActor}</div>
                      <div className="text-[10px] text-red-300 font-mono">{f.targetSector}</div>
                    </td>
                    <td className="p-3 text-slate-300 font-mono text-[10px] break-all max-w-xs">{f.iocValue}</td>
                    <td className="p-3 text-slate-400 font-mono text-[10px]">{f.mitreAttackId}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                        {f.confidenceScore}
                      </span>
                    </td>
                    <td className="p-3 text-right font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {f.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. TAXII COLLECTIONS TAB */}
      {activeTab === "TAXII" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">TAXII 2.1 Threat Sharing Feed Server Channels</h3>
              <p className="text-xs text-slate-400 font-mono">Live feeds connected to H-ISAC, CISA, and FDA cyber threat intelligence hubs</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {collections.map((c, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded font-bold">
                    {c.collectionId}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white">{c.title}</h4>
                <p className="text-xs text-slate-400 font-mono">{c.mediaType}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. INGEST MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full text-slate-100 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Skull size={18} className="text-red-400" /> Ingest STIX 2.1 Threat Indicator
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleIngestIndicator} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Threat Actor / Campaign:</label>
                <input
                  type="text"
                  placeholder="e.g. Lazarus Healthcare Variant"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-sans"
                  value={threatActor}
                  onChange={(e) => setThreatActor(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">IOC Type:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                  value={iocType}
                  onChange={(e) => setIocType(e.target.value)}
                >
                  <option value="Malicious IP / C2 Domain">Malicious IP / C2 Domain</option>
                  <option value="File Hash (SHA-256)">File Hash (SHA-256)</option>
                  <option value="Spearphishing Attachment Hash">Spearphishing Attachment Hash</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">IOC Value / Cipher Hash / IP:</label>
                <input
                  type="text"
                  placeholder="e.g. 185.220.101.44"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                  value={iocValue}
                  onChange={(e) => setIocValue(e.target.value)}
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
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition shadow-lg shadow-red-600/20"
                >
                  Ingest & Block
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
