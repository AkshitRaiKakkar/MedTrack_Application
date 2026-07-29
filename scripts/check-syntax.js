#!/usr/bin/env node
/**
 * Parses every JavaScript/JSX source under `src/` and fails the build if any file is not
 * syntactically valid.
 *
 * Why this exists
 * ---------------
 * Two files on `main` were not parseable, so `npm run build` produced no bundle at all:
 *
 *   src/components/auth/EnterpriseSecurityCenter.jsx   Unterminated JSX contents. (921:10)
 *   src/components/auth/VulnerabilityManagementPanel.jsx   Missing semicolon. (99:12)
 *
 * Neither was caught before merge, because no CI job builds the frontend: the Lighthouse workflow
 * audits an already-deployed URL, and the Vercel workflow skips every step when `VERCEL_TOKEN` is
 * unset. A broken bundle therefore reaches `main` with all checks green.
 *
 * `react-scripts build` does report these, but only after ~30s of webpack work, and it stops at the
 * first two failures. This script parses the whole tree in well under a second, reports *every*
 * offending file in one pass, and prints the surrounding source so the real location is obvious --
 * which matters for unbalanced JSX, where the parser blames the end of the file rather than the tag
 * that was never closed.
 *
 * Wired into `prebuild`, so `npm run build` cannot succeed with an unparseable source file.
 *
 * Usage:
 *   node scripts/check-syntax.js            # check src/
 *   node scripts/check-syntax.js src/pages  # check a subtree
 */

'use strict';

const fs = require('fs');
const path = require('path');

let parser;
try {
  // eslint-disable-next-line global-require
  parser = require('@babel/parser');
} catch (error) {
  console.error(
    'check-syntax: @babel/parser is not installed. Run `npm install` and try again.'
  );
  process.exit(2);
}

const EXTENSIONS = new Set(['.js', '.jsx', '.mjs', '.cjs']);
const IGNORED_DIRECTORIES = new Set(['node_modules', 'build', 'dist', 'coverage', '.git']);
const CONTEXT_LINES = 3;

/**
 * Babel plugin set matching what `react-scripts` (babel-preset-react-app) accepts, so this script
 * never rejects a file that the real build would have compiled.
 */
const PARSER_OPTIONS = {
  sourceType: 'unambiguous',
  allowReturnOutsideFunction: true,
  errorRecovery: false,
  plugins: [
    'jsx',
    'classProperties',
    'classPrivateProperties',
    'classPrivateMethods',
    'objectRestSpread',
    'optionalChaining',
    'nullishCoalescingOperator',
    'dynamicImport',
    'topLevelAwait',
    'numericSeparator',
    'logicalAssignment',
  ],
};

function collectSourceFiles(root) {
  const found = [];

  function walk(directory) {
    let entries;
    try {
      entries = fs.readdirSync(directory, { withFileTypes: true });
    } catch (error) {
      return;
    }

    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        if (!IGNORED_DIRECTORIES.has(entry.name)) {
          walk(absolute);
        }
      } else if (EXTENSIONS.has(path.extname(entry.name))) {
        found.push(absolute);
      }
    }
  }

  walk(root);
  return found;
}

/**
 * Renders the lines around a failure with a caret under the reported column, so that an
 * "Unterminated JSX contents" error -- which Babel always reports at end-of-file -- at least shows
 * what the parser was looking at when it gave up.
 */
function renderExcerpt(source, line, column) {
  const lines = source.split('\n');
  const first = Math.max(1, line - CONTEXT_LINES);
  const last = Math.min(lines.length, line + CONTEXT_LINES);
  const gutterWidth = String(last).length;
  const rendered = [];

  for (let number = first; number <= last; number += 1) {
    const marker = number === line ? '>' : ' ';
    const gutter = String(number).padStart(gutterWidth, ' ');
    rendered.push(`   ${marker} ${gutter} | ${lines[number - 1]}`);
    if (number === line && typeof column === 'number') {
      rendered.push(`     ${' '.repeat(gutterWidth)} | ${' '.repeat(column)}^`);
    }
  }

  return rendered.join('\n');
}

function main() {
  const projectRoot = path.resolve(__dirname, '..');
  const targets = process.argv.slice(2);
  const roots = (targets.length > 0 ? targets : ['src']).map((target) =>
    path.resolve(projectRoot, target)
  );

  const files = roots.flatMap(collectSourceFiles);

  if (files.length === 0) {
    console.error(
      `check-syntax: no source files found under ${roots
        .map((root) => path.relative(projectRoot, root))
        .join(', ')}. Refusing to report success on an empty scan.`
    );
    process.exit(2);
  }

  const failures = [];

  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');
    try {
      parser.parse(source, { ...PARSER_OPTIONS, sourceFilename: file });
    } catch (error) {
      failures.push({
        file: path.relative(projectRoot, file),
        message: error.message,
        loc: error.loc,
        source,
      });
    }
  }

  if (failures.length === 0) {
    console.log(`check-syntax: ${files.length} file(s) parsed cleanly.`);
    return;
  }

  console.error(
    `\ncheck-syntax: ${failures.length} of ${files.length} file(s) failed to parse.\n`
  );

  for (const failure of failures) {
    console.error(`  ${failure.file}`);
    console.error(`    ${failure.message}`);
    if (failure.loc) {
      console.error(renderExcerpt(failure.source, failure.loc.line, failure.loc.column));
    }
    console.error('');
  }

  console.error(
    'A file that does not parse produces no bundle, so `npm run build` fails and no\n' +
      'deployment is possible. Fix the errors above before pushing.\n'
  );

  process.exit(1);
}

main();
