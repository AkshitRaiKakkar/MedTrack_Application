import { useEffect, useState } from "react";
import { ReactLenis } from "lenis/react";
import "lenis/dist/lenis.css";
import { AuthProvider } from "./context/AuthContext";
import ErrorBoundary from "./components/common/ErrorBoundary";
import Navbar from "./components/common/Navbar";
import Footer from "./components/common/Footer";
import ScrollToTopButton from "./components/common/ScrollToTopButton";
import CustomCursor from "./components/common/CustomCursor";
import CookieBanner from "./components/common/CookieBanner";
import AppRoutes from "./routes/AppRoutes";
import { resolvePath, buildPath, hasChrome } from "./routes/routeRegistry";
import { ThemeProvider } from "./context/ThemeContext";

const BASE_PATH = "/MedTrack_Application";

/**
 * Strips the GitHub Pages base path and surrounding slashes from the current location, leaving the
 * bare route path for the registry to resolve.
 */
const currentRoutePath = () =>
  window.location.pathname
    .replace(new RegExp(`^${BASE_PATH}`, "i"), "")
    .replace(/^\/+|\/+$/g, "");

/**
 * Route resolution is delegated to routeRegistry.js.
 *
 * This file used to carry its own `routeMap` object, maintained by hand in parallel with the
 * `switch` in AppRoutes.jsx. The two drifted, and the map itself contained duplicate keys: `help`
 * appeared twice, and `microsegmentation` appeared twice with *different* targets ("ztna" and
 * "microsegmentation"). In an object literal the last wins silently, so `/microsegmentation`
 * resolved to a page whose switch case was itself unreachable.
 */
const getRouteStateFromPath = () => resolvePath(currentRoutePath());

function AppContent() {
  const initialRoute = getRouteStateFromPath();
  const [currentPage, setCurrentPage] = useState(initialRoute.page);
  const [pageData, setPageData] = useState(initialRoute.data);

  const handleNavigate = (page, data = null) => {
    setCurrentPage(page);
    setPageData(data);

    const basePath = window.location.pathname.includes(BASE_PATH) ? BASE_PATH : "";
    window.history.pushState({}, "", `${basePath}${buildPath(page, data)}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const handlePopState = () => {
      const route = getRouteStateFromPath();
      setCurrentPage(route.page);
      setPageData(route.data);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Whether a page shows the navbar and footer is a property of the route, declared once in the
  // registry, rather than a hard-coded list here that had to be kept in step with it.
  const showChrome = hasChrome(currentPage);

  return (
    <ReactLenis root>
      <div
        className="flex flex-col min-h-screen bg-surface text-primary transition-colors duration-200"
        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        <CustomCursor />
        {showChrome && (
          <Navbar onNavigate={handleNavigate} currentPage={currentPage} />
        )}

        <main className="flex-1">
          <AppRoutes
            currentPage={currentPage}
            onNavigate={handleNavigate}
            pageData={pageData}
          />
        </main>

        {showChrome && <Footer onNavigate={handleNavigate} />}
        <ScrollToTopButton />
        <CookieBanner onNavigate={handleNavigate} />
      </div>
    </ReactLenis>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ErrorBoundary>
          <AppContent />
        </ErrorBoundary>
      </ThemeProvider>
    </AuthProvider>
  );
}
