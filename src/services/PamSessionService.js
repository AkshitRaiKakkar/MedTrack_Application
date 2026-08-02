import API from "./HttpService";

/**
 * PamSessionService
 * Service layer for Privileged Access Management (PAM), Just-In-Time (JIT) Elevation,
 * Real-Time Session Audit Recording, Vaulted Root Credential Rotation, and Break-Glass Protocol.
 */

// Fetch active Privileged Sessions & JIT Requests
export const getPamSessions = async () => {
  try {
    const response = await API.get("/api/auth/pam/sessions");
    return response.data;
  } catch (error) {
    console.warn("Using fallback PAM session registry:", error.message);
    return [
      {
        sessionId: "PAM-SESS-301",
        operator: "admin.drjenkins@medtrack.org",
        targetHost: "prod-db-ehr-cluster-01.medtrack.internal",
        protocol: "SSH (Port 2222 via Bastion)",
        accessRole: "DBA_SUPERUSER_ELEVATED",
        jitDurationMinutes: 60,
        keystrokeAuditLogged: true,
        sessionRecordingState: "LIVE_RECORDING",
        approvalStatus: "JIT_APPROVED",
        startedAt: "2026-08-01T18:00:00Z"
      },
      {
        sessionId: "PAM-SESS-302",
        operator: "sec.ops.vance@medtrack.org",
        targetHost: "k8s-master-node-04.medtrack.internal",
        protocol: "KubeCTL (Port 6443)",
        accessRole: "CLUSTER_ADMIN_TEMPORARY",
        jitDurationMinutes: 30,
        keystrokeAuditLogged: true,
        sessionRecordingState: "COMPLETED_ARCHIVED",
        approvalStatus: "JIT_APPROVED",
        startedAt: "2026-08-01T15:30:00Z"
      },
      {
        sessionId: "PAM-SESS-303",
        operator: "vendor.imaging.support@external.com",
        targetHost: "dicom-pacs-server-02.medtrack.internal",
        protocol: "RDP (TLS 1.3 Vaulted)",
        accessRole: "VENDOR_MAINTENANCE_LIMITED",
        jitDurationMinutes: 15,
        keystrokeAuditLogged: true,
        sessionRecordingState: "TERMINATED_ANOMALY",
        approvalStatus: "REVOKED_ANOMALY_FLAG",
        startedAt: "2026-08-01T12:15:00Z"
      }
    ];
  }
};

// Request JIT Privileged Elevation
export const requestJitElevation = async (requestData) => {
  try {
    const response = await API.post("/api/auth/pam/request-jit", requestData);
    return response.data;
  } catch (error) {
    return {
      sessionId: `PAM-SESS-${Math.floor(304 + Math.random() * 200)}`,
      operator: requestData.operator || "current.user@medtrack.org",
      targetHost: requestData.targetHost || "prod-app-server-01.medtrack.internal",
      protocol: "SSH (Vaulted Bastion)",
      accessRole: requestData.accessRole || "SYSADMIN_TEMPORARY",
      jitDurationMinutes: requestData.durationMinutes || 45,
      keystrokeAuditLogged: true,
      sessionRecordingState: "LIVE_RECORDING",
      approvalStatus: "JIT_APPROVED",
      startedAt: new Date().toISOString()
    };
  }
};

// Terminate Privileged Session
export const terminatePamSession = async (sessionId) => {
  try {
    const response = await API.post(`/api/auth/pam/sessions/${sessionId}/terminate`);
    return response.data;
  } catch (error) {
    return {
      sessionId,
      sessionRecordingState: "TERMINATED_MANUALLY",
      approvalStatus: "REVOKED_IMMEDIATE",
      terminatedAt: new Date().toISOString()
    };
  }
};

// Fetch PAM Vault & Break-Glass Standards
export const getPamVaultPolicy = async () => {
  return [
    { policy: "Dual-Control Break-Glass", requirement: "Requires two senior security officer approvals for emergency root credential retrieval" },
    { policy: "Automatic Ephemeral Credential Rotation", requirement: "All SSH keys and database passwords expire and rotate immediately upon session termination" },
    { policy: "Full Optical & Keystroke Recording", requirement: "Mandatory 100% video stream and CLI keystroke index logging for SOC audit" }
  ];
};
