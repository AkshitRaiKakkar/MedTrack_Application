// Session storage that cannot take the application down.
//
// AuthProvider used to read its initial state with a bare `JSON.parse(sessionStorage.getItem(...))`
// inside a `useState` initializer. Any invalid value threw out of the provider's render, and because
// `ErrorBoundary` is nested *inside* the provider stack it never mounted and could not catch it —
// React unmounted the whole tree, leaving a permanently blank page.
//
// The user had no way back: every route lived inside the crashed tree, so there was no page left
// that could offer a "sign out" button, and clearing sessionStorage is not something a non-technical
// user can do. The only escape was devtools or a different browser profile.
//
// This needs no attacker to happen — an interrupted write, a quota error part-way through a write, or
// any future change to a stored shape produces it.

/**
 * Whether `sessionStorage` can be used at all.
 *
 * Access itself throws in some environments — Safari private browsing historically threw on
 * `setItem`, and storage can be blocked entirely by browser policy — so even the availability check
 * has to be guarded.
 */
function isAvailable() {
  try {
    const probe = "__medtrack_probe__";
    window.sessionStorage.setItem(probe, "1");
    window.sessionStorage.removeItem(probe);
    return true;
  } catch (error) {
    return false;
  }
}

const available = typeof window !== "undefined" && isAvailable();

/**
 * Reads and parses a JSON value, returning `fallback` if anything goes wrong.
 *
 * A corrupt entry is removed rather than left in place, so the next page load starts clean instead of
 * failing the same way forever.
 *
 * @param {string} key
 * @param {*} fallback value to return when the key is absent, unparseable, or storage is unavailable
 * @returns {*} the parsed value, or `fallback`
 */
export function readJson(key, fallback = null) {
  if (!available) {
    return fallback;
  }

  let raw;
  try {
    raw = window.sessionStorage.getItem(key);
  } catch (error) {
    return fallback;
  }

  if (raw === null || raw === undefined) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(raw);
    // `JSON.parse("null")` succeeds and yields null, which is not a usable value for any caller here.
    return parsed === null ? fallback : parsed;
  } catch (error) {
    // Deliberately warn rather than throw: an unreadable session is a reason to sign the user out,
    // not a reason to make the application unusable.
    console.warn(
      `Discarding unreadable sessionStorage entry "${key}"; signing out. ${error.message}`
    );
    remove(key);
    return fallback;
  }
}

/**
 * Serialises and stores a value. Never throws — a failed write leaves the user signed in for this
 * tab only, which is a far better outcome than a crash.
 *
 * @param {string} key
 * @param {*} value
 * @returns {boolean} whether the write succeeded
 */
export function writeJson(key, value) {
  if (!available) {
    return false;
  }
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`Could not persist sessionStorage entry "${key}". ${error.message}`);
    return false;
  }
}

/**
 * Removes a key, ignoring any failure.
 *
 * @param {string} key
 */
export function remove(key) {
  if (!available) {
    return;
  }
  try {
    window.sessionStorage.removeItem(key);
  } catch (error) {
    // Nothing useful to do; the caller is already on an error path.
  }
}

/** Exposed for tests, so the unavailable-storage branch can be asserted. */
export const storageAvailable = available;
