import SecurityCommandCenterPanel from "../../components/auth/SecurityCommandCenterPanel";
import { ArrowLeft, ShieldCheck, Activity, Radio, Lock, Users } from "lucide-react";
import "./auth.css";

export default function SecurityCommandCenterPage({ onNavigate }) {
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
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md">
              C
            </div>
            <span className="font-bold text-lg text-white">MedTrack Unified Security Command Center</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <ShieldCheck size={14} /> Single-Pane-of-Glass Active
          </span>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto space-y-8">
        {/* Banner Hero */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-800 via-indigo-955 to-slate-900 p-8 border border-slate-700/50 shadow-2xl">
          <div className="relative z-10 max-w-3xl space-y-4">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20">
              Centralized Enterprise Security Command Hub
            </span>

            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Security Command Center Unified Dashboard Subsystem
            </h1>

            <p className="text-slate-300 text-sm md:text-base leading-relaxed">
              Unified security operation center (SOC) command hub aggregating real-time metrics across Posture Governance, OpenTelemetry Observability, SOAR Containment Playbooks, SCIM Provisioning, and Evidence Vault.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/40">
                <ShieldCheck size={20} className="text-emerald-400" />
                <div>
                  <div className="text-xs text-slate-400">Composite Posture</div>
                  <div className="text-xs font-semibold text-white">CIS / NIST Scoring</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/40">
                <Radio size={20} className="text-cyan-400" />
                <div>
                  <div className="text-xs text-slate-400">Telemetry Stream</div>
                  <div className="text-xs font-semibold text-white">OpenTelemetry Ingestion</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/40">
                <Lock size={20} className="text-blue-400" />
                <div>
                  <div className="text-xs text-slate-400">Cryptographic WORM</div>
                  <div className="text-xs font-semibold text-white">SHA-256 Ledger</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Panel Component */}
        <section>
          <SecurityCommandCenterPanel />
        </section>
      </main>
    </div>
  );
}
