import { useState, useEffect, useCallback } from "react";
import {
  Globe,
  ShieldAlert,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Sliders,
  Terminal,
  Cpu,
  Lock,
  Search,
  Radio
} from "lucide-react";
import {
  getActiveFeedConfig,
  updateFeedConfig,
  ingestIndicator,
  triggerMitigation,
  getAllIndicators,
  getAllMitigationLogs
} from "../../services/ThreatIntelligenceService";
import "../../pages/auth/auth.css";

export default function ThreatIntelligencePanel() {
  const [config, setConfig] = useState(null);
  const [indicators, setIndicators] = useState([]);
  const [mitigationLogs, setMitigationLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Config Form State
  const [providerName, setProviderName] = useState("ALIENVAULT_OTX");
  const [updateIntervalHours, setUpdateIntervalHours] = useState(6);
  const [minimumConfidenceScore, setMinimumConfidenceScore] = useState(85);
  const [autoBlockHighConfidence, setAutoBlockHighConfidence] = useState(true);

  // Ingest IOC Form State
  const [indicatorValue, setIndicatorValue] = useState("");
  const [indicatorType, setIndicatorType] = useState("IP_ADDRESS");
  const [threatCategory, setThreatCategory] = useState("MALWARE_C2");
  const [confidenceScore, setConfidenceScore] = useState(90);

  const loadThreatIntelData = useCallback(async () => {
    setLoading(true);
    try {
      const [conf, iocList, mitList] = await Promise.all([
        getActiveFeedConfig().catch(() => null),
        getAllIndicators().catch(() => []),
        getAllMitigationLogs().catch(() => [])
      ]);

      if (conf) {
        setConfig(conf);
        setProviderName(conf.providerName || "ALIENVAULT_OTX");
        setUpdateIntervalHours(conf.updateIntervalHours || 6);
        setMinimumConfidenceScore(conf.minimumConfidenceScore || 85);
        setAutoBlockHighConfidence(conf.autoBlockHighConfidence);
      }

      setIndicators(iocList);
      setMitigationLogs(mitList);
    } catch (err) {
      console.error("Failed to load threat intelligence data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadThreatIntelData();
  }, [loadThreatIntelData]);

  const handleUpdateConfig = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const updated = await updateFeedConfig({
        feedName: "STIX_TAXII_FEED",
        providerName,
        updateIntervalHours: Number(updateIntervalHours),
        minimumConfidenceScore: Number(minimumConfidenceScore),
        autoBlockHighConfidence
      });

      setConfig(updated);
      setMessage({ type: "success", text: "STIX/TAXII Threat Feed Policy saved!" });
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to save feed configuration." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleIngestIndicator = async (e) => {
    e.preventDefault();
    if (!indicatorValue.trim()) return;

    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const ingested = await ingestIndicator({
        indicatorValue: indicatorValue.trim(),
        indicatorType,
        threatCategory,
        confidenceScore: Number(confidenceScore)
      });

      setIndicatorValue("");
      setMessage({ type: "success", text: `IOC ${ingested.indicatorValue} ingested! Status: ${ingested.status}` });
      await loadThreatIntelData();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to ingest IOC indicator." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleBlockIndicator = async (valToBlock) => {
    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const mitResult = await triggerMitigation({
        indicatorValue: valToBlock,
        mitigationAction: "IP_BLOCK"
      });

      setMessage({ type: "success", text: `Firewall Block executed! ID: ${mitResult.mitigationId} for ${mitResult.indicatorValue}` });
      await loadThreatIntelData();
    } catch (err) {
      setMessage({ type: "error", text: "Firewall mitigation trigger failed." });
    } finally {
      setActionLoading(false);
    }
  };

  const activeThreatsCount = indicators.filter((i) => i.status === "ACTIVE").length;

  return (
    <div className="authority-panel-wrapper">
      {/* Header Card */}
      <header className="authority-header-card">
        <div className="authority-header-main">
          <div className="authority-icon-badge bg-red-500/20 text-red-400">
            <Globe size={28} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="authority-title">STIX/TAXII Threat Intelligence & Auto-Mitigation Subsystem</h2>
              <span className="authority-ver-badge bg-red-500/20 text-red-300">
                THREAT FEED: SYNCED ({activeThreatsCount} ACTIVE IOCs)
              </span>
            </div>
            <p className="authority-subtitle">
              Real-time STIX/TAXII indicator ingestion, confidence scoring matrix, and automated firewall/WAF rule enforcement
            </p>
          </div>
        </div>

        <div className="authority-header-actions">
          <button
            type="button"
            className="authority-btn authority-btn-secondary"
            onClick={loadThreatIntelData}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Sync Feeds
          </button>
        </div>
      </header>

      {/* Message Alert */}
      {message.text && (
        <div className={`authority-alert ${message.type === "error" ? "authority-alert-error" : "authority-alert-success"}`}>
          {message.type === "error" ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
          <span>{message.text}</span>
          <button type="button" className="ml-auto text-xs opacity-70 hover:opacity-100" onClick={() => setMessage({ type: "", text: "" })}>
            Dismiss
          </button>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Ingest IOC & Feed Config */}
        <div className="space-y-6 lg:col-span-1">
          {/* Ingest Indicator Form */}
          <div className="authority-card">
            <div className="card-header justify-between">
              <div className="flex items-center gap-2">
                <Radio size={18} className="text-red-400" />
                <h3>Ingest Threat Indicator (IOC)</h3>
              </div>
            </div>

            <form onSubmit={handleIngestIndicator} className="card-body space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Indicator Value (IP / Domain / Hash):</label>
                <input
                  type="text"
                  placeholder="e.g. 198.51.100.45 or bad-c2.org"
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                  value={indicatorValue}
                  onChange={(e) => setIndicatorValue(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">IOC Type:</label>
                  <select
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                    value={indicatorType}
                    onChange={(e) => setIndicatorType(e.target.value)}
                  >
                    <option value="IP_ADDRESS">IP ADDRESS</option>
                    <option value="DOMAIN_NAME">DOMAIN NAME</option>
                    <option value="FILE_HASH">SHA-256 HASH</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category:</label>
                  <select
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                    value={threatCategory}
                    onChange={(e) => setThreatCategory(e.target.value)}
                  >
                    <option value="MALWARE_C2">MALWARE C2</option>
                    <option value="PHISHING">PHISHING</option>
                    <option value="RANSOMWARE">RANSOMWARE</option>
                    <option value="BOTNET">BOTNET</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Confidence Score (0-100%):</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                  value={confidenceScore}
                  onChange={(e) => setConfidenceScore(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="authority-btn authority-btn-primary w-full bg-red-600 hover:bg-red-500 text-white text-xs mt-2"
                disabled={actionLoading}
              >
                Ingest & Evaluate Auto-Block
              </button>
            </form>
          </div>

          {/* Feed Config Settings Card */}
          <div className="authority-card">
            <div className="card-header justify-between">
              <div className="flex items-center gap-2">
                <Sliders size={18} className="text-red-400" />
                <h3>STIX/TAXII Provider Policy</h3>
              </div>
            </div>

            <form onSubmit={handleUpdateConfig} className="card-body space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Threat Feed Provider:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                  value={providerName}
                  onChange={(e) => setProviderName(e.target.value)}
                >
                  <option value="ALIENVAULT_OTX">ALIENVAULT OTX</option>
                  <option value="MISP_THREAT_HUB">MISP THREAT HUB</option>
                  <option value="MANDIANT_INTEL">MANDIANT INTEL</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Auto-Block Confidence Threshold (%):</label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                  value={minimumConfidenceScore}
                  onChange={(e) => setMinimumConfidenceScore(e.target.value)}
                  required
                />
              </div>

              <div className="pt-1">
                <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 cursor-pointer">
                  <span className="text-slate-300 font-semibold">Enable Automated WAF/Firewall Blocks</span>
                  <input
                    type="checkbox"
                    className="rounded text-red-500 focus:ring-red-500 h-4 w-4"
                    checked={autoBlockHighConfidence}
                    onChange={(e) => setAutoBlockHighConfidence(e.target.checked)}
                  />
                </label>
              </div>

              <button
                type="submit"
                className="authority-btn authority-btn-secondary w-full text-xs mt-2"
                disabled={actionLoading}
              >
                Save Feed Policy
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: IOC Findings & Firewall Mitigation History */}
        <div className="authority-card lg:col-span-2 space-y-6">
          {/* IOC Table */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Globe size={18} className="text-red-400" /> Ingested Threat Indicators ({indicators.length})
            </h3>

            <div className="overflow-x-auto rounded-2xl border border-slate-700/50 bg-slate-800/30">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/80 text-slate-400 uppercase font-mono text-[10px]">
                  <tr>
                    <th className="p-3">Indicator Value</th>
                    <th className="p-3">Type & Category</th>
                    <th className="p-3">Confidence</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Firewall Block</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {indicators.map((i, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/50">
                      <td className="p-3 font-bold text-red-300">{i.indicatorValue}</td>
                      <td className="p-3 font-sans">
                        <div className="font-semibold text-white">{i.indicatorType}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{i.threatCategory}</div>
                      </td>
                      <td className="p-3 font-bold text-amber-300">{i.confidenceScore}%</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] ${
                            i.status === "BLOCKED"
                              ? "bg-red-950 text-red-400 border border-red-500/30"
                              : "bg-amber-950 text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          {i.status}
                        </span>
                      </td>
                      <td className="p-3 text-right font-sans">
                        {i.status === "ACTIVE" ? (
                          <button
                            type="button"
                            className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-[10px] font-bold shadow transition"
                            onClick={() => handleBlockIndicator(i.indicatorValue)}
                          >
                            Block Rule
                          </button>
                        ) : (
                          <span className="text-[10px] text-red-400">BLOCKED</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {indicators.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-500 font-sans">
                        No threat indicators ingested.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mitigation Logs Table */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Terminal size={18} className="text-emerald-400" /> Firewall Auto-Mitigation History ({mitigationLogs.length})
            </h3>

            <div className="overflow-x-auto rounded-2xl border border-slate-700/50 bg-slate-800/30">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/80 text-slate-400 uppercase font-mono text-[10px]">
                  <tr>
                    <th className="p-3">Mitigation ID</th>
                    <th className="p-3">Target IOC</th>
                    <th className="p-3">Action</th>
                    <th className="p-3">Executor</th>
                    <th className="p-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {mitigationLogs.map((m, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/50 text-[11px]">
                      <td className="p-3 font-bold text-emerald-400">{m.mitigationId}</td>
                      <td className="p-3 text-red-300">{m.indicatorValue}</td>
                      <td className="p-3 text-slate-300 font-sans font-semibold">{m.mitigationAction}</td>
                      <td className="p-3 text-slate-400">{m.executedBy}</td>
                      <td className="p-3 text-right">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                          {m.executionStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {mitigationLogs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-slate-500 font-sans">
                        No firewall mitigation actions executed yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
