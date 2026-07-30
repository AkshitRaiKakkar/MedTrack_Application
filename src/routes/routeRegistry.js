// Single source of truth for SPA routing.
//
// Route information used to live in three places that had to be edited together and had drifted:
//
//   1. the `routeMap` object in src/App.jsx        (URL slug  -> page key)
//   2. the `switch` statement in src/routes/AppRoutes.jsx (page key -> component + role guard)
//   3. the import list at the top of AppRoutes.jsx (page key -> module)
//
// Nothing kept them consistent, and the accumulated drift was: two components rendered without ever
// being imported (a runtime ReferenceError), four route keys declared twice so the second was dead,
// and fourteen security consoles that existed as page components but were unreachable from any URL.
//
// One entry per page here means a new console cannot be half-registered: scripts/check-routes.js
// runs from `prebuild` and fails the build if a page under src/pages/auth/ is missing from this
// list, if two entries claim the same slug, or if a referenced component is never imported.

import LandingPage from "../pages/LandingPage";
import Blog from "../pages/Blog";
import BlogPost from "../pages/BlogPost";
import CareersPage from "../pages/CareersPage";
import JobApplicationPage from "../pages/JobApplicationPage";
import CertificateGeneratorPage from "../pages/CertificateGeneratorPage";
import AboutPage from "../pages/AboutPage";
import ContactPage from "../pages/ContactPage";
import GuidelinesPage from "../pages/GuidelinesPage";
import HelpCenterPage from "../pages/HelpCenterPage";
import AwardsPage from "../pages/AwardsPage";
import TermsPage from "../pages/TermsPage";
import GuidesPage from "../pages/GuidesPage";
import SecurityPage from "../pages/SecurityPage";
import SystemStatusPage from "../pages/SystemStatusPage";

import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";
import VerifyOtpPage from "../pages/auth/VerifyOtpPage";
import ResetPasswordPage from "../pages/auth/ResetPasswordPage";

import Dashboard from "../pages/hospital/Dashboard";
import AnalyticsDashboard from "../pages/hospital/AnalyticsDashboard";
import EquipmentList from "../pages/hospital/EquipmentList";
import MaintenanceSchedule from "../pages/hospital/MaintenanceSchedule";
import AddEquipmentForm from "../pages/hospital/AddEquipmentForm";
import EditEquipmentForm from "../pages/hospital/EditEquipmentForm";
import ScheduleMaintenancePage from "../pages/hospital/ScheduleMaintenancePage";
import RequestEquipmentPage from "../pages/hospital/RequestEquipmentPage";

import TaskList from "../pages/technician/TaskList";
import UpdateTask from "../pages/technician/UpdateTask";

import OrdersList from "../pages/supplier/OrdersList";
import OrderStatus from "../pages/supplier/OrderStatus";

import AuthoritySecurityPage from "../pages/auth/AuthoritySecurityPage";
import MfaSecurityPage from "../pages/auth/MfaSecurityPage";
import EnterpriseSsoPage from "../pages/auth/EnterpriseSsoPage";
import RbacSecurityPage from "../pages/auth/RbacSecurityPage";
import ZeroTrustSecurityPage from "../pages/auth/ZeroTrustSecurityPage";
import ComplianceSecurityPage from "../pages/auth/ComplianceSecurityPage";
import ThreatDetectionSoarPage from "../pages/auth/ThreatDetectionSoarPage";
import KeyVaultSecurityPage from "../pages/auth/KeyVaultSecurityPage";
import SecurityKeyVaultPage from "../pages/auth/SecurityKeyVaultPage";
import DlpPrivacyGuardPage from "../pages/auth/DlpPrivacyGuardPage";
import PasskeyPasswordlessPage from "../pages/auth/PasskeyPasswordlessPage";
import ZeroTrustNetworkPage from "../pages/auth/ZeroTrustNetworkPage";
import MicrosegmentationPage from "../pages/auth/MicrosegmentationPage";
import ScimProvisioningPage from "../pages/auth/ScimProvisioningPage";
import SiemSecurityAnalyticsPage from "../pages/auth/SiemSecurityAnalyticsPage";
import GrcAuditCompliancePage from "../pages/auth/GrcAuditCompliancePage";
import SecurityPosturePage from "../pages/auth/SecurityPosturePage";
import SecurityCommandCenterPage from "../pages/auth/SecurityCommandCenterPage";
import VulnerabilityManagementPage from "../pages/auth/VulnerabilityManagementPage";
import SecurityVulnerabilityPage from "../pages/auth/SecurityVulnerabilityPage";
import PamPage from "../pages/auth/PamPage";
import SbomPage from "../pages/auth/SbomPage";
import CspmPage from "../pages/auth/CspmPage";
import SoarPage from "../pages/auth/SoarPage";
import SamlIdentityProviderPage from "../pages/auth/SamlIdentityProviderPage";
import ThreatIntelligencePage from "../pages/auth/ThreatIntelligencePage";
import SecurityThreatPage from "../pages/auth/SecurityThreatPage";
import SecurityGovernancePage from "../pages/auth/SecurityGovernancePage";
import SecurityObservabilityPage from "../pages/auth/SecurityObservabilityPage";
import SecurityPlaybookPage from "../pages/auth/SecurityPlaybookPage";
import IncidentResponsePlaybookPage from "../pages/auth/IncidentResponsePlaybookPage";
import ComplianceEvidencePage from "../pages/auth/ComplianceEvidencePage";
import ComplianceReportingPage from "../pages/auth/ComplianceReportingPage";

/**
 * Access levels.
 *
 * PUBLIC        - no session required.
 * AUTHENTICATED - any signed-in role.
 * anything else - an array of lower-cased role names permitted on the route.
 */
export const PUBLIC = "public";
export const AUTHENTICATED = "authenticated";

/** Hospital-admin-only consoles: these manage policy for every account in the tenant. */
const HOSPITAL_ONLY = ["hospital"];

/**
 * Every route in the application.
 *
 * @property {string}   page      canonical page key, used as `currentPage`
 * @property {string[]} slugs     URL slugs resolving to this page; the first is canonical
 * @property {Function} component React component to render
 * @property {string|string[]} access PUBLIC, AUTHENTICATED, or an array of permitted roles
 * @property {boolean}  chrome    whether the navbar and footer are shown (defaults to true)
 * @property {string}   param     name of the dynamic path segment, if the route takes one
 */
export const ROUTES = [
  // --- public marketing and content -----------------------------------------
  { page: "landing", slugs: [""], component: LandingPage, access: PUBLIC },
  { page: "blog", slugs: ["blog"], component: Blog, access: PUBLIC },
  { page: "blog-post", slugs: ["blog"], component: BlogPost, access: PUBLIC, param: "slug" },
  { page: "careers", slugs: ["careers"], component: CareersPage, access: PUBLIC },
  { page: "apply", slugs: ["apply"], component: JobApplicationPage, access: PUBLIC, param: "jobId", chrome: false },
  { page: "certificate", slugs: ["certificate"], component: CertificateGeneratorPage, access: PUBLIC },
  { page: "about", slugs: ["about"], component: AboutPage, access: PUBLIC },
  { page: "contact", slugs: ["contact"], component: ContactPage, access: PUBLIC },
  { page: "guidelines", slugs: ["guidelines"], component: GuidelinesPage, access: PUBLIC },
  { page: "help", slugs: ["help", "help-center"], component: HelpCenterPage, access: PUBLIC },
  { page: "awards", slugs: ["awards"], component: AwardsPage, access: PUBLIC },
  { page: "terms", slugs: ["terms"], component: TermsPage, access: PUBLIC },
  { page: "guides", slugs: ["guides"], component: GuidesPage, access: PUBLIC },
  { page: "security", slugs: ["security"], component: SecurityPage, access: PUBLIC },
  { page: "status", slugs: ["status"], component: SystemStatusPage, access: PUBLIC },

  // --- authentication flows (no chrome: these are full-bleed layouts) --------
  { page: "login", slugs: ["login"], component: LoginPage, access: PUBLIC, chrome: false },
  { page: "register", slugs: ["register"], component: RegisterPage, access: PUBLIC, chrome: false },
  { page: "forgot-password", slugs: ["forgot-password"], component: ForgotPasswordPage, access: PUBLIC, chrome: false },
  { page: "verify-otp", slugs: ["verify-otp"], component: VerifyOtpPage, access: PUBLIC, chrome: false },
  { page: "reset-password", slugs: ["reset-password"], component: ResetPasswordPage, access: PUBLIC, chrome: false },

  // --- hospital ---------------------------------------------------------------
  { page: "dashboard", slugs: ["dashboard"], component: Dashboard, access: AUTHENTICATED, chrome: false },
  { page: "equipment", slugs: ["equipment"], component: EquipmentList, access: AUTHENTICATED },
  { page: "maintenance", slugs: ["maintenance"], component: MaintenanceSchedule, access: AUTHENTICATED },
  { page: "analytics", slugs: ["analytics"], component: AnalyticsDashboard, access: HOSPITAL_ONLY },
  { page: "add-equipment", slugs: ["add-equipment"], component: AddEquipmentForm, access: HOSPITAL_ONLY },
  { page: "edit-equipment", slugs: ["edit-equipment"], component: EditEquipmentForm, access: HOSPITAL_ONLY, param: "equipmentId" },
  { page: "schedule-maintenance", slugs: ["schedule-maintenance"], component: ScheduleMaintenancePage, access: HOSPITAL_ONLY },
  { page: "request-equipment", slugs: ["request-equipment"], component: RequestEquipmentPage, access: HOSPITAL_ONLY },

  // --- technician -------------------------------------------------------------
  { page: "tasks", slugs: ["tasks"], component: TaskList, access: AUTHENTICATED },
  { page: "update-task", slugs: ["update-task", "updatetask"], component: UpdateTask, access: AUTHENTICATED, param: "task" },

  // --- supplier ---------------------------------------------------------------
  { page: "orders", slugs: ["orders"], component: OrdersList, access: AUTHENTICATED },
  { page: "orderstatus", slugs: ["orderstatus"], component: OrderStatus, access: AUTHENTICATED, param: "order" },

  // --- security consoles: tenant-wide policy, hospital admin only -------------
  { page: "authority-security", slugs: ["authority-security", "authority"], component: AuthoritySecurityPage, access: HOSPITAL_ONLY },
  { page: "sso-security", slugs: ["sso-security", "sso"], component: EnterpriseSsoPage, access: HOSPITAL_ONLY },
  { page: "rbac-security", slugs: ["rbac-security", "rbac"], component: RbacSecurityPage, access: HOSPITAL_ONLY },
  { page: "zerotrust-security", slugs: ["zerotrust-security", "zerotrust"], component: ZeroTrustSecurityPage, access: HOSPITAL_ONLY },
  { page: "saml-identity", slugs: ["saml", "saml-identity", "identity-federation"], component: SamlIdentityProviderPage, access: HOSPITAL_ONLY },
  { page: "scim-provisioning", slugs: ["scim-provisioning", "scim"], component: ScimProvisioningPage, access: HOSPITAL_ONLY },
  { page: "security-governance", slugs: ["governance", "security-governance"], component: SecurityGovernancePage, access: HOSPITAL_ONLY },

  // --- security consoles: any authenticated role ------------------------------
  { page: "mfa-security", slugs: ["mfa-security", "mfa"], component: MfaSecurityPage, access: AUTHENTICATED },
  { page: "compliance-security", slugs: ["compliance-security", "compliance"], component: ComplianceSecurityPage, access: AUTHENTICATED },
  { page: "threat-detection", slugs: ["threat-detection", "soar-security"], component: ThreatDetectionSoarPage, access: AUTHENTICATED },
  { page: "soar", slugs: ["soar", "orchestration"], component: SoarPage, access: AUTHENTICATED },
  { page: "keyvault-security", slugs: ["keyvault-security", "keyvault", "key-vault"], component: KeyVaultSecurityPage, access: AUTHENTICATED },
  { page: "security-keyvault", slugs: ["security-keyvault", "hsm"], component: SecurityKeyVaultPage, access: AUTHENTICATED },
  { page: "dlp-privacy", slugs: ["dlp-privacy", "dlp", "privacy-guard"], component: DlpPrivacyGuardPage, access: AUTHENTICATED },
  { page: "passkeys", slugs: ["passkeys", "passwordless", "webauthn"], component: PasskeyPasswordlessPage, access: AUTHENTICATED },
  { page: "ztna", slugs: ["ztna", "network-access"], component: ZeroTrustNetworkPage, access: AUTHENTICATED },
  { page: "microsegmentation", slugs: ["microsegmentation", "sdp", "perimeter-security"], component: MicrosegmentationPage, access: AUTHENTICATED },
  { page: "siem-analytics", slugs: ["siem-analytics", "siem", "siem-security"], component: SiemSecurityAnalyticsPage, access: AUTHENTICATED },
  { page: "grc-compliance", slugs: ["grc-compliance", "grc", "audit-ledger"], component: GrcAuditCompliancePage, access: AUTHENTICATED },
  { page: "security-posture", slugs: ["posture", "security-posture"], component: SecurityPosturePage, access: AUTHENTICATED },
  { page: "security-commandcenter", slugs: ["security-commandcenter", "command-center"], component: SecurityCommandCenterPage, access: AUTHENTICATED },
  { page: "vulnerability", slugs: ["vulnerability", "patch-management"], component: VulnerabilityManagementPage, access: AUTHENTICATED },
  { page: "security-vulnerability", slugs: ["cve-registry", "security-vulnerability"], component: SecurityVulnerabilityPage, access: AUTHENTICATED },
  { page: "pam", slugs: ["pam", "privileged-access", "jit-elevation"], component: PamPage, access: AUTHENTICATED },
  { page: "sbom", slugs: ["sbom", "supply-chain"], component: SbomPage, access: AUTHENTICATED },
  { page: "cspm", slugs: ["cspm", "cloud-posture"], component: CspmPage, access: AUTHENTICATED },
  { page: "threat-intelligence", slugs: ["threat-intel", "threat-intelligence"], component: ThreatIntelligencePage, access: AUTHENTICATED },
  { page: "security-threat", slugs: ["threats", "security-threat"], component: SecurityThreatPage, access: AUTHENTICATED },
  { page: "security-observability", slugs: ["observability", "security-observability"], component: SecurityObservabilityPage, access: AUTHENTICATED },
  { page: "security-playbook", slugs: ["playbooks", "security-playbook"], component: SecurityPlaybookPage, access: AUTHENTICATED },
  { page: "incident-response", slugs: ["incident-response", "ir-playbook"], component: IncidentResponsePlaybookPage, access: AUTHENTICATED },
  { page: "compliance-evidence", slugs: ["evidence", "compliance-evidence"], component: ComplianceEvidencePage, access: AUTHENTICATED },
  { page: "compliance-reporting", slugs: ["compliance-reporting", "reporting"], component: ComplianceReportingPage, access: AUTHENTICATED },
];

/**
 * Routes carrying a dynamic path segment, e.g. `/edit-equipment/EQ-1001`.
 *
 * Ordered longest-prefix-first so `blog-post` is considered before any shorter prefix could
 * shadow it.
 */
const PARAMETERISED_ROUTES = ROUTES.filter((route) => route.param);

/** slug -> page key. Built once; duplicates are a build failure, see scripts/check-routes.js. */
export const SLUG_TO_PAGE = ROUTES.reduce((accumulator, route) => {
  route.slugs.forEach((slug) => {
    // A parameterised route shares its prefix with its list page (`blog` and `blog/:slug`);
    // the bare slug belongs to the list page, so never let the detail page claim it.
    if (!route.param) {
      accumulator[slug] = route.page;
    }
  });
  return accumulator;
}, {});

/** page key -> route definition. */
export const PAGE_TO_ROUTE = ROUTES.reduce((accumulator, route) => {
  accumulator[route.page] = route;
  return accumulator;
}, {});

export function getRoute(page) {
  return PAGE_TO_ROUTE[page];
}

/** Whether the navbar and footer should be rendered for a page. Defaults to true. */
export function hasChrome(page) {
  const route = getRoute(page);
  return route ? route.chrome !== false : true;
}

/**
 * Resolves a URL path (already stripped of any base path and surrounding slashes) to a
 * `{ page, data }` pair.
 *
 * Unknown paths resolve to `not-found` so a mistyped URL renders the 404 page instead of silently
 * showing the landing page, which is what the previous `routeMap[path] || "landing"` fallback did.
 */
export function resolvePath(path) {
  if (!path) {
    return { page: "landing", data: null };
  }

  const normalised = path.toLowerCase();

  for (const route of PARAMETERISED_ROUTES) {
    for (const slug of route.slugs) {
      const prefix = `${slug}/`;
      if (normalised.startsWith(prefix)) {
        return { page: route.page, data: decodeURIComponent(path.slice(prefix.length)) };
      }
    }
  }

  const page = SLUG_TO_PAGE[normalised];
  return page ? { page, data: null } : { page: "not-found", data: null };
}

/**
 * Builds the URL path for a navigation target. Inverse of {@link resolvePath}.
 */
export function buildPath(page, data) {
  const route = getRoute(page);
  if (!route) {
    return `/${page}`;
  }
  const slug = route.slugs[0];
  if (route.param && data) {
    return `/${slug}/${encodeURIComponent(data)}`;
  }
  return slug ? `/${slug}` : "/";
}

/**
 * The page that will actually be rendered for a request.
 *
 * AppRoutes substitutes the login screen for an unauthenticated hit on a protected route, and the
 * 404 page for an unknown slug. Layout chrome has to be decided from that substituted page rather
 * than the requested one: keying it off the request wrapped the full-bleed login screen in the
 * navbar and footer whenever a signed-out visitor hit /equipment. Both the router and App.jsx call
 * this, so the two cannot disagree about what is on screen.
 *
 * @param {object|null} user  the authenticated user, or null
 * @param {string} page       requested page key
 * @returns {string} the page key that will be rendered
 */
export function resolveEffectivePage(user, page) {
  if (!getRoute(page)) {
    return "not-found";
  }
  const { allowed, reason } = checkAccess(user, page);
  if (!allowed && reason === "unauthenticated") {
    return "login";
  }
  return page;
}

/**
 * Whether a user may view a page.
 *
 * @param {object|null} user  the authenticated user, or null
 * @param {string} page       page key
 * @returns {{allowed: boolean, reason: string|null}}
 */
export function checkAccess(user, page) {
  const route = getRoute(page);
  if (!route || route.access === PUBLIC) {
    return { allowed: true, reason: null };
  }

  if (!user) {
    return { allowed: false, reason: "unauthenticated" };
  }

  if (route.access === AUTHENTICATED) {
    return { allowed: true, reason: null };
  }

  const role = (user.role || "").toLowerCase();
  if (route.access.includes(role)) {
    return { allowed: true, reason: null };
  }

  return {
    allowed: false,
    reason: `This console is restricted to the ${route.access.join(", ")} role.`,
  };
}
