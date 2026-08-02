import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Activity,
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
  Network,
  Smartphone,
  Globe,
  SlidersHorizontal,
  HeartPulse,
  Radio,
  Wifi,
  Zap
} from "lucide-react";
import {
  getRpmStreams,
  pairRpmDevice,
  scanBiometricAnomalies,
  getRpmSecurityStandards
} from "../../services/RpmTelemetryService";
import "../../pages/auth/auth.css";

/**
 * RpmTelemetryPanel Component
 * 
 * Remote Patient Monitoring (RPM) & Biometric Sensor Telemetry Console.
 * Features:
 * 1. Wearable Medical Sensor (ECG, CGM, SpO2) Data Stream Ingestion
 * 2. End-to-End AES-256-GCM Telemetry Encryption & Pseudonymization
 * 3. Real-Time Vital Signal Tamper & Anomaly Detection
 * 4. RPM Wearable Device Pairing & FDA Security Compliance
 */
export default function RpmTelemetryPanel() {
  // State
  const [streams, setStreams] = useState([]);
  const [standards, setStandards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("STREAMS"); // "STREAMS" | "STANDARDS"

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deviceType, setDeviceType] = useState("Continuous Cardiac Monitor (ECG 12-Lead)");

  // Load telemetry
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [streamList, stdList] = await Promise.all([
        getRpmStreams().catch(() => []),
        getRpmSecurityStandards().catch(() => [])
      ]);

      setStreams(streamList);
      setStandards(stdList);
    } catch (err) {
      console.error("Failed to load RPM telemetry data:", err);
      setMessage({ type: "error", text: "Failed connecting to RPM service." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Scan Stream Anomalies
  const handleScanStream = async (streamId) => {
    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const result = await scanBiometricAnomalies(streamId);
      setMessage({ type: "success", text: `Stream ${streamId} Scanned! Verdict: ${result.scanResult}` });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "Stream scan failed." });
    } finally {
      setActionLoading(false);
    }
  };

  // Pair Device
  const handlePairDevice = async (e) => {
    e.preventDefault();

    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const newStream = await pairRpmDevice({ deviceType });

      setIsModalOpen(false);
      setMessage({ type: "success", text: `RPM Device Stream ${newStream.streamId} paired & encrypted!` });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "Failed to pair RPM device." });
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const totalStreams = streams.length;
    const stableStreams = streams.filter((s) => s.signalStatus === "STABLE_STREAMING").length;
    const anomalySpikes = streams.filter((s) => s.signalStatus.includes("ANOMALY")).length;

    return { totalStreams, stableStreams, anomalySpikes };
  }, [streams]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* 1. Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-slate-100">
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center gap-1.5 font-mono">
                <HeartPulse size={12} /> WEARABLE RPM TELEMETRY
              </span>
              <span className="px-3 py-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1 font-mono">
                <Wifi size={12} /> mTLS TLS 1.3 ENCRYPTED
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Remote Patient Monitoring (RPM) Telemetry Console
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Real-time encrypted stream ingestion for continuous ECG, glucose (CGM), and pulse oximetry wearables with patient pseudonymization and signal anomaly scanning.
            </p>
          </div>

          {/* Telemetry Widget */}
          <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl w-full lg:w-auto text-xs space-y-2">
            <div className="flex items-center justify-between gap-6 font-mono">
              <span className="text-slate-400 font-sans font-bold uppercase text-[10px]">Vital Stream Pulse</span>
              <span className="text-rose-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                LIVE VITAL PIPELINE
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-700/80 font-mono text-[11px]">
              <div>Active Streams: <strong className="text-white">{metrics.totalStreams} Wearables</strong></div>
              <div>Stable Signals: <strong className="text-emerald-400">{metrics.stableStreams} Healthy</strong></div>
              <div>Anomaly Spikes: <strong className="text-amber-400">{metrics.anomalySpikes} Flagged</strong></div>
              <div>Encryption: <strong className="text-rose-300">AES-256-GCM</strong></div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        {message.text && (
          <div
            className={`mt-6 p-4 rounded-xl text-sm font-medium flex items-center justify-between border ${
              message.type === "error"
                ? "bg-red-500/10 border-red-500/30 text-red-400"
                : "bg-rose-500/10 border-rose-500/30 text-rose-400"
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
            onClick={() => setActiveTab("STREAMS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "STREAMS"
                ? "bg-rose-600 text-white font-black shadow-lg shadow-rose-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <HeartPulse size={15} /> Wearable Patient Streams ({streams.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("STANDARDS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "STANDARDS"
                ? "bg-rose-600 text-white font-black shadow-lg shadow-rose-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <ShieldCheck size={15} /> FDA Security Standards ({standards.length})
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-rose-600/20"
        >
          <PlusCircle size={15} /> Pair Wearable RPM Device
        </button>
      </div>

      {/* 3. STREAMS TAB */}
      {activeTab === "STREAMS" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">Active Wearable Sensor Streams & Vital Telemetry</h3>
              <p className="text-xs text-slate-400 font-mono">Patient pseudonymized metrics, sampling frequency, and encryption audit status</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3">Stream ID</th>
                  <th className="p-3">Patient Alias & Device Type</th>
                  <th className="p-3">Live Vital Metric</th>
                  <th className="p-3">Protocol & Sampling</th>
                  <th className="p-3">Signal Status</th>
                  <th className="p-3 text-right">Security Scan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {streams.map((s, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/60">
                    <td className="p-3 font-bold text-rose-400">{s.streamId}</td>
                    <td className="p-3 font-sans">
                      <div className="font-semibold text-white">{s.patientAlias}</div>
                      <div className="text-[10px] text-rose-300 font-mono">{s.deviceType}</div>
                    </td>
                    <td className="p-3 text-emerald-400 font-mono text-[11px] font-bold">{s.vitalMetric}</td>
                    <td className="p-3 text-slate-400 font-mono text-[10px]">
                      <div>{s.telemetryProtocol}</div>
                      <div className="text-[10px] text-slate-500">{s.samplingRateHz}</div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          s.signalStatus === "STABLE_STREAMING"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        {s.signalStatus}
                      </span>
                    </td>
                    <td className="p-3 text-right font-sans">
                      <button
                        type="button"
                        onClick={() => handleScanStream(s.streamId)}
                        disabled={actionLoading}
                        className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold rounded text-[10px] transition border border-rose-500/30 flex items-center gap-1 ml-auto"
                      >
                        <ShieldCheck size={12} /> Scan Signal
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
              <h3 className="text-base font-bold text-white">FDA & ISO Security Specifications for Remote Telemetry</h3>
              <p className="text-xs text-slate-400 font-mono">Official regulatory frameworks for medical sensor network security</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {standards.map((s, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded font-bold">
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

      {/* 5. PAIR MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full text-slate-100 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <HeartPulse size={18} className="text-rose-400" /> Pair Wearable RPM Sensor
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePairDevice} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Wearable Device Type:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-sans"
                  value={deviceType}
                  onChange={(e) => setDeviceType(e.target.value)}
                >
                  <option value="Continuous Cardiac Monitor (ECG 12-Lead)">Continuous Cardiac Monitor (ECG 12-Lead)</option>
                  <option value="Continuous Glucose Monitor (CGM Dexcom G7)">Continuous Glucose Monitor (CGM Dexcom G7)</option>
                  <option value="Pulse Oximeter & Respiration Rate">Pulse Oximeter & Respiration Rate</option>
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
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition shadow-lg shadow-rose-600/20"
                >
                  Pair & Encrypt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
