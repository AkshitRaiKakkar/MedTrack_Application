import { useState, useEffect } from "react";

export default function CookieBanner({ onNavigate }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const storedConsent = localStorage.getItem("medtrack_cookie_consent");
      if (!storedConsent) {
        setVisible(true);
      }
    } catch (e) {
      console.error("Error reading cookie consent from storage:", e);
    }
  }, []);

  const handleAcceptAll = () => {
    try {
      const consentData = {
        essential: true,
        functional: true,
        analytics: true,
        performance: true,
        telemetry: true,
        targeting: true,
        status: "accepted_all",
        timestamp: new Date().toISOString()
      };
      localStorage.setItem("medtrack_cookie_consent", JSON.stringify(consentData));
    } catch (e) {
      console.error("Error saving cookie consent:", e);
    }
    setVisible(false);
  };

  const handleDeclineOptional = () => {
    try {
      const consentData = {
        essential: true,
        functional: false,
        analytics: false,
        performance: false,
        telemetry: false,
        targeting: false,
        status: "essential_only",
        timestamp: new Date().toISOString()
      };
      localStorage.setItem("medtrack_cookie_consent", JSON.stringify(consentData));
    } catch (e) {
      console.error("Error saving cookie consent:", e);
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4 md:p-6 bg-slate-900/95 backdrop-blur-md text-white border-t border-slate-800 shadow-2xl animate-in slide-in-from-bottom duration-300">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5 max-w-3xl">
          <span className="text-2xl mt-0.5">🍪</span>
          <div>
            <h4 className="text-sm font-bold text-white mb-1">
              We value your privacy
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              MedTrack uses essential cookies for authentication and security, and optional cookies to analyze clinical dashboard usage and save visual preferences. Your consent selection will be remembered across sessions.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0 w-full md:w-auto justify-end">
          <button
            onClick={() => onNavigate && onNavigate("cookies")}
            className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white transition-colors bg-transparent border border-slate-700 hover:border-slate-600 rounded-xl"
          >
            Preferences
          </button>
          <button
            onClick={handleDeclineOptional}
            className="px-4 py-2 text-xs font-bold text-slate-200 hover:text-white transition-colors bg-slate-800 hover:bg-slate-700 rounded-xl"
          >
            Decline Optional
          </button>
          <button
            onClick={handleAcceptAll}
            className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors rounded-xl shadow-lg shadow-indigo-600/20"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
}
