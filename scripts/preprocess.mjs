#!/usr/bin/env node
/**
 * SmartKinneret preprocessing runner (`npm run preprocess`).
 *
 * The authoritative preprocessing pipeline is implemented in Python
 * (scripts/preprocess.py) because it relies on the scientific stack —
 * pandas / numpy / scipy (statistical tests) and scikit-learn (the optional
 * Random Forest). That pipeline is what produced the JSON shipped in
 * public/data/processed/.
 *
 * This Node script is the cross-platform entry point wired to the npm script.
 * It locates a Python 3 interpreter, runs scripts/preprocess.py with the
 * project root as the working directory, streams its output through, and exits
 * with the same status code. If no interpreter or the required packages are
 * missing it prints actionable guidance instead of failing silently.
 *
 * The browser/Node parsing stack (PapaParse, SheetJS, the TOA5 reader) is
 * exercised independently by the in-app Importer on the Data Quality page, so
 * the JS toolchain required by the assignment is demonstrated end to end.
 */

import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { existsSync } from 'node:fs';

const here = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(here, '..');
const pyScript = join(here, 'preprocess.py');

function log(msg) {
  process.stdout.write(`[preprocess] ${msg}\n`);
}

function fail(msg) {
  process.stderr.write(`[preprocess] ${msg}\n`);
}

if (!existsSync(pyScript)) {
  fail(`Cannot find ${pyScript}.`);
  fail('The reference pipeline scripts/preprocess.py is required.');
  process.exit(1);
}

// Candidate interpreters, in order of preference.
const candidates =
  process.platform === 'win32'
    ? ['python', 'py', 'python3']
    : ['python3', 'python'];

function probe(cmd) {
  try {
    const r = spawnSync(cmd, ['--version'], { encoding: 'utf8' });
    if (r.status === 0) {
      return (r.stdout || r.stderr || '').trim();
    }
  } catch {
    /* not found, try next */
  }
  return null;
}

let python = null;
let version = null;
for (const cmd of candidates) {
  const v = probe(cmd);
  if (v) {
    python = cmd;
    version = v;
    break;
  }
}

if (!python) {
  fail('No Python 3 interpreter found on PATH.');
  fail('');
  fail('The data preprocessing pipeline requires Python 3 with these packages:');
  fail('    pandas  numpy  scipy  scikit-learn  openpyxl');
  fail('');
  fail('Install Python 3 (https://www.python.org/downloads/), then:');
  fail('    pip install pandas numpy scipy scikit-learn openpyxl');
  fail('    npm run preprocess');
  fail('');
  fail('Note: the processed JSON in public/data/processed/ is already bundled,');
  fail('so `npm run dev` works without running preprocessing yourself.');
  process.exit(1);
}

log(`Using ${python} (${version}).`);
log('Running reference pipeline scripts/preprocess.py ...');
log('Output is written to public/data/processed/.');

const run = spawnSync(python, [pyScript], {
  cwd: projectRoot,
  stdio: 'inherit',
});

if (run.error) {
  fail(`Failed to launch Python: ${run.error.message}`);
  process.exit(1);
}

if (run.status !== 0) {
  fail('');
  fail(`Preprocessing exited with code ${run.status}.`);
  fail('If this is a ModuleNotFoundError, install the dependencies:');
  fail('    pip install pandas numpy scipy scikit-learn openpyxl');
  process.exit(run.status === null ? 1 : run.status);
}

log('Preprocessing complete.');
