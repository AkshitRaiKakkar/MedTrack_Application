import ComplianceReportingPanel from "../../components/auth/ComplianceReportingPanel";
import { ArrowLeft, FileCheck, ShieldCheck, Download, Layers, CheckCircle } from "lucide-react";
import "./auth.css";

export default function ComplianceReportingPage({ onNavigate }) {
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
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-md">
              R
            </div>
            <span className="font-bold text-lg text-white">MedTrack Compliance Reporting & Audit Engine</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <FileCheck size={14} /> SOC2 / HIPAA / ISO Certified Exporter Active
          </span>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto space-y-8">
        {/* Banner Hero */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-800 via-blue-955 to-slate-900 p-8 border border-slate-700/50 shadow-2xl">
          <div className="relative z-10 max-w-3xl space-y-4">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/20">
              Executive Audit & SHA-256 Checksum Attestation
            </span>

            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Executive Security Compliance Reporting Subsystem
            </h1>

            <p className="text-slate-300 text-sm md:text-base leading-relaxed">
              Automated executive compliance report generation with cryptographic SHA-256 evidence verification hashes for SOC2 Type II, HIPAA, and ISO 27001 regulatory audits.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/40">
                <FileCheck size={20} className="text-blue-400" />
                <div>
                  <div className="text-xs text-slate-400">Framework Auditing</div>
                  <div className="text-xs font-semibold text-white">SOC2, HIPAA & ISO 27001</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/40">
                <ShieldCheck size={20} className="text-emerald-400" />
                <div>
                  <div className="text-xs text-slate-400">SHA-256 Checksum</div>
                  <div className="text-xs font-semibold text-white">Cryptographic Proof</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/40">
                <Download size={20} className="text-purple-400" />
                <div>
                  <div className="text-xs text-slate-400">Export Formats</div>
                  <div className="text-xs font-semibold text-white">PDF, CSV & JSON</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Panel Component */}
        <section>
          <ComplianceReportingPanel />
        </section>
      </main>
    </div>
  );
}
