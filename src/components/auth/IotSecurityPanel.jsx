import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Activity,
  ShieldCheck,
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
  Network,
  Smartphone,
  Globe,
  SlidersHorizontal,
  Radio,
  Wifi,
  Server,
  Zap,
  Slash
} from "lucide-react";
import {
  getIotDevices,
  onboardIotDevice,
  quarantineIotDevice,
  getFda524bRequirements
} from "../../services/IotSecurityService";
import "../../pages/auth/auth.css";

/**
 * IotSecurityPanel Component
 * 
 * IoMT (Internet of Medical Things) & Medical Device Cybersecurity Console.
 * Features:
 * 1. FDA 524B Cyber Devices Regulatory Compliance Matrix
 * 2. Real-Time IoMT Device Asset Discovery & Microsegmentation Telemetry
 * 3. Automated VLAN Device Quarantine & Isolation Engine
 * 4. Firmware CVE Vulnerability Audit & Onboarding Control
 */
export default function IotSecurityPanel() {
  // State
  const [devices, setDevices] = useState([]);
  const [fdaReqs, setFdaReqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("DEVICES"); // "DEVICES" | "FDA_524B"

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deviceName, setDeviceName] = useState("");
  const [deviceType, setDeviceType] = useState("INFUSION_PUMP");
  const [macAddress, setMacAddress] = useState("00:1A:2B:3C:4D:5E");
  const [ipAddress, setIpAddress] = useState("192.168.4.180");
  const [vlanSegment, setVlanSegment] = useState("VLAN-104-CRITICAL-CARE");

  // Load telemetry
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [deviceList, reqList] = await Promise.all([
        getIotDevices().catch(() => []),
        getFda524bRequirements().catch(() => [])
      ]);

      setDevices(deviceList);
      setFdaReqs(reqList);
    } catch (err) {
      console.error("Failed to load IoMT security data:", err);
      setMessage({ type: "error", text: "Failed connecting to IoMT security service." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Quarantine Device
  const handleQuarantine = async (deviceId) => {
    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const result = await quarantineIotDevice(deviceId);
      setMessage({ type: "success", text: `Medical Device ${deviceId} Quarantined to ${result.vlanSegment}!` });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "Quarantine action failed." });
    } finally {
      setActionLoading(false);
    }
  };

  // Onboard Device
  const handleOnboardDevice = async (e) => {
    e.preventDefault();
    if (!deviceName.trim()) return;

    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const newDev = await onboardIotDevice({
        deviceName: deviceName.trim(),
        deviceType,
        macAddress,
        ipAddress,
        vlanSegment
      });

      setDeviceName("");
      setIsModalOpen(false);
      setMessage({ type: "success", text: `IoMT Device ${newDev.deviceId} onboarded & microsegmented!` });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: "Failed to onboard medical device." });
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const totalDevices = devices.length;
    const activeMonitored = devices.filter((d) => d.status === "ACTIVE_MONITORED").length;
    const warningPatch = devices.filter((d) => d.status === "WARNING_PATCH_PENDING").length;
    const quarantined = devices.filter((d) => d.status === "QUARANTINED").length;

    return { totalDevices, activeMonitored, warningPatch, quarantined };
  }, [devices]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* 1. Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-slate-100">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-teal-400 bg-teal-500/10 border border-teal-500/20 rounded-full flex items-center gap-1.5 font-mono">
                <Radio size={12} /> FDA 524B CYBER DEVICES
              </span>
              <span className="px-3 py-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1 font-mono">
                <Wifi size={12} /> IoMT MICROSEGMENTED
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              IoMT Medical Device Cybersecurity Console
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Internet of Medical Things (IoMT) asset discovery, FDA 524B Cyber Devices regulatory compliance, DICOM/HL7 VLAN microsegmentation, and zero-trust device quarantine controls.
            </p>
          </div>

          {/* Telemetry Widget */}
          <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl w-full lg:w-auto text-xs space-y-2">
            <div className="flex items-center justify-between gap-6 font-mono">
              <span className="text-slate-400 font-sans font-bold uppercase text-[10px]">IoMT Telemetry</span>
              <span className="text-teal-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
                PROTECTED
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-700/80 font-mono text-[11px]">
              <div>Total IoMT Assets: <strong className="text-white">{metrics.totalDevices} Online</strong></div>
              <div>Active Monitored: <strong className="text-emerald-400">{metrics.activeMonitored} Healthy</strong></div>
              <div>Firmware CVE Alerts: <strong className="text-amber-400">{metrics.warningPatch} Warning</strong></div>
              <div>Isolated Quarantined: <strong className="text-red-400">{metrics.quarantined} VLAN-999</strong></div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        {message.text && (
          <div
            className={`mt-6 p-4 rounded-xl text-sm font-medium flex items-center justify-between border ${
              message.type === "error"
                ? "bg-red-500/10 border-red-500/30 text-red-400"
                : "bg-teal-500/10 border-teal-500/30 text-teal-400"
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
            onClick={() => setActiveTab("DEVICES")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "DEVICES"
                ? "bg-teal-600 text-white font-black shadow-lg shadow-teal-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Radio size={15} /> IoMT Device Inventory ({devices.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("FDA_524B")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "FDA_524B"
                ? "bg-teal-600 text-white font-black shadow-lg shadow-teal-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <ShieldCheck size={15} /> FDA 524B Compliance ({fdaReqs.length})
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-teal-600/20"
        >
          <PlusCircle size={15} /> Onboard Medical Device
        </button>
      </div>

      {/* 3. DEVICE INVENTORY TAB */}
      {activeTab === "DEVICES" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">Discovered IoMT Assets & Microsegmentation Matrix</h3>
              <p className="text-xs text-slate-400 font-mono">DICOM/HL7 network VLAN segments, firmware CVE risks, and zero-trust quarantine actions</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3">Device ID</th>
                  <th className="p-3">Device Name & Type</th>
                  <th className="p-3">MAC / IP Address</th>
                  <th className="p-3">VLAN Segment</th>
                  <th className="p-3">Firmware / CVE</th>
                  <th className="p-3 text-right">Quarantine Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {devices.map((d, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/60">
                    <td className="p-3 font-bold text-teal-400">{d.deviceId}</td>
                    <td className="p-3 font-sans">
                      <div className="font-semibold text-white">{d.deviceName}</div>
                      <div className="text-[10px] text-teal-300 font-mono">{d.protocol}</div>
                    </td>
                    <td className="p-3 text-slate-400">
                      <div>{d.ipAddress}</div>
                      <div className="text-[10px] text-slate-500">{d.macAddress}</div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/20 text-teal-400 border border-teal-500/30">
                        {d.vlanSegment}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          d.firmwareCveRisk.includes("CLEAN")
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-red-500/20 text-red-400 border border-red-500/30"
                        }`}
                      >
                        {d.firmwareCveRisk}
                      </span>
                    </td>
                    <td className="p-3 text-right font-sans">
                      {d.status === "QUARANTINED" ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                          QUARANTINED
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleQuarantine(d.deviceId)}
                          disabled={actionLoading}
                          className="px-2.5 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold rounded text-[10px] transition border border-red-500/30 flex items-center gap-1 ml-auto"
                        >
                          <Slash size={12} /> Quarantine Device
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. FDA 524B TAB */}
      {activeTab === "FDA_524B" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">FDA Section 524B Cybersecurity Statutory Matrix</h3>
              <p className="text-xs text-slate-400 font-mono">Ensuring cyber device security for FDA pre-market submissions and post-market updates</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {fdaReqs.map((r, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded font-bold">
                    FDA {r.section}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white">{r.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{r.description}</p>
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
                <Radio size={18} className="text-teal-400" /> Onboard Medical Device (IoMT)
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleOnboardDevice} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Device Name / Node:</label>
                <input
                  type="text"
                  placeholder="e.g. Smart Infusion Pump Array #5"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-sans"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Device Type:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                  value={deviceType}
                  onChange={(e) => setDeviceType(e.target.value)}
                >
                  <option value="INFUSION_PUMP">INFUSION PUMP ARRAY</option>
                  <option value="DIAGNOSTIC_IMAGING">DIAGNOSTIC IMAGING (MRI/CT)</option>
                  <option value="PATIENT_MONITOR">BEDSIDE PATIENT MONITOR</option>
                  <option value="VENTILATOR">ICU VENTILATOR NODE</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">MAC Address:</label>
                  <input
                    type="text"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                    value={macAddress}
                    onChange={(e) => setMacAddress(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">IP Address:</label>
                  <input
                    type="text"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                    value={ipAddress}
                    onChange={(e) => setIpAddress(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">VLAN Microsegmentation:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                  value={vlanSegment}
                  onChange={(e) => setVlanSegment(e.target.value)}
                >
                  <option value="VLAN-104-CRITICAL-CARE">VLAN-104 (CRITICAL CARE)</option>
                  <option value="VLAN-200-RADIOLOGY">VLAN-200 (RADIOLOGY)</option>
                  <option value="VLAN-300-TELEMETRY">VLAN-300 (TELEMETRY)</option>
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
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl transition shadow-lg shadow-teal-600/20"
                >
                  Onboard Device
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
