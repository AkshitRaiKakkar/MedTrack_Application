#!/usr/bin/env node
/**
 * Validates src/routes/routeRegistry.js against the pages that actually exist on disk.
 *
 * Why this exists
 * ---------------
 * Route information used to live in three hand-maintained places — the `routeMap` object in
 * App.jsx, the `switch` in AppRoutes.jsx, and the import list above it — with nothing keeping them
 * consistent. The drift that accumulated:
 *
 *   - `KeyVaultSecurityPage` and `MicrosegmentationPage` were rendered but never imported, an
 *     uncaught ReferenceError that the ErrorBoundary turns into a blank screen;
 *   - `case "keyvault-security"` and `case "microsegmentation"` each appeared twice, so the second
 *     was dead code and `/microsegmentation` silently rendered the ZTNA page instead;
 *   - `routeMap` declared `help` twice and `microsegmentation` twice with *different* targets, and
 *     in an object literal the last one silently wins;
 *   - fourteen security consoles existed as page components with no route at all.
 *
 * Collapsing the three lists into one registry removes the drift by construction. This script
 * closes the remaining gap: it fails the build when the registry itself is inconsistent, or when a
 * page is added to src/pages/auth/ and never registered.
 *
 * It works by static analysis rather than by importing the registry, so it needs no React runtime,
 * no JSDOM and no test framework, and it runs in well under a second from `prebuild`.
 *
 * Usage:  node scripts/check-routes.js
 */

'use strict';

const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const registryPath = path.join(projectRoot, 'src', 'routes', 'routeRegistry.js');
const authPagesDir = path.join(projectRoot, 'src', 'pages', 'auth');

const failures = [];

function fail(message) {
  failures.push(message);
}

function readRegistry() {
  if (!fs.existsSync(registryPath)) {
    console.error(`check-routes: ${path.relative(projectRoot, registryPath)} not found.`);
    process.exit(2);
  }
  return fs.readFileSync(registryPath, 'utf8');
}

/** `import Foo from "../pages/auth/Foo";` -> { Foo: '../pages/auth/Foo' } */
function parseImports(source) {
  const imports = {};
  const pattern = /^import\s+([A-Za-z_$][\w$]*)\s+from\s+["']([^"']+)["'];/gm;
  let match;
  while ((match = pattern.exec(source)) !== null) {
    imports[match[1]] = match[2];
  }
  return imports;
}

/**
 * Extracts the ROUTES entries. Deliberately regex-based and shallow: the registry is a flat array
 * of object literals with a fixed shape, and a real parser would add a dependency for no gain.
 */
function parseRoutes(source) {
  const start = source.indexOf('export const ROUTES = [');
  if (start < 0) {
    console.error('check-routes: could not find `export const ROUTES = [` in the registry.');
    process.exit(2);
  }
  const end = source.indexOf('\n];', start);
  const body = source.slice(start, end < 0 ? source.length : end);

  const routes = [];
  const entryPattern = /\{\s*page:\s*"([^"]+)"\s*,\s*slugs:\s*\[([^\]]*)\]\s*,\s*component:\s*([A-Za-z_$][\w$]*)([^}]*)\}/g;
  let match;
  while ((match = entryPattern.exec(body)) !== null) {
    const slugs = match[2]
      .split(',')
      .map((slug) => slug.trim().replace(/^["']|["']$/g, ''))
      .filter((slug) => slug.length > 0 || slug === '');
    routes.push({
      page: match[1],
      slugs: match[2].trim() === '""' ? [''] : slugs,
      component: match[3],
      rest: match[4],
      isParameterised: /\bparam:\s*"/.test(match[4]),
    });
  }
  return routes;
}

function main() {
  const source = readRegistry();
  const imports = parseImports(source);
  const routes = parseRoutes(source);

  if (routes.length === 0) {
    console.error('check-routes: parsed zero routes out of the registry. The parsing in this '
      + 'script has drifted from the file and every check below would be vacuous.');
    process.exit(2);
  }

  // 1. Every referenced component must be imported. This is the defect that produced a blank
  //    screen on /keyvault and /microsegmentation.
  for (const route of routes) {
    if (!imports[route.component]) {
      fail(`route "${route.page}" renders ${route.component}, which is never imported`);
    }
  }

  // 2. Every imported page module must exist on disk.
  for (const [name, specifier] of Object.entries(imports)) {
    if (!specifier.startsWith('../pages/')) {
      continue;
    }
    const resolved = path.resolve(path.dirname(registryPath), specifier);
    const exists = ['.jsx', '.js', '/index.jsx', '/index.js'].some((suffix) =>
      fs.existsSync(resolved + suffix)
    );
    if (!exists) {
      fail(`import ${name} points at ${specifier}, which does not exist`);
    }
  }

  // 3. No duplicate page keys.
  const seenPages = new Map();
  for (const route of routes) {
    if (seenPages.has(route.page)) {
      fail(`page key "${route.page}" is declared more than once`);
    }
    seenPages.set(route.page, route);
  }

  // 4. No duplicate slugs. A parameterised route legitimately shares its prefix with its list page
  //    (`blog` and `blog/:slug` are different routes), so the two kinds get their own map: a slug
  //    may appear once as static and once as parameterised, but not twice within either kind.
  //    Skipping parameterised routes outright, as an earlier version of this script did, let two
  //    dynamic routes claim the same prefix — `resolvePath` would then always pick whichever came
  //    first in ROUTES and the other would be permanently unreachable.
  const seenSlugs = new Map();
  const seenParameterisedSlugs = new Map();
  for (const route of routes) {
    const seen = route.isParameterised ? seenParameterisedSlugs : seenSlugs;
    const kind = route.isParameterised ? 'parameterised ' : '';
    for (const slug of route.slugs) {
      if (seen.has(slug)) {
        fail(
          `${kind}slug "${slug || '(root)'}" is claimed by both "${seen.get(slug)}" and `
          + `"${route.page}" - one of them is unreachable`
        );
      }
      seen.set(slug, route.page);
    }
  }

  // 5. Every security console under src/pages/auth/ must be reachable. This is what left fourteen
  //    pages with no URL at all.
  const registered = new Set(routes.map((route) => route.component));
  const authPages = fs
    .readdirSync(authPagesDir)
    .filter((file) => file.endsWith('Page.jsx'))
    .map((file) => file.replace('.jsx', ''));

  for (const page of authPages) {
    if (!registered.has(page)) {
      fail(`${page} exists in src/pages/auth/ but is not registered, so no URL reaches it`);
    }
  }

  if (failures.length > 0) {
    console.error(`\ncheck-routes: ${failures.length} problem(s) found.\n`);
    failures.forEach((message) => console.error(`  - ${message}`));
    console.error('');
    process.exit(1);
  }

  console.log(
    `check-routes: ${routes.length} routes, ${seenSlugs.size} slugs, `
    + `${seenParameterisedSlugs.size} parameterised, `
    + `${authPages.length} security consoles - all consistent.`
  );
}

main();
