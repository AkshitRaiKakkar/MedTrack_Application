import React from "react";
import KeyVaultSecurityPanel from "../../components/auth/KeyVaultSecurityPanel";
import { ArrowLeft, Lock, ShieldCheck } from "lucide-react";
import "./auth.css";

/**
 * KeyVaultSecurityPage Component
 * 
 * Cryptographic Secret Vault & HSM Security Management Page for MedTrack.
 */
export default function KeyVaultSecurityPage({ onNavigate }) {
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
            <span className="flex items-center gap-1 text-purple-400 font-mono">
              <Lock size={14} /> HSM HSM-CLUSTER-ONLINE
            </span>
            <span>•</span>
            <span className="font-mono">FIPS 140-3 LEVEL 3</span>
          </div>
        </div>

        {/* Security Alert Header Strip */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
              <Lock size={20} />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">Cryptographic Secret & Key Vault Subsystem</h1>
              <p className="text-xs text-slate-400">Hardware Security Module (HSM) cluster management and cryptographic envelope rotation</p>
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

        {/* Main Key Vault Panel */}
        <KeyVaultSecurityPanel />

      </div>
    </div>
  );
}
