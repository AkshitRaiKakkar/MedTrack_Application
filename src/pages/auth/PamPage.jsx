import PamPanel from "../../components/auth/PamPanel";
import { ArrowLeft, Zap, Key, ShieldAlert, Terminal, Cpu } from "lucide-react";
import "./auth.css";

export default function PamPage({ onNavigate }) {
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
            <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center font-bold text-white shadow-md">
              P
            </div>
            <span className="font-bold text-lg text-white">MedTrack Privileged Access Management (PAM)</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Zap size={14} /> JIT Elevation & Keystroke Audit Active
          </span>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto space-y-8">
        {/* Banner Hero */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-800 via-amber-955 to-slate-900 p-8 border border-slate-700/50 shadow-2xl">
          <div className="relative z-10 max-w-3xl space-y-4">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20">
              Just-In-Time (JIT) Credential Elevation
            </span>

            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Privileged Access Management (PAM) Subsystem
            </h1>

            <p className="text-slate-300 text-sm md:text-base leading-relaxed">
              Enforce ephemeral JIT credential elevation, break-glass workflow approvals, step-up MFA verification, and real-time keystroke command execution logging.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/40">
                <Zap size={20} className="text-amber-400" />
                <div>
                  <div className="text-xs text-slate-400">JIT Elevation</div>
                  <div className="text-xs font-semibold text-white">Ephemeral Credentials</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/40">
                <Key size={20} className="text-emerald-400" />
                <div>
                  <div className="text-xs text-slate-400">Break-Glass Flow</div>
                  <div className="text-xs font-semibold text-white">Auto & Manual Approvals</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/40">
                <Terminal size={20} className="text-blue-400" />
                <div>
                  <div className="text-xs text-slate-400">Command Logging</div>
                  <div className="text-xs font-semibold text-white">Full Session Keystrokes</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Panel Component */}
        <section>
          <PamPanel />
        </section>
      </main>
    </div>
  );
}
