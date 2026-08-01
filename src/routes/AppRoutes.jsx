// src/routes/AppRoutes.jsx
import React, { Suspense } from "react";
import { useAuth } from "../context/AuthContext";
import PageLoader from "../components/common/PageLoader";
import { checkAccess, getRoute, resolveEffectivePage } from "./routeRegistry";

/**
 * Shown when a signed-in user reaches a console their role is not permitted to open.
 *
 * Distinct from the login substitution on purpose: an unauthenticated visitor is sent to the login
 * screen because signing in would fix it, whereas a technician opening an admin console has a
 * problem that signing in again will not solve.
 */
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

/**
 * Renders whichever page the registry resolves for `currentPage`.
 *
 * This file used to carry a 130-line `switch` listing every route by hand, in parallel with a
 * `routeMap` object in App.jsx and an import list at the top of this file. Nothing kept the three
 * consistent and they had drifted badly: `keyvault-security` appeared as a `case` label twice in
 * the same switch, `microsegmentation` appeared in two separate case groups so the second was
 * unreachable, and the `ProtectedRoute` helper the switch called was deleted by a merge while every
 * one of its ~30 call sites stayed - leaving a bare `return` statement floating between the
 * component's body and the switch, which is what stopped the whole bundle from parsing.
 *
 * Route information now lives in exactly one place - routeRegistry.js - and this component is the
 * generic renderer for it, so a new console cannot be half-registered.
 *
 * Access control is applied here, once, rather than per route:
 *
 *   - an unknown slug resolves to the 404 page;
 *   - an unauthenticated visitor to a protected route gets the login screen (App.jsx derives layout
 *     chrome from the same `resolveEffectivePage` call, so the two cannot disagree);
 *   - a signed-in user whose role is not on the route's allow-list gets the Access Denied page.
 */
export default function AppRoutes({ currentPage, onNavigate, pageData }) {
  const { user } = useAuth();

  // resolveEffectivePage decides which page actually renders: the requested one, or the login
  // screen for an unauthenticated caller, or the 404 page for an unknown slug. App.jsx calls the
  // same function to decide layout chrome, so the two cannot disagree about what is on screen.
  const effectivePage = resolveEffectivePage(user, currentPage);
  const route = getRoute(effectivePage);

  const renderContent = () => {
    // resolveEffectivePage only ever returns a page key the registry knows, so a missing route here
    // means the registry itself has lost its 404 entry. Fail visibly rather than render nothing.
    if (!route) {
      return (
        <UnauthorizedPage
          onNavigate={onNavigate}
          message="This page is not registered in the route registry."
        />
      );
    }

    const { allowed, reason } = checkAccess(user, effectivePage);
    if (!allowed) {
      return <UnauthorizedPage onNavigate={onNavigate} message={reason} />;
    }

    const Component = route.component;

    // A parameterised route names the prop its component expects for the dynamic segment, so
    // `/edit-equipment/EQ-1001` arrives as `equipmentId` and `/blog/my-post` as `slug` without this
    // file needing to know either name.
    const params = route.param ? { [route.param]: pageData } : {};

    return <Component onNavigate={onNavigate} {...params} />;
  };

  return <Suspense fallback={<PageLoader />}>{renderContent()}</Suspense>;
}
