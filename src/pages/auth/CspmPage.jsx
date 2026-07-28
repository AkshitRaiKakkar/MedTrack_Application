import CspmPanel from "../../components/auth/CspmPanel";
import { ArrowLeft, Cloud, ShieldCheck, Server, Terminal, Cpu } from "lucide-react";
import "./auth.css";

export default function CspmPage({ onNavigate }) {
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
            <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center font-bold text-white shadow-md">
              C
            </div>
            <span className="font-bold text-lg text-white">MedTrack Cloud Security Posture Management (CSPM)</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Cloud size={14} /> Multi-Cloud AWS/Azure/GCP CIS Scanning Active
          </span>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto space-y-8">
        {/* Banner Hero */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-800 via-sky-955 to-slate-900 p-8 border border-slate-700/50 shadow-2xl">
          <div className="relative z-10 max-w-3xl space-y-4">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-sky-400 bg-sky-500/10 border border-sky-500/20">
              Multi-Cloud Misconfiguration & CIS Benchmark Subsystem
            </span>

            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Cloud Security Posture Management (CSPM) & Compliance
            </h1>

            <p className="text-slate-300 text-sm md:text-base leading-relaxed">
              Continuous multi-cloud security posture scanning for AWS, Azure, and GCP, public storage bucket exposure detection, and zero-touch CLI auto-remediation.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/40">
                <Cloud size={20} className="text-sky-400" />
                <div>
                  <div className="text-xs text-slate-400">Multi-Cloud</div>
                  <div className="text-xs font-semibold text-white">AWS, Azure & GCP</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/40">
                <ShieldCheck size={20} className="text-emerald-400" />
                <div>
                  <div className="text-xs text-slate-400">CIS Benchmarks</div>
                  <div className="text-xs font-semibold text-white">AWS & K8s Security</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/40">
                <Terminal size={20} className="text-blue-400" />
                <div>
                  <div className="text-xs text-slate-400">Auto-Remediation</div>
                  <div className="text-xs font-semibold text-white">1-Click CLI Fixes</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Panel Component */}
        <section>
          <CspmPanel />
        </section>
      </main>
    </div>
  );
}
