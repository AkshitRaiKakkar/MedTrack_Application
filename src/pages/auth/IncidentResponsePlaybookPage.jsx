import React from "react";
import IncidentResponsePlaybookPanel from "../../components/auth/IncidentResponsePlaybookPanel";
import { ArrowLeft, ShieldAlert, Zap } from "lucide-react";
import "./auth.css";

/**
 * IncidentResponsePlaybookPage Component
 * 
 * Standalone Cyber Incident Response (IR) Operations Page for MedTrack.
 */
export default function IncidentResponsePlaybookPage({ onNavigate }) {
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
            <span className="flex items-center gap-1 text-red-400 font-mono">
              <Zap size={14} /> IR PLAYBOOKS READY
            </span>
            <span>•</span>
            <span className="font-mono">SOAR ORCHESTRATION</span>
          </div>
        </div>

        {/* Security Alert Header Strip */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">Cyber Incident Response & Forensics Engine</h1>
              <p className="text-xs text-slate-400 font-mono">Automated threat containment, host isolation, credential revocation, and memory forensics</p>
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
        <IncidentResponsePlaybookPanel />

      </div>
    </div>
  );
}
