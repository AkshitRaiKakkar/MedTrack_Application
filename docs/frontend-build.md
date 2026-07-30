# Building the MedTrack frontend

## Commands

```bash
npm ci            # reproducible install from package-lock.json
npm start         # dev server on http://localhost:3000
npm run build     # production bundle into build/
npm run check-syntax   # parse every source under src/ (also runs automatically before build)
```

`npm run build` is gated on `check-syntax` via the `prebuild` script, so an unparseable source file
fails in under a second instead of after a full webpack run.

## Tailwind CSS is pinned to v3 on purpose

`package.json` pins `tailwindcss` to `^3.4.19`. **Do not bump this to v4** without also replacing
`react-scripts`.

`react-scripts@5.0.1` decides how to configure PostCSS by checking for the presence of a config file
and then hardcoding the plugin name:

```js
// node_modules/react-scripts/config/webpack.config.js
const useTailwind = fs.existsSync(path.join(paths.appPath, 'tailwind.config.js'));
...
plugins: !useTailwind
  ? ['postcss-flexbugs-fixes', ['postcss-preset-env', ...], 'postcss-normalize']
  : ['tailwindcss', 'postcss-flexbugs-fixes', ['postcss-preset-env', ...]],
```

Tailwind v4 removed the PostCSS plugin from the `tailwindcss` entry point and moved it to
`@tailwindcss/postcss`. Because CRA injects the string `'tailwindcss'` itself, editing
`postcss.config.js` does not help — CRA's hardcoded entry still runs first and the build dies with:

```
Error: It looks like you're trying to use `tailwindcss` directly as a PostCSS plugin.
The PostCSS plugin has moved to a separate package, so to continue using Tailwind CSS with
PostCSS you'll need to install `@tailwindcss/postcss` and update your PostCSS configuration.
```

The only ways out are to rename `tailwind.config.js` so CRA's detection fails, or to stop using CRA
(craco, Vite, or ejecting). Both are much larger changes than a dependency bump, and neither belongs
in a build-repair PR.

The repository's Tailwind usage is also entirely v3-shaped and would need migrating alongside:

| | current (v3) | required by v4 |
| --- | --- | --- |
| `src/index.css` | `@tailwind base; @tailwind components; @tailwind utilities;` | `@import "tailwindcss";` |
| config | `tailwind.config.js` (`darkMode: 'class'`, CSS-variable colour aliases, 7 custom keyframes) | CSS-first `@theme`, or `@config` to keep the JS file |
| PostCSS | `tailwindcss` | `@tailwindcss/postcss` |

Note that `.github/dependabot.yml` plus the auto-merge workflow in
`.github/workflows/auto-merge.yml` will merge Dependabot PRs without a human check. Until a frontend
build job exists in CI, a major bump like this one can land on `main` and break the bundle silently.

## Why `scripts/check-syntax.js` exists

Two files reached `main` in an unparseable state:

```
src/components/auth/EnterpriseSecurityCenter.jsx      Unterminated JSX contents. (921:10)
src/components/auth/VulnerabilityManagementPanel.jsx  Missing semicolon. (99:12)
```

Nothing in CI builds the frontend. `lighthouse.yml` audits an already-deployed URL, and `vercel.yml`
skips every step when `VERCEL_TOKEN` is unset, so both stayed green.

`react-scripts build` does report these — but only after ~30 seconds of webpack work, and it stops
early. When `check-syntax` was first run against this repository it found a **third** occurrence of
the same `finaly` typo in `src/components/auth/SecurityObservabilityPanel.jsx` that the CRA build
had never surfaced, because it never got that far.

The script also prints the source around each failure. That matters most for unbalanced JSX, where
Babel blames end-of-file rather than the tag that was never closed — the `EnterpriseSecurityCenter`
error was reported at line 921 but originated at line 721.

## Linting

`package.json` currently has **no `eslintConfig` field**. `react-scripts` consequently runs its
ESLint plugin against `eslint-config-react-app/base` only, and never loads the full `react-app`
ruleset where `no-undef`, `no-dupe-keys` and `no-duplicate-case` are errors. Real defects of exactly
those kinds are present in `src/routes/AppRoutes.jsx` and `src/App.jsx` today and are not reported
by any build.

The field is now present, extending `react-app`. That enables the rules that matter for
correctness — `no-undef`, `no-dupe-keys`, `no-duplicate-case` — and enabling it immediately caught
two more real defects: `Network` and `Award` were used as icon components in
`EnterpriseSecurityCenter.jsx` without being imported.

Six rule families are explicitly switched **off** in `eslintConfig.rules`:

| Rule | Why it is off |
| --- | --- |
| `no-unused-vars` | ~40 files carry pre-existing unused imports |
| `react-hooks/exhaustive-deps` | ~8 `useEffect` calls have incomplete dependency arrays |
| `eqeqeq` | `HttpService.js` uses `==` on status codes |
| `jsx-a11y/anchor-is-valid`, `jsx-a11y/alt-text`, `no-script-url` | pre-existing accessibility warnings |

They are switched off rather than left as warnings because `react-scripts` promotes *every* warning
to a build error when `CI=true`, so leaving them on would fail the build for reasons unrelated to
the change that introduced the config. Each is worth fixing, but as its own PR with its own diff —
turning them on together would bury a real regression in ~200 lines of noise.

## Route consistency

`npm run check-routes` validates `src/routes/routeRegistry.js` against the pages on disk: every
referenced component is imported, every imported module exists, no page key or slug is claimed
twice, and every `src/pages/auth/*Page.jsx` is reachable from some URL. It runs from `prebuild`
alongside `check-syntax`.
