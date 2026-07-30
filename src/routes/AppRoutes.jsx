// src/routes/AppRoutes.jsx
//
// Resolution is table-driven from routeRegistry.js. The previous implementation was a `switch` with
// a parallel import list, and the two had drifted: `KeyVaultSecurityPage` and
// `MicrosegmentationPage` were rendered without ever being imported (an uncaught ReferenceError
// that the ErrorBoundary turned into a blank screen), `case "keyvault-security"` and
// `case "microsegmentation"` each appeared twice so the second was unreachable, and fourteen
// security consoles had no case at all.

import React from "react";
import { useAuth } from "../context/AuthContext";
import { getRoute, checkAccess, resolveEffectivePage } from "./routeRegistry";
import LoginPage from "../pages/auth/LoginPage";
import NotFoundPage from "../pages/NotFoundPage";

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

  if (effectivePage === "not-found") {
    return <NotFoundPage onNavigate={onNavigate} />;
  }

  if (effectivePage === "login" && currentPage !== "login") {
    return <LoginPage onNavigate={onNavigate} />;
  }

  const route = getRoute(currentPage);
  const { allowed, reason } = checkAccess(user, currentPage);

  if (!allowed) {
    // The denial now names the roles permitted on the route. UnauthorizedPage has always accepted
    // a `message` prop, but nothing ever passed one, so every denial showed the same generic line.
    return <UnauthorizedPage onNavigate={onNavigate} message={reason} />;
  }

  const Component = route.component;
  const props = { onNavigate };

  // A parameterised route names the prop its component expects, so the registry stays the only
  // place that knows `edit-equipment` takes `equipmentId` while `orderstatus` takes `order`.
  if (route.param) {
    props[route.param] = pageData;
  }
  if (currentPage === "register") {
    // RegisterPage pre-selects a role passed through navigation state rather than through the URL.
    props.defaultRole = pageData;
  }

  return <Component {...props} />;
}
