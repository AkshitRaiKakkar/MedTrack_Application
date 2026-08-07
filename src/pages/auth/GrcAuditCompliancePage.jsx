import React from "react";
import GrcAuditCompliancePanel from "../../components/auth/GrcAuditCompliancePanel";
import { ArrowLeft, Award, ShieldCheck } from "lucide-react";
import "./auth.css";

/**
 * GrcAuditCompliancePage Component
 * 
 * Standalone Governance, Risk & Continuous Audit Operations Page for MedTrack.
 */
export default function GrcAuditCompliancePage({ onNavigate }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => onNavigate ? onNavigate("dashboard") : (window.location.href = "/dashboard")}
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Application Dashboard
          </button>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1 text-amber-400 font-mono">
              <Award size={14} /> CONTINUOUS AUDIT ENGINE
            </span>
            <span>•</span>
            <span className="font-mono">GRC v5.0</span>
          </div>
        </div>

        {/* Security Alert Header Strip */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">Governance, Risk & Continuous Audit Ledger</h1>
              <p className="text-xs text-slate-400">Real-time SOC 2 Type II, HIPAA, ISO 27001, and NIST 800-53 automated control evaluation</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate ? onNavigate("security") : (window.location.href = "/security")}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition"
            >
              Enterprise Security Hub
            </button>
          </div>
        </div>

        {/* Main Panel */}
        <GrcAuditCompliancePanel />

      </div>
    </div>
  );
}
