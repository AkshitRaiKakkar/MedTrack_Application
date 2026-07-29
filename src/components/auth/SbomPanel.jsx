import { useState, useEffect, useCallback } from "react";
import {
  Package,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Sliders,
  Terminal,
  Cpu,
  Lock,
  Search,
  PlusCircle,
  FileText
} from "lucide-react";
import {
  getAllArtifacts,
  registerArtifact,
  getAllComponents,
  ingestComponent,
  generateAttestation
} from "../../services/SbomService";
import "../../pages/auth/auth.css";

export default function SbomPanel() {
  const [artifacts, setArtifacts] = useState([]);
  const [components, setComponents] = useState([]);
  const [attestation, setAttestation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Register Artifact Form State
  const [artifactId, setArtifactId] = useState("");
  const [artifactType, setArtifactType] = useState("DOCKER_IMAGE");
  const [sha256Digest, setSha256Digest] = useState("");

  // Ingest Component Form State
  const [targetArtifactId, setTargetArtifactId] = useState("medtrack-backend-api:v2.4.0");
  const [packageName, setPackageName] = useState("");
  const [packageVersion, setPackageVersion] = useState("");
  const [ecosystem, setEcosystem] = useState("MAVEN");
  const [licenseType, setLicenseType] = useState("APACHE_2_0");
  const [directDependency, setDirectDependency] = useState(true);

  const loadSbomData = useCallback(async () => {
    setLoading(true);
    try {
      const [artList, compList] = await Promise.all([
        getAllArtifacts().catch(() => []),
        getAllComponents().catch(() => [])
      ]);

      setArtifacts(artList);
      setComponents(compList);
      if (artList.length > 0) {
        setTargetArtifactId(artList[0].artifactId);
      }
    } catch (err) {
      console.error("Failed to load SBOM data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSbomData();
  }, [loadSbomData]);

  const handleRegisterArtifact = async (e) => {
    e.preventDefault();
    if (!artifactId.trim() || !sha256Digest.trim()) return;

    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const registered = await registerArtifact({
        artifactId: artifactId.trim(),
        artifactType,
        sha256Digest: sha256Digest.trim()
      });

      setArtifactId("");
      setSha256Digest("");
      setMessage({ type: "success", text: `Build Artifact ${registered.artifactId} registered for SBOM tracking!` });
      await loadSbomData();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to register artifact." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleIngestComponent = async (e) => {
    e.preventDefault();
    if (!packageName.trim() || !packageVersion.trim()) return;

    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const ingested = await ingestComponent({
        artifactId: targetArtifactId,
        packageName: packageName.trim(),
        packageVersion: packageVersion.trim(),
        ecosystem,
        licenseType,
        directDependency
      });

      setPackageName("");
      setPackageVersion("");
      setMessage({ type: "success", text: `SBOM Component ${ingested.componentId} (${ingested.packageName}) ingested!` });
      await loadSbomData();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to ingest component." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateAttestation = async (artId) => {
    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const att = await generateAttestation(artId);
      setAttestation(att);
      setMessage({ type: "success", text: `SHA-256 Attestation Bundle generated for ${att.artifactId}!` });
    } catch (err) {
      setMessage({ type: "error", text: "Attestation generation failed." });
    } finally {
      setActionLoading(false);
    }
  };

  const prohibitedCount = components.filter((c) => c.riskLevel === "PROHIBITED_LICENSE").length;

  return (
    <div className="authority-panel-wrapper">
      {/* Header Card */}
      <header className="authority-header-card">
        <div className="authority-header-main">
          <div className="authority-icon-badge bg-emerald-500/20 text-emerald-400">
            <Package size={28} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="authority-title">Software Bill of Materials (SBOM) & Supply Chain Security</h2>
              <span className="authority-ver-badge bg-emerald-500/20 text-emerald-300">
                CYCLONEDX 1.5: ACTIVE ({prohibitedCount} PROHIBITED LICENSES)
              </span>
            </div>
            <p className="authority-subtitle">
              Open-source dependency cataloging, CycloneDX/SPDX spec validation, license compliance enforcement, and SHA-256 build attestations
            </p>
          </div>
        </div>

        <div className="authority-header-actions">
          <button
            type="button"
            className="authority-btn authority-btn-secondary"
            onClick={loadSbomData}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh SBOM Catalog
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

      {/* Attestation Modal Display if present */}
      {attestation && (
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-xs font-mono space-y-2">
          <div className="flex items-center justify-between font-sans">
            <h4 className="font-bold text-emerald-400 flex items-center gap-2 text-sm">
              <FileCheck size={18} /> SHA-256 Supply Chain Attestation Certificate
            </h4>
            <button type="button" className="text-slate-400 hover:text-white" onClick={() => setAttestation(null)}>
              Close
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] pt-1">
            <div><span className="text-slate-400">Artifact:</span> <span className="text-white font-bold">{attestation.artifactId}</span></div>
            <div><span className="text-slate-400">Verdict:</span> <span className="text-emerald-400 font-bold">{attestation.complianceVerdict}</span></div>
            <div><span className="text-slate-400">Total Components:</span> <span className="text-white font-bold">{attestation.totalComponents}</span></div>
            <div><span className="text-slate-400">Prohibited Licenses:</span> <span className="text-red-400 font-bold">{attestation.prohibitedLicenseCount}</span></div>
          </div>
          <div className="pt-2 text-[10px] text-slate-300 truncate">
            <span className="text-emerald-400 font-bold">SHA-256 Bundle Checksum:</span> {attestation.attestationSha256Checksum}
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Register Artifact & Ingest Component */}
        <div className="space-y-6 lg:col-span-1">
          {/* Register Artifact Form */}
          <div className="authority-card">
            <div className="card-header justify-between">
              <div className="flex items-center gap-2">
                <PlusCircle size={18} className="text-emerald-400" />
                <h3>Register Build Artifact</h3>
              </div>
            </div>

            <form onSubmit={handleRegisterArtifact} className="card-body space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Artifact ID / Container Tag:</label>
                <input
                  type="text"
                  placeholder="e.g. medtrack-backend-api:v2.4.0"
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-[11px]"
                  value={artifactId}
                  onChange={(e) => setArtifactId(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Artifact Type:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  value={artifactType}
                  onChange={(e) => setArtifactType(e.target.value)}
                >
                  <option value="DOCKER_IMAGE">DOCKER CONTAINER IMAGE</option>
                  <option value="MAVEN_JAR">MAVEN JAR BUNDLE</option>
                  <option value="NPM_PACKAGE">NPM WEB BUNDLE</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">SHA-256 Digest Checksum:</label>
                <input
                  type="text"
                  placeholder="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-[10px]"
                  value={sha256Digest}
                  onChange={(e) => setSha256Digest(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="authority-btn authority-btn-primary bg-emerald-600 hover:bg-emerald-500 text-white w-full text-xs mt-2"
                disabled={actionLoading}
              >
                Register Build Artifact
              </button>
            </form>
          </div>

          {/* Ingest Component Form */}
          <div className="authority-card">
            <div className="card-header justify-between">
              <div className="flex items-center gap-2">
                <Package size={18} className="text-emerald-400" />
                <h3>Ingest CycloneDX Component</h3>
              </div>
            </div>

            <form onSubmit={handleIngestComponent} className="card-body space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Target Artifact:</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-[11px]"
                  value={targetArtifactId}
                  onChange={(e) => setTargetArtifactId(e.target.value)}
                >
                  {artifacts.map((a, i) => (
                    <option key={i} value={a.artifactId}>{a.artifactId}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Package Name:</label>
                  <input
                    type="text"
                    placeholder="e.g. spring-security"
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-[11px]"
                    value={packageName}
                    onChange={(e) => setPackageName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Version:</label>
                  <input
                    type="text"
                    placeholder="e.g. 6.2.1"
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-[11px]"
                    value={packageVersion}
                    onChange={(e) => setPackageVersion(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Ecosystem:</label>
                  <select
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    value={ecosystem}
                    onChange={(e) => setEcosystem(e.target.value)}
                  >
                    <option value="MAVEN">MAVEN</option>
                    <option value="NPM">NPM</option>
                    <option value="PYPI">PYPI</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">License:</label>
                  <select
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    value={licenseType}
                    onChange={(e) => setLicenseType(e.target.value)}
                  >
                    <option value="APACHE_2_0">APACHE 2.0</option>
                    <option value="MIT">MIT</option>
                    <option value="GPL_3_0">GPL 3.0 (PROHIBITED)</option>
                  </select>
                </div>
              </div>

              <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 cursor-pointer pt-2">
                <span className="text-slate-300 font-semibold">Direct Dependency</span>
                <input
                  type="checkbox"
                  className="rounded text-emerald-500 focus:ring-emerald-500 h-4 w-4"
                  checked={directDependency}
                  onChange={(e) => setDirectDependency(e.target.checked)}
                />
              </label>

              <button
                type="submit"
                className="authority-btn authority-btn-secondary w-full text-xs mt-2"
                disabled={actionLoading}
              >
                Ingest Component
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Tracked Artifacts & Open-Source Components */}
        <div className="authority-card lg:col-span-2 space-y-6">
          {/* Registered Artifacts Table */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Package size={18} className="text-emerald-400" /> Tracked Build Artifacts ({artifacts.length})
            </h3>

            <div className="overflow-x-auto rounded-2xl border border-slate-700/50 bg-slate-800/30">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/80 text-slate-400 uppercase font-mono text-[10px]">
                  <tr>
                    <th className="p-3">Artifact ID</th>
                    <th className="p-3">Type & Digest</th>
                    <th className="p-3">Compliance Status</th>
                    <th className="p-3 text-right">Attestation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {artifacts.map((a, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/50">
                      <td className="p-3 font-bold text-emerald-300">{a.artifactId}</td>
                      <td className="p-3 font-sans">
                        <div className="font-semibold text-white">{a.artifactType}</div>
                        <div className="text-[9px] text-slate-400 font-mono truncate max-w-[140px]">{a.sha256Digest}</div>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] ${
                            a.complianceStatus === "COMPLIANT"
                              ? "bg-emerald-950 text-emerald-400 border border-emerald-500/30"
                              : "bg-red-950 text-red-400 border border-red-500/30"
                          }`}
                        >
                          {a.complianceStatus}
                        </span>
                      </td>
                      <td className="p-3 text-right font-sans">
                        <button
                          type="button"
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold shadow transition"
                          onClick={() => handleGenerateAttestation(a.artifactId)}
                        >
                          Attest SHA-256
                        </button>
                      </td>
                    </tr>
                  ))}
                  {artifacts.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-slate-500 font-sans">
                        No build artifacts registered.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Dependency Components Table */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText size={18} className="text-blue-400" /> Open-Source Component Dependency Catalog ({components.length})
            </h3>

            <div className="overflow-x-auto rounded-2xl border border-slate-700/50 bg-slate-800/30">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/80 text-slate-400 uppercase font-mono text-[10px]">
                  <tr>
                    <th className="p-3">Component ID</th>
                    <th className="p-3">Package & Version</th>
                    <th className="p-3">Ecosystem & License</th>
                    <th className="p-3 text-right">Risk Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {components.map((c, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/50">
                      <td className="p-3 font-bold text-blue-300">{c.componentId}</td>
                      <td className="p-3 font-sans">
                        <div className="font-semibold text-white truncate max-w-[180px]" title={c.packageName}>
                          {c.packageName}
                        </div>
                        <div className="text-[10px] text-emerald-400 font-mono">v{c.packageVersion}</div>
                      </td>
                      <td className="p-3">
                        <div className="text-slate-200">{c.ecosystem}</div>
                        <div className="text-[10px] text-slate-400 font-bold">{c.licenseType}</div>
                      </td>
                      <td className="p-3 text-right font-sans">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            c.riskLevel === "PROHIBITED_LICENSE"
                              ? "bg-red-950 text-red-400 border border-red-500/30"
                              : "bg-emerald-950 text-emerald-400 border border-emerald-500/30"
                          }`}
                        >
                          {c.riskLevel}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {components.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-slate-500 font-sans">
                        No dependency components cataloged.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
