import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { getAuthorityVersion } from "../services/AuthService";
import { readJson, writeJson, remove } from "../utils/safeSessionStorage";

const USER_KEY = "medtrack_user";
const AUTHORITY_KEY = "medtrack_authority";
const DEFAULT_AUTHORITY = { authorityVersion: 1, permissions: [] };

/** How often the client re-checks its authority version against the server. */
const AUTHORITY_POLL_INTERVAL_MS = 60000;

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Read through safeSessionStorage. A bare JSON.parse here threw out of the provider's render on
  // any malformed value, and because ErrorBoundary is nested inside this provider it never mounted
  // and could not catch it - the whole tree unmounted to a permanently blank page with no route left
  // that could offer a way to sign out.
  const [user, setUser] = useState(() => readJson(USER_KEY, null));

  const [authorityState, setAuthorityState] = useState(
    () => readJson(AUTHORITY_KEY, DEFAULT_AUTHORITY)
  );

  const [authorityLoading, setAuthorityLoading] = useState(false);

  /** Set when the session was ended by an administrator rather than by the user. */
  const [revokedReason, setRevokedReason] = useState(null);

  const login = (userData) => {
    setRevokedReason(null);
    setUser(userData);
    writeJson(USER_KEY, userData);
    if (userData && userData.id) {
      fetchUserAuthority(userData.id);
    }
  };

  const logout = useCallback((reason = null) => {
    setUser(null);
    setAuthorityState(DEFAULT_AUTHORITY);
    setRevokedReason(reason);
    remove(USER_KEY);
    remove(AUTHORITY_KEY);
  }, []);

  // Held in a ref so fetchUserAuthority can call logout without taking it as a dependency, which
  // would put the callback's identity back on a state value and restart the poll interval.
  const logoutRef = useRef(logout);
  logoutRef.current = logout;

  // No dependency on authorityState. It previously depended on authorityState.authorityVersion while
  // also *setting* authorityState, so the callback identity changed on every poll, the effect below
  // tore down and recreated its interval each time, and an extra immediate fetch fired outside the
  // 60-second cadence. The version comparison also read a value captured when the callback was
  // created, so it could compare against a stale number.
  const fetchUserAuthority = useCallback(async (userId) => {
    if (!userId || userId === "demo-user") return;
    setAuthorityLoading(true);
    try {
      const data = await getAuthorityVersion(userId);
      if (data) {
        const newAuth = {
          authorityVersion: data.authorityVersion || 1,
          permissions: data.permissions || [],
          role: data.role || "",
          active: data.active
        };

        let revoked = false;

        // Compared inside the updater so it reads the committed value rather than a stale capture.
        setAuthorityState((previous) => {
          if (
            previous.authorityVersion &&
            newAuth.authorityVersion > previous.authorityVersion
          ) {
            revoked = true;
          }
          return newAuth;
        });

        if (revoked) {
          // Authority version exists so an administrator can revoke live sessions - that is what
          // POST /api/auth/authority/version/increment and /bump-global are for, and what the
          // Enterprise Security Center presents as "Active tokens invalidated!". Previously this
          // branch only logged a warning, so the console's headline control had no visible effect
          // and the UI kept rendering with the old permissions until the JWT expired on its own.
          logoutRef.current(
            "Your session was ended by an administrator. Please sign in again."
          );
          return;
        }

        writeJson(AUTHORITY_KEY, newAuth);
      }
    } catch (err) {
      console.error("Failed to fetch user authority state:", err);
    } finally {
      setAuthorityLoading(false);
    }
  }, []);

  // Periodic verification of the authority version. Depends only on the user id, so the interval is
  // created once per session rather than being recreated on every authority change.
  useEffect(() => {
    if (!user || !user.id) {
      return undefined;
    }
    fetchUserAuthority(user.id);
    const interval = setInterval(() => {
      fetchUserAuthority(user.id);
    }, AUTHORITY_POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [user?.id, fetchUserAuthority]);

  const hasPermission = (permissionName) => {
    if (!permissionName) return true;
    return authorityState.permissions.includes(permissionName);
  };

  const refreshAuthority = () => {
    if (user && user.id) {
      return fetchUserAuthority(user.id);
    }
    return Promise.resolve();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        authorityState,
        authorityVersion: authorityState.authorityVersion,
        permissions: authorityState.permissions,
        authorityLoading,
        revokedReason,
        login,
        logout,
        hasPermission,
        refreshAuthority
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
