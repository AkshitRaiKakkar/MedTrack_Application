import { useState, useEffect, useCallback } from "react";
import {
  Key,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Sliders,
  Lock,
  Globe,
  Cpu,
  UserCheck,
  Search
} from "lucide-react";
import {
  getActiveConfig,
  updateConfig,
  processSamlAssertion,
  getAllSessionLogs
} from "../../services/SamlIdentityProviderService";
import "../../pages/auth/auth.css";

export default function SamlIdentityProviderPanel() {
  const [config, setConfig] = useState(null);
  const [sessionLogs, setSessionLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Config Form State
  const [entityId, setEntityId] = useState("https://idp.okta.com/app/medtrack-sso");
  const [providerName, setProviderName] = useState("OKTA");
  const [ssoUrl, setSsoUrl] = useState("https://idp.okta.com/app/medtrack-sso/sso/saml");
  const [certificateFingerprint, setCertificateFingerprint] = useState(
    "SHA256:7B:3E:9A:1F:C4:8D:2E:5A:6F:0D:3C:9B:8A:1E:4F:7D:2C:5B:8E:0A:3F:6D:9C:1B"
  );
  const [bindingType, setBindingType] = useState("HTTP_POST");
  const [signAuthnRequest, setSignAuthnRequest] = useState(true);
  const [forceAuthn, setForceAuthn] = useState(false);

  // Assertion Form State
  const [nameId, setNameId] = useState("");
  const [samlResponsePayloadXml, setSamlResponsePayloadXml] = useState(
    '<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol">\n  <saml:Assertion xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">\n    <saml:Issuer>https://idp.okta.com/app/medtrack-sso</saml:Issuer>\n  </saml:Assertion>\n</samlp:Response>'
  );

  const loadSamlData = useCallback(async () => {
    setLoading(true);
    try {
      const [conf, logs] = await Promise.all([
        getActiveConfig().catch(() => null),
        getAllSessionLogs().catch(() => [])
      ]);

      if (conf) {
        setConfig(conf);
        setEntityId(conf.entityId || "https://idp.okta.com/app/medtrack-sso");
        setProviderName(conf.providerName || "OKTA");
        setSsoUrl(conf.ssoUrl || "https://idp.okta.com/app/medtrack-sso/sso/saml");
        setCertificateFingerprint(conf.certificateFingerprint || "");
        setBindingType(conf.bindingType || "HTTP_POST");
        setSignAuthnRequest(conf.signAuthnRequest);
        setForceAuthn(conf.forceAuthn);
      }

      setSessionLogs(logs);
    } catch (err) {
      console.error("Failed to load SAML 2.0 data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSamlData();
  }, [loadSamlData]);

  const handleUpdateConfig = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const updated = await updateConfig({
        entityId,
        providerName,
        ssoUrl,
        certificateFingerprint,
        bindingType,
        signAuthnRequest,
        forceAuthn
      });

      setConfig(updated);
      setMessage({ type: "success", text: "SAML 2.0 IdP Federation configuration updated!" });
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to update SAML configuration." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleProcessAssertion = async (e) => {
    e.preventDefault();
    if (!nameId.trim()) return;

    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const processed = await processSamlAssertion({
        nameId: nameId.trim(),
        idpEntityId: entityId,
        samlResponsePayloadXml
      });

      setNameId("");
      setMessage({
        type: "success",
        text: `SAML 2.0 Assertion ${processed.assertionId} validated! Status: ${processed.assertionStatus}`
      });
      await loadSamlData();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to process SAML assertion." });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="authority-panel-wrapper">
      {/* Header Card */}
      <header className="authority-header-card">
        <div className="authority-header-main">
          <div className="authority-icon-badge bg-orange-500/20 text-orange-400">
            <Key size={28} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="authority-title">SAML 2.0 Identity Federation & SSO Assertion Engine</h2>
              <span className="authority-ver-badge bg-orange-500/20 text-orange-300">
                FEDERATION: ACTIVE ({sessionLogs.length} VALIDATED SESSIONS)
              </span>
            </div>
            <p className="authority-subtitle">
              Enterprise SAML 2.0 single sign-on assertion validation, Okta/AzureAD IdP federation, and x509 fingerprint verification
            </p>
          </div>
        </div>

        <div className="authority-header-actions">
          <button
            type="button"
            className="authority-btn authority-btn-secondary"
            onClick={loadSamlData}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Sync Federation
          </button>
        </div>
      </header>

      {/* Message Alert */}
      {message.text && (
        <div className={`authority-alert ${message.type === "error" ? "authority-alert-error" : "authority-alert-success"}`}>
          {message.type === "error" ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
          <span>{message.text}</span>
          <button type="button" className="ml-auto text-xs opacity-70 hover:opacity-100" onClick={() => setMessage({ type: "", text: "" })}>
            Dismiss
          </button>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Process Assertion & Config */}
        <div className="space-y-6 lg:col-span-1">
          {/* Process SAML Assertion Card */}
          <div className="authority-card">
            <div className="card-header justify-between">
              <div className="flex items-center gap-2">
                <FileCode size={18} className="text-orange-400" />
                <h3>Validate SAML 2.0 Assertion</h3>
              </div>
            </div>

            <form onSubmit={handleProcessAssertion} className="card-body space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Subject NameID (User Email):</label>
                <input
                  type="email"
                  placeholder="e.g. physician@medtrack-health.org"
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                  value={nameId}
                  onChange={(e) => setNameId(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">SAML Response XML Payload:</label>
                <textarea
                  rows={4}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono text-[10px]"
                  value={samlResponsePayloadXml}
                  onChange={(e) => setSamlResponsePayloadXml(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="authority-btn authority-btn-primary bg-orange-600 hover:bg-orange-500 text-white w-full text-xs mt-2"
                disabled={actionLoading}
              >
                Validate SAML XML Signature
              </button>
            </form>
          </div>

          {/* SAML IdP Settings Card */}
          <div className="authority-card">
            <div className="card-header justify-between">
              <div className="flex items-center gap-2">
                <Sliders size={18} className="text-orange-400" />
                <h3>Identity Provider Federation</h3>
              </div>
            </div>

            <form onSubmit={handleUpdateConfig} className="card-body space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Provider Name:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                  value={providerName}
                  onChange={(e) => setProviderName(e.target.value)}
                >
                  <option value="OKTA">OKTA SSO</option>
                  <option value="AZURE_AD">MICROSOFT ENTRA / AZURE AD</option>
                  <option value="PING_IDENTITY">PING IDENTITY</option>
                  <option value="ONELOGIN">ONELOGIN</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">IdP Entity ID:</label>
                <input
                  type="text"
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                  value={entityId}
                  onChange={(e) => setEntityId(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">IdP SSO Endpoint URL:</label>
                <input
                  type="text"
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                  value={ssoUrl}
                  onChange={(e) => setSsoUrl(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">x509 Cert SHA-256 Fingerprint:</label>
                <input
                  type="text"
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono text-[10px]"
                  value={certificateFingerprint}
                  onChange={(e) => setCertificateFingerprint(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2 pt-1">
                <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 cursor-pointer">
                  <span className="text-slate-300 font-semibold">Sign AuthnRequest</span>
                  <input
                    type="checkbox"
                    className="rounded text-orange-500 focus:ring-orange-500 h-4 w-4"
                    checked={signAuthnRequest}
                    onChange={(e) => setSignAuthnRequest(e.target.checked)}
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 cursor-pointer">
                  <span className="text-slate-300 font-semibold">Force Re-Authentication</span>
                  <input
                    type="checkbox"
                    className="rounded text-orange-500 focus:ring-orange-500 h-4 w-4"
                    checked={forceAuthn}
                    onChange={(e) => setForceAuthn(e.target.checked)}
                  />
                </label>
              </div>

              <button
                type="submit"
                className="authority-btn authority-btn-secondary w-full text-xs mt-2"
                disabled={actionLoading}
              >
                Save IdP Federation
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: SAML SSO Assertion Sessions */}
        <div className="authority-card lg:col-span-2 space-y-4">
          <div className="card-header justify-between">
            <div className="flex items-center gap-2">
              <UserCheck size={18} className="text-emerald-400" />
              <h3>Validated SAML 2.0 Sessions ({sessionLogs.length})</h3>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-700/50 bg-slate-800/30">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3">Assertion ID</th>
                  <th className="p-3">Subject NameID</th>
                  <th className="p-3">Auth Context</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Authenticated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {sessionLogs.map((s, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/50">
                    <td className="p-3 font-bold text-orange-300">{s.assertionId}</td>
                    <td className="p-3 font-sans font-semibold text-white">{s.nameId}</td>
                    <td className="p-3 text-[10px] text-slate-400 truncate max-w-[140px]" title={s.authContextClass}>
                      {s.authContextClass}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                        {s.assertionStatus}
                      </span>
                    </td>
                    <td className="p-3 text-right text-slate-400 text-[10px]">
                      {new Date(s.authenticatedAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
                {sessionLogs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-500 font-sans">
                      No SAML 2.0 SSO sessions validated yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
