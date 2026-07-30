// src/routes/AppRoutes.jsx
import React, { Suspense } from "react";
import { useAuth } from "../context/AuthContext";
import PageLoader from "../components/common/PageLoader";

const LandingPage = React.lazy(() => import("../pages/LandingPage"));
const NotFoundPage = React.lazy(() => import("../pages/NotFoundPage"));
const Blog = React.lazy(() => import("../pages/Blog"));
const BlogPost = React.lazy(() => import("../pages/BlogPost"));
const CareersPage = React.lazy(() => import("../pages/CareersPage"));
const JobApplicationPage = React.lazy(() => import("../pages/JobApplicationPage"));
const HelpPage = React.lazy(() => import("../pages/HelpPage"));
const CertificateGeneratorPage = React.lazy(() => import("../pages/CertificateGeneratorPage"));
const LoginPage = React.lazy(() => import("../pages/auth/LoginPage"));
const RegisterPage = React.lazy(() => import("../pages/auth/RegisterPage"));
const ForgotPasswordPage = React.lazy(() => import("../pages/auth/ForgotPasswordPage"));
const VerifyOtpPage = React.lazy(() => import("../pages/auth/VerifyOtpPage"));
const ResetPasswordPage = React.lazy(() => import("../pages/auth/ResetPasswordPage"));
const Dashboard = React.lazy(() => import("../pages/hospital/Dashboard"));
const AnalyticsDashboard = React.lazy(() => import("../pages/hospital/AnalyticsDashboard"));
const EquipmentList = React.lazy(() => import("../pages/hospital/EquipmentList"));
const MaintenanceSchedule = React.lazy(() => import("../pages/hospital/MaintenanceSchedule"));
const TaskList = React.lazy(() => import("../pages/technician/TaskList"));
const UpdateTask = React.lazy(() => import("../pages/technician/UpdateTask"));
const OrdersList = React.lazy(() => import("../pages/supplier/OrdersList"));
const OrderStatus = React.lazy(() => import("../pages/supplier/OrderStatus"));
const AuthoritySecurityPage = React.lazy(() => import("../pages/auth/AuthoritySecurityPage"));
const MfaSecurityPage = React.lazy(() => import("../pages/auth/MfaSecurityPage"));
const EnterpriseSsoPage = React.lazy(() => import("../pages/auth/EnterpriseSsoPage"));
const RbacSecurityPage = React.lazy(() => import("../pages/auth/RbacSecurityPage"));
const ZeroTrustSecurityPage = React.lazy(() => import("../pages/auth/ZeroTrustSecurityPage"));
const ComplianceSecurityPage = React.lazy(() => import("../pages/auth/ComplianceSecurityPage"));
const ThreatDetectionSoarPage = React.lazy(() => import("../pages/auth/ThreatDetectionSoarPage"));
const SecurityKeyVaultPage = React.lazy(() => import("../pages/auth/SecurityKeyVaultPage"));
const KeyVaultSecurityPage = React.lazy(() => import("../pages/auth/KeyVaultSecurityPage"));
const DlpPrivacyGuardPage = React.lazy(() => import("../pages/auth/DlpPrivacyGuardPage"));
const PasskeyPasswordlessPage = React.lazy(() => import("../pages/auth/PasskeyPasswordlessPage"));
const ZeroTrustNetworkPage = React.lazy(() => import("../pages/auth/ZeroTrustNetworkPage"));
const ScimProvisioningPage = React.lazy(() => import("../pages/auth/ScimProvisioningPage"));
const SiemSecurityAnalyticsPage = React.lazy(() => import("../pages/auth/SiemSecurityAnalyticsPage"));
const GrcAuditCompliancePage = React.lazy(() => import("../pages/auth/GrcAuditCompliancePage"));
const SecurityPosturePage = React.lazy(() => import("../pages/auth/SecurityPosturePage"));
const SecurityCommandCenterPage = React.lazy(() => import("../pages/auth/SecurityCommandCenterPage"));
const VulnerabilityManagementPage = React.lazy(() => import("../pages/auth/VulnerabilityManagementPage"));
const MicrosegmentationPage = React.lazy(() => import("../pages/auth/MicrosegmentationPage"));
const PamPage = React.lazy(() => import("../pages/auth/PamPage"));

// --- Connected Imports ---
const AddEquipmentForm = React.lazy(() => import("../pages/hospital/AddEquipmentForm"));
const EditEquipmentForm = React.lazy(() => import("../pages/hospital/EditEquipmentForm"));
const ScheduleMaintenancePage = React.lazy(() => import("../pages/hospital/ScheduleMaintenancePage"));
const RequestEquipmentPage = React.lazy(() => import("../pages/hospital/RequestEquipmentPage"));

const UnauthorizedPage = ({ onNavigate, message }) => (
  <div className="min-h-screen bg-slate-900 flex items-center justify-center font-sans text-white p-6">
    <div className="bg-slate-800 rounded-[2rem] p-16 text-center border border-red-500/20 max-w-md shadow-2xl">
      <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500 text-3xl">
        ⚠️
      </div>
      <h2 className="text-2xl font-black mb-2">Access Denied</h2>
      <p className="text-red-400 font-bold mb-6">
        {message || "Your account role is not authorized to access this resource."}
      </p>
      <button
        onClick={() => onNavigate("dashboard")}
        className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-500/20"
      >
        Go to Dashboard
      </button>
    </div>
  </div>
);

export default function AppRouter({ currentPage, onNavigate, pageData }) {
  const { user } = useAuth();

  // resolveEffectivePage decides which page actually renders: the requested one, or the login
  // screen for an unauthenticated caller, or the 404 page for an unknown slug. App.jsx calls the
  // same function to decide layout chrome, so the two cannot disagree about what is on screen.
  const effectivePage = resolveEffectivePage(user, currentPage);

    return <Component onNavigate={onNavigate} {...props} />;
  };

  const renderContent = () => {
    switch (currentPage) {
      // --- Public Routes ---
      case "landing":
        return <LandingPage onNavigate={onNavigate} />;
      case "blog":
        return <Blog onNavigate={onNavigate} />;
      case "blog-post":
        return <BlogPost onNavigate={onNavigate} slug={pageData} />;
      case "careers":
        return <CareersPage onNavigate={onNavigate} />;
      case "apply":
        return <JobApplicationPage onNavigate={onNavigate} jobId={pageData} />;
      case "certificate":
        return <CertificateGeneratorPage />;
      case "login":
        return <LoginPage onNavigate={onNavigate} />;
      case "register":
        return <RegisterPage onNavigate={onNavigate} defaultRole={pageData} />;
      case "forgot-password":
        return <ForgotPasswordPage onNavigate={onNavigate} />;
      case "verify-otp":
        return <VerifyOtpPage onNavigate={onNavigate} />;
      case "reset-password":
        return <ResetPasswordPage onNavigate={onNavigate} />;

      // --- Protected Routes: Hospital Admin ---
      case "dashboard":
        return ProtectedRoute(Dashboard);
      case "equipment":
        return ProtectedRoute(EquipmentList);
      case "add-equipment":
        return ProtectedRoute(AddEquipmentForm, {}, ["hospital"]);
      case "edit-equipment":
        return ProtectedRoute(EditEquipmentForm, { equipmentId: pageData }, ["hospital"]);
      case "schedule-maintenance":
        return ProtectedRoute(ScheduleMaintenancePage, {}, ["hospital"]);
      case "request-equipment":
        return ProtectedRoute(RequestEquipmentPage, {}, ["hospital"]);
      case "maintenance":
        return ProtectedRoute(MaintenanceSchedule);
      case "analytics":
        return ProtectedRoute(AnalyticsDashboard, {}, ["hospital"]);

      // --- Protected Routes: Technician ---
      case "tasks":
        return ProtectedRoute(TaskList);
      case "update-task":
        return ProtectedRoute(UpdateTask, { task: pageData });
      case "updatetask":
        return ProtectedRoute(UpdateTask, { task: pageData });

      // --- Protected Routes: Supplier ---
      case "orders":
        return ProtectedRoute(OrdersList);
      case "orderstatus":
        return ProtectedRoute(OrderStatus, { order: pageData });

      // --- Protected Routes: Security & Authority ---
      case "authority-security":
      case "authority":
        return ProtectedRoute(AuthoritySecurityPage, {}, ["hospital"]);
      case "mfa-security":
      case "mfa":
        return ProtectedRoute(MfaSecurityPage);
      case "sso-security":
      case "sso":
        return ProtectedRoute(EnterpriseSsoPage, {}, ["hospital"]);
      case "rbac-security":
      case "rbac":
        return ProtectedRoute(RbacSecurityPage, {}, ["hospital"]);
      case "zerotrust-security":
      case "zerotrust":
        return ProtectedRoute(ZeroTrustSecurityPage, {}, ["hospital"]);
      case "compliance-security":
      case "compliance":
        return ProtectedRoute(ComplianceSecurityPage);
      case "threat-detection":
      case "soar-security":
      case "soar":
        return ProtectedRoute(ThreatDetectionSoarPage);
      case "keyvault-security":
      case "keyvault":
      case "keyvault-security":
        return ProtectedRoute(KeyVaultSecurityPage);
      case "dlp":
      case "dlp-privacy":
      case "privacy-guard":
        return ProtectedRoute(DlpPrivacyGuardPage);
      case "passkeys":
      case "passwordless":
      case "webauthn":
        return ProtectedRoute(PasskeyPasswordlessPage);
      case "ztna":
      case "microsegmentation":
      case "network-access":
        return ProtectedRoute(ZeroTrustNetworkPage);
      case "siem":
      case "siem-analytics":
      case "siem-security":
        return ProtectedRoute(SiemSecurityAnalyticsPage);
      case "scim-provisioning":
      case "scim":
        return ProtectedRoute(ScimProvisioningPage);
      case "security-commandcenter":
      case "command-center":
        return ProtectedRoute(SecurityCommandCenterPage);
      case "vulnerability":
      case "patch-management":
        return ProtectedRoute(VulnerabilityManagementPage);
      case "microsegmentation":
      case "sdp":
      case "perimeter-security":
        return ProtectedRoute(MicrosegmentationPage);
      case "grc":
      case "grc-compliance":
      case "audit-ledger":
        return ProtectedRoute(GrcAuditCompliancePage);
      case "pam":
      case "privileged-access":
      case "jit-elevation":
        return ProtectedRoute(PamPage);
      case "help":
      case "help-center":
        return <HelpPage onNavigate={onNavigate} />;

      // --- Fallback: 404 ---
      default:
        return <NotFoundPage onNavigate={onNavigate} />;
    }
  };

  return <Suspense fallback={<PageLoader />}>{renderContent()}</Suspense>;
}
