import ThreatIntelligencePanel from "../../components/auth/ThreatIntelligencePanel";
import { ArrowLeft, Globe, ShieldAlert, Radio, Flame, Cpu } from "lucide-react";
import "./auth.css";

export default function ThreatIntelligencePage({ onNavigate }) {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-4 md:p-8">
      {/* Top Navbar */}
      <nav className="max-w-7xl mx-auto flex items-center justify-between pb-6 mb-8 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-300 hover:text-white rounded-lg bg-slate-800 hover:bg-slate-700 transition"
            onClick={() => onNavigate && onNavigate("dashboard")}
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center font-bold text-white shadow-md">
              T
            </div>
            <span className="font-bold text-lg text-white">MedTrack STIX/TAXII Threat Intelligence Subsystem</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
            <Globe size={14} /> Global IOC Ingestion & Firewall Auto-Block Active
          </span>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto space-y-8">
        {/* Banner Hero */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-800 via-red-955 to-slate-900 p-8 border border-slate-700/50 shadow-2xl">
          <div className="relative z-10 max-w-3xl space-y-4">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-red-400 bg-red-500/10 border border-red-500/20">
              Real-time IOC Matrix & Automated WAF Mitigation
            </span>

            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              STIX/TAXII Threat Intelligence & Firewall Auto-Mitigation Subsystem
            </h1>

            <p className="text-slate-300 text-sm md:text-base leading-relaxed">
              Automated ingestion of global malware C2, phishing, and ransomware indicators, confidence matrix evaluation, and zero-latency firewall rule enforcement.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/40">
                <Globe size={20} className="text-red-400" />
                <div>
                  <div className="text-xs text-slate-400">STIX/TAXII Feeds</div>
                  <div className="text-xs font-semibold text-white">AlienVault OTX & MISP</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/40">
                <Radio size={20} className="text-amber-400" />
                <div>
                  <div className="text-xs text-slate-400">IOC Confidence Matrix</div>
                  <div className="text-xs font-semibold text-white">0-100% Threat Score</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/40">
                <ShieldAlert size={20} className="text-emerald-400" />
                <div>
                  <div className="text-xs text-slate-400">Automated Firewall</div>
                  <div className="text-xs font-semibold text-white">Zero-Latency WAF Block</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Panel Component */}
        <section>
          <ThreatIntelligencePanel />
        </section>
      </main>
    </div>
  );
}
