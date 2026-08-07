import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Fingerprint,
  KeyRound,
  ShieldCheck,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Search,
  Download,
  Terminal,
  Clock,
  Sparkles,
  Sliders,
  X,
  Usb,
  Smartphone,
  Laptop,
  Check,
  ShieldAlert,
  Radio
} from "lucide-react";
import {
  getRegisteredPasskeys,
  getPasskeyPolicySettings,
  initiatePasskeyRegistration,
  revokePasskey,
  updatePasskeyPolicy
} from "../../services/PasskeyPasswordlessService";
import "../../pages/auth/auth.css";

/**
 * PasskeyPasswordlessPanel Component
 * 
 * Biometric FIDO2 / WebAuthn Passkey & Passwordless Command Center.
 * Features:
 * 1. Hardware & Biometric Security Key Management Registry
 * 2. WebAuthn Public Key Credential Challenge Registration Wizard
 * 3. Enterprise Passwordless Policy & Attestation Configurator
 * 4. Revocation Engine & Hardware Security Telemetry
 */
export default function PasskeyPasswordlessPanel() {
  // State
  const [passkeys, setPasskeys] = useState([]);
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("PASSKEYS"); // "PASSKEYS" | "POLICY"
  const [searchTerm, setSearchTerm] = useState("");
  const [notification, setNotification] = useState({ type: "", message: "" });

  // Registration Modal State
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState("");
  const [registrationChallenge, setRegistrationChallenge] = useState(null);
  const [registerStep, setRegisterStep] = useState(1); // 1: Input Name -> 2: WebAuthn Challenge -> 3: Done

  // Revoke Modal State
  const [revokePasskeyTarget, setRevokePasskeyTarget] = useState(null);

  // Load Telemetry
  const loadPasskeyData = useCallback(async () => {
    setLoading(true);
    try {
      const [keysData, policyData] = await Promise.all([
        getRegisteredPasskeys(),
        getPasskeyPolicySettings()
      ]);
      setPasskeys(keysData || []);
      setPolicy(policyData || null);
    } catch (err) {
      console.error("Failed loading passkey telemetry:", err);
      setNotification({ type: "error", message: "Failed connecting to FIDO2 WebAuthn service." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPasskeyData();
  }, [loadPasskeyData]);

  // Filtered Passkeys
  const filteredPasskeys = useMemo(() => {
    return passkeys.filter(
      (k) =>
        k.friendlyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        k.authenticatorType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        k.credentialId.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [passkeys, searchTerm]);

  // Handle Start Registration
  const handleStartRegistration = async () => {
    if (!newDeviceName.trim()) return;
    setActionLoading(true);
    try {
      const challenge = await initiatePasskeyRegistration(newDeviceName);
      setRegistrationChallenge(challenge);
      setRegisterStep(2);
    } catch (err) {
      setNotification({ type: "error", message: "Failed initiating WebAuthn challenge." });
    } finally {
      setActionLoading(false);
    }
  };

  // Complete Registration Simulation
  const handleCompleteRegistration = () => {
    const newKey = {
      id: `key_fido_${Date.now().toString().slice(-4)}`,
      credentialId: `fido2_cred_${Math.random().toString(36).substring(7)}`,
      friendlyName: newDeviceName,
      authenticatorType: "HARDWARE_TOKEN",
      aaguid: "ee882879-721c-4b92-b9e6-0560ef284ddb",
      transports: ["usb", "nfc"],
      registeredAt: new Date().toISOString(),
      lastUsedAt: "Just now",
      userVerification: "REQUIRED",
      status: "ACTIVE"
    };

    setPasskeys((prev) => [newKey, ...prev]);
    setRegisterStep(3);
    setNotification({ type: "success", message: `Passkey "${newDeviceName}" registered successfully!` });
  };

  // Revoke Passkey Handler
  const handleConfirmRevoke = async () => {
    if (!revokePasskeyTarget) return;
    setActionLoading(true);
    try {
      await revokePasskey(revokePasskeyTarget.id);
      setPasskeys((prev) => prev.filter((k) => k.id !== revokePasskeyTarget.id));
      setNotification({ type: "success", message: `Passkey "${revokePasskeyTarget.friendlyName}" revoked.` });
      setRevokePasskeyTarget(null);
    } catch (err) {
      setNotification({ type: "error", message: "Failed revoking passkey." });
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle Policy Settings
  const handleTogglePolicySetting = async (field) => {
    if (!policy) return;
    const updated = { ...policy, [field]: !policy[field] };
    setPolicy(updated);
    try {
      await updatePasskeyPolicy(updated);
      setNotification({ type: "success", message: "Passwordless policy updated." });
    } catch (err) {
      setNotification({ type: "error", message: "Failed updating policy." });
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* 1. Diagnostic Header & Telemetry */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-slate-100">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded-full flex items-center gap-1.5 font-mono">
                <Fingerprint size={12} /> FIDO2 WEBAUTHN HARDWARE
              </span>
              <span className="px-3 py-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1">
                <ShieldCheck size={12} /> PASSWORDLESS ACTIVE
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Biometric Passkey & Hardware Key Center
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              FIDO2 / WebAuthn cryptographic passwordless authentication management, biometric hardware attestation, and YubiKey security key orchestration.
            </p>
          </div>

          {/* Telemetry Widget */}
          <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl w-full lg:w-auto text-xs space-y-2">
            <div className="flex items-center justify-between gap-6 font-mono">
              <span className="text-slate-400 font-sans font-bold uppercase text-[10px]">Passkey Engine State</span>
              <span className="text-purple-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                WEBAUTHN v2.1
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-700/80 font-mono text-[11px]">
              <div>Registered Keys: <strong className="text-white">{passkeys.length} Keys</strong></div>
              <div>Attestation: <strong className="text-emerald-400">HARDWARE</strong></div>
              <div>Verification: <strong className="text-sky-300">REQUIRED</strong></div>
              <div>Fallback MFA: <strong className="text-purple-300">ENABLED</strong></div>
            </div>
          </div>
        </div>

        {/* Global Notifications */}
        {notification.message && (
          <div
            className={`mt-6 p-4 rounded-xl text-sm font-medium flex items-center justify-between border ${
              notification.type === "error"
                ? "bg-red-500/10 border-red-500/30 text-red-400"
                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === "error" ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
              <span>{notification.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotification({ type: "", message: "" })}
              className="text-slate-400 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>

      {/* 2. Navigation Tabs & Register Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("PASSKEYS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "PASSKEYS"
                ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <KeyRound size={15} /> Active Passkeys ({passkeys.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("POLICY")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "POLICY"
                ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Sliders size={15} /> Passwordless Policy
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            setNewDeviceName("");
            setRegisterStep(1);
            setRegisterModalOpen(true);
          }}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-purple-600/20"
        >
          <Plus size={15} /> Register New Passkey
        </button>
      </div>

      {/* 3. PASSKEYS TAB */}
      {activeTab === "PASSKEYS" && (
        <div className="space-y-4">
          <div className="relative w-full sm:w-80">
            <Search size={14} className="absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Search passkey name or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-4">Passkey Device Name</th>
                    <th className="p-4">Authenticator Type</th>
                    <th className="p-4">Transports</th>
                    <th className="p-4">Registered At</th>
                    <th className="p-4">Last Used</th>
                    <th className="p-4">Verification</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {filteredPasskeys.map((k) => (
                    <tr key={k.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-4 font-bold text-white font-sans">
                        <div className="flex items-center gap-2">
                          {k.authenticatorType === "HARDWARE_TOKEN" ? (
                            <Usb className="text-purple-400" size={16} />
                          ) : (
                            <Fingerprint className="text-emerald-400" size={16} />
                          )}
                          <span>{k.friendlyName}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono pl-6">{k.credentialId}</div>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 text-[10px] bg-slate-800 border border-slate-700 rounded text-sky-400">
                          {k.authenticatorType}
                        </span>
                      </td>
                      <td className="p-4 text-purple-300">{k.transports.join(", ")}</td>
                      <td className="p-4 text-slate-400">{new Date(k.registeredAt).toLocaleDateString()}</td>
                      <td className="p-4 text-emerald-400 font-bold">{k.lastUsedAt}</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-400 rounded">
                          {k.userVerification}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          type="button"
                          onClick={() => setRevokePasskeyTarget(k)}
                          className="p-1.5 text-red-400 hover:bg-red-500/10 border border-red-500/20 rounded-lg transition"
                          title="Revoke Passkey"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. POLICY TAB */}
      {activeTab === "POLICY" && policy && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">FIDO2 & WebAuthn Security Policies</h3>
              <p className="text-xs text-slate-400">Enterprise passwordless attestation and authentication enforcement</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: "enforcePasswordlessForAdmins", label: "Enforce Passwordless for Hospital Admins", desc: "Requires FIDO2 WebAuthn passkey for all admin roles." },
              { key: "requireHardwareAttestation", label: "Require Hardware Security Key Attestation", desc: "Only allows keys with verified Yubico or hardware TPM attestation." },
              { key: "allowPlatformBiometrics", label: "Allow Platform Biometrics (TouchID / Windows Hello)", desc: "Enables internal biometric sensors for authentication." },
              { key: "fallbackMfaAllowed", label: "Allow Fallback Time-based OTP / SMS MFA", desc: "Permits TOTP fallback if hardware passkey is unavailable." }
            ].map((item) => (
              <div key={item.key} className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-sm font-bold text-white">{item.label}</div>
                  <div className="text-xs text-slate-400">{item.desc}</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleTogglePolicySetting(item.key)}
                  className={`w-12 h-6 rounded-full transition relative p-1 ${
                    policy[item.key] ? "bg-purple-600" : "bg-slate-800"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      policy[item.key] ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. REGISTER PASSKEY MODAL */}
      {registerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full text-slate-100 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Fingerprint className="text-purple-400" size={20} />
                <h3 className="text-base font-bold text-white">Register FIDO2 Passkey</h3>
              </div>
              <button
                type="button"
                onClick={() => setRegisterModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {registerStep === 1 && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Passkey Device Friendly Name:</label>
                  <input
                    type="text"
                    placeholder="e.g. Work YubiKey 5C NFC"
                    value={newDeviceName}
                    onChange={(e) => setNewDeviceName(e.target.value)}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-sans focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 font-sans">
                  <button
                    type="button"
                    onClick={() => setRegisterModalOpen(false)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleStartRegistration}
                    disabled={!newDeviceName.trim() || actionLoading}
                    className="px-4 py-2 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-500 transition"
                  >
                    Initiate Challenge
                  </button>
                </div>
              </div>
            )}

            {registerStep === 2 && registrationChallenge && (
              <div className="space-y-4 text-xs text-center py-4">
                <div className="w-16 h-16 bg-purple-500/10 border border-purple-500/30 text-purple-400 rounded-full flex items-center justify-center mx-auto animate-pulse">
                  <Usb size={32} />
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">Touch Security Key / Scan Biometric</h4>
                  <p className="text-slate-400 text-xs">Insert your YubiKey or touch TouchID sensor to complete WebAuthn registration.</p>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl font-mono text-[10px] text-emerald-400 border border-slate-800 text-left">
                  Challenge: {registrationChallenge.challenge}
                </div>

                <button
                  type="button"
                  onClick={handleCompleteRegistration}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition"
                >
                  Simulate Touch & Register
                </button>
              </div>
            )}

            {registerStep === 3 && (
              <div className="space-y-4 text-xs text-center py-4">
                <CheckCircle2 size={48} className="text-emerald-400 mx-auto" />
                <h4 className="text-base font-bold text-white">Passkey Registered Successfully!</h4>
                <p className="text-slate-400 text-xs">You can now use "{newDeviceName}" for passwordless login.</p>
                <button
                  type="button"
                  onClick={() => setRegisterModalOpen(false)}
                  className="px-6 py-2 bg-slate-800 text-white font-bold rounded-xl text-xs"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. REVOKE CONFIRMATION MODAL */}
      {revokePasskeyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full text-slate-100 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Revoke Passkey?</h3>
                <p className="text-xs text-slate-400">"{revokePasskeyTarget.friendlyName}" will be removed from your account.</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 text-xs">
              <button
                type="button"
                onClick={() => setRevokePasskeyTarget(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRevoke}
                disabled={actionLoading}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition"
              >
                Revoke Key
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
