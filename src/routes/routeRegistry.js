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

import { lazy } from "react";

const LandingPage = lazy(() => import("../pages/LandingPage"));
const NotFoundPage = lazy(() => import("../pages/NotFoundPage"));
const Blog = lazy(() => import("../pages/Blog"));
const BlogPost = lazy(() => import("../pages/BlogPost"));
const CareersPage = lazy(() => import("../pages/CareersPage"));
const JobApplicationPage = lazy(() => import("../pages/JobApplicationPage"));
const CertificateGeneratorPage = lazy(() => import("../pages/CertificateGeneratorPage"));
const AboutPage = lazy(() => import("../pages/AboutPage"));
const ContactPage = lazy(() => import("../pages/ContactPage"));
const GuidelinesPage = lazy(() => import("../pages/GuidelinesPage"));
const HelpCenterPage = lazy(() => import("../pages/HelpCenterPage"));
const AwardsPage = lazy(() => import("../pages/AwardsPage"));
const TermsPage = lazy(() => import("../pages/TermsPage"));
const GuidesPage = lazy(() => import("../pages/GuidesPage"));
const SecurityPage = lazy(() => import("../pages/SecurityPage"));
const SystemStatusPage = lazy(() => import("../pages/SystemStatusPage"));
const DualRangeSliderStudio = lazy(() => import("../components/common/DualRangeSliderStudio"));

const LoginPage = lazy(() => import("../pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("../pages/auth/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("../pages/auth/ForgotPasswordPage"));
const VerifyOtpPage = lazy(() => import("../pages/auth/VerifyOtpPage"));
const ResetPasswordPage = lazy(() => import("../pages/auth/ResetPasswordPage"));

const Dashboard = lazy(() => import("../pages/hospital/Dashboard"));
const AnalyticsDashboard = lazy(() => import("../pages/hospital/AnalyticsDashboard"));
const EquipmentList = lazy(() => import("../pages/hospital/EquipmentList"));
const MaintenanceSchedule = lazy(() => import("../pages/hospital/MaintenanceSchedule"));
const AddEquipmentForm = lazy(() => import("../pages/hospital/AddEquipmentForm"));
const EditEquipmentForm = lazy(() => import("../pages/hospital/EditEquipmentForm"));
const ScheduleMaintenancePage = lazy(() => import("../pages/hospital/ScheduleMaintenancePage"));
const RequestEquipmentPage = lazy(() => import("../pages/hospital/RequestEquipmentPage"));
const PreventiveMaintenanceRules = lazy(() => import("../pages/hospital/PreventiveMaintenanceRules"));
const MaintenanceSlaDashboard = lazy(() => import("../pages/hospital/MaintenanceSlaDashboard"));
const EquipmentCalibrationHub = lazy(() => import("../pages/hospital/EquipmentCalibrationHub"));
const SparePartsCatalog = lazy(() => import("../pages/hospital/SparePartsCatalog"));

const TaskList = lazy(() => import("../pages/technician/TaskList"));
const UpdateTask = lazy(() => import("../pages/technician/UpdateTask"));

const OrdersList = lazy(() => import("../pages/supplier/OrdersList"));
const OrderStatus = lazy(() => import("../pages/supplier/OrderStatus"));

const AuthoritySecurityPage = lazy(() => import("../pages/auth/AuthoritySecurityPage"));
const MfaSecurityPage = lazy(() => import("../pages/auth/MfaSecurityPage"));
const EnterpriseSsoPage = lazy(() => import("../pages/auth/EnterpriseSsoPage"));
const RbacSecurityPage = lazy(() => import("../pages/auth/RbacSecurityPage"));
const ZeroTrustSecurityPage = lazy(() => import("../pages/auth/ZeroTrustSecurityPage"));
const ComplianceSecurityPage = lazy(() => import("../pages/auth/ComplianceSecurityPage"));
const ThreatDetectionSoarPage = lazy(() => import("../pages/auth/ThreatDetectionSoarPage"));
const KeyVaultSecurityPage = lazy(() => import("../pages/auth/KeyVaultSecurityPage"));
const SecurityKeyVaultPage = lazy(() => import("../pages/auth/SecurityKeyVaultPage"));
const DlpPrivacyGuardPage = lazy(() => import("../pages/auth/DlpPrivacyGuardPage"));
const PasskeyPasswordlessPage = lazy(() => import("../pages/auth/PasskeyPasswordlessPage"));
const ZeroTrustNetworkPage = lazy(() => import("../pages/auth/ZeroTrustNetworkPage"));
const MicrosegmentationPage = lazy(() => import("../pages/auth/MicrosegmentationPage"));
const ScimProvisioningPage = lazy(() => import("../pages/auth/ScimProvisioningPage"));
const SiemSecurityAnalyticsPage = lazy(() => import("../pages/auth/SiemSecurityAnalyticsPage"));
const GrcAuditCompliancePage = lazy(() => import("../pages/auth/GrcAuditCompliancePage"));
const SecurityPosturePage = lazy(() => import("../pages/auth/SecurityPosturePage"));
const SecurityCommandCenterPage = lazy(() => import("../pages/auth/SecurityCommandCenterPage"));
const VulnerabilityManagementPage = lazy(() => import("../pages/auth/VulnerabilityManagementPage"));
const SecurityVulnerabilityPage = lazy(() => import("../pages/auth/SecurityVulnerabilityPage"));
const PamPage = lazy(() => import("../pages/auth/PamPage"));
const SbomPage = lazy(() => import("../pages/auth/SbomPage"));
const CspmPage = lazy(() => import("../pages/auth/CspmPage"));
const SoarPage = lazy(() => import("../pages/auth/SoarPage"));
const SamlIdentityProviderPage = lazy(() => import("../pages/auth/SamlIdentityProviderPage"));
const ThreatIntelligencePage = lazy(() => import("../pages/auth/ThreatIntelligencePage"));
const SecurityThreatPage = lazy(() => import("../pages/auth/SecurityThreatPage"));
const SecurityGovernancePage = lazy(() => import("../pages/auth/SecurityGovernancePage"));
const SecurityObservabilityPage = lazy(() => import("../pages/auth/SecurityObservabilityPage"));
const SecurityPlaybookPage = lazy(() => import("../pages/auth/SecurityPlaybookPage"));
const IncidentResponsePlaybookPage = lazy(() => import("../pages/auth/IncidentResponsePlaybookPage"));
const ComplianceEvidencePage = lazy(() => import("../pages/auth/ComplianceEvidencePage"));
const ComplianceReportingPage = lazy(() => import("../pages/auth/ComplianceReportingPage"));

/**
 * Path prefix the bundle is served under on GitHub Pages.
 *
 * Declared here rather than in App.jsx so the two halves of the round trip - stripping it when
 * reading `window.location`, re-adding it when pushing state - can never disagree about what the
 * prefix is.
 */
export const BASE_PATH = "/MedTrack_Application";

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
  // Terminal route for an unrecognised slug. resolvePath() resolves to this rather than silently
  // showing the landing page, so a mistyped URL is visibly a mistyped URL.
  { page: "not-found", slugs: ["not-found"], component: NotFoundPage, access: PUBLIC },
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
  { page: "dual-range-slider", slugs: ["dual-range-slider", "range-slider-studio"], component: DualRangeSliderStudio, access: PUBLIC },

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
  { page: "maintenance-rules", slugs: ["maintenance-rules"], component: PreventiveMaintenanceRules, access: HOSPITAL_ONLY },
  { page: "sla-dashboard", slugs: ["sla-dashboard"], component: MaintenanceSlaDashboard, access: HOSPITAL_ONLY },
  { page: "calibration", slugs: ["calibration", "equipment-calibration"], component: EquipmentCalibrationHub, access: HOSPITAL_ONLY },
  { page: "spare-parts", slugs: ["spare-parts"], component: SparePartsCatalog, access: HOSPITAL_ONLY },

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
