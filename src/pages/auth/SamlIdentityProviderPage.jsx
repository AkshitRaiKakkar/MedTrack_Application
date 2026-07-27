import SamlIdentityProviderPanel from "../../components/auth/SamlIdentityProviderPanel";
import { ArrowLeft, Key, ShieldCheck, FileCode, Globe, Cpu } from "lucide-react";
import "./auth.css";

export default function SamlIdentityProviderPage({ onNavigate }) {
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
            <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center font-bold text-white shadow-md">
              S
            </div>
            <span className="font-bold text-lg text-white">MedTrack SAML 2.0 Identity Federation</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20">
            <Key size={14} /> Okta / AzureAD Identity Provider Federation Active
          </span>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto space-y-8">
        {/* Banner Hero */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-800 via-orange-955 to-slate-900 p-8 border border-slate-700/50 shadow-2xl">
          <div className="relative z-10 max-w-3xl space-y-4">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-orange-400 bg-orange-500/10 border border-orange-500/20">
              Enterprise Single Sign-On Federation
            </span>

            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              SAML 2.0 Identity Provider & SSO Assertion Subsystem
            </h1>

            <p className="text-slate-300 text-sm md:text-base leading-relaxed">
              Enterprise SAML 2.0 single sign-on assertion validation engine supporting Okta, Azure AD (Entra), Ping Identity, and custom enterprise IdP federations.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/40">
                <Key size={20} className="text-orange-400" />
                <div>
                  <div className="text-xs text-slate-400">SAML 2.0 Core</div>
                  <div className="text-xs font-semibold text-white">Okta & Azure AD</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/40">
                <FileCode size={20} className="text-emerald-400" />
                <div>
                  <div className="text-xs text-slate-400">XML Signature</div>
                  <div className="text-xs font-semibold text-white">x509 Fingerprint Check</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/40">
                <Globe size={20} className="text-blue-400" />
                <div>
                  <div className="text-xs text-slate-400">SSO Session Log</div>
                  <div className="text-xs font-semibold text-white">Assertion Audit Trail</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Panel Component */}
        <section>
          <SamlIdentityProviderPanel />
        </section>
      </main>
    </div>
  );
}
