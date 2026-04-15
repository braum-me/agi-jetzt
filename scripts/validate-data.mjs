#!/usr/bin/env node
/**
 * agi.jetzt — Data-Integrity-Validator
 *
 * Läuft in CI bei jedem PR. Prüft:
 *  - Alle JSONs parsen sauber (kein Trailing-Komma, keine kaputte Syntax)
 *  - Dashboard-Files haben Pflicht-Felder (stand, source/source_url)
 *  - Bekannte 0–100-Werte liegen im Range (Proximity-Scores, Country-Metrics, Pillars)
 *  - Keine negativen Counts (MAU, Papers, Investments)
 *  - Delta-Check gegen vorherigen Commit: >30% Q/Q wird als Warning markiert
 *  - Frontmatter in Briefing-Markdowns hat Pflicht-Felder
 *
 * Exit-Codes:
 *   0 = OK (mit evtl. Warnings)
 *   1 = Errors → PR-Merge blockiert
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const errors = [];
const warnings = [];

/* ─────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────── */
const err = (msg) => errors.push(msg);
const warn = (msg) => warnings.push(msg);

function readJson(filepath) {
  try {
    return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
  } catch (e) {
    err(`${path.relative(ROOT, filepath)}: parse error — ${e.message}`);
    return null;
  }
}

function listFiles(dir, extFilter) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((f) => !extFilter || f.endsWith(extFilter))
    .map((f) => path.join(dir, f));
}

function previousVersion(relPath) {
  // Git show HEAD~1:path — für Delta-Check. Bei initialem Commit oder fehlender Version → null.
  try {
    return execSync(`git show HEAD~1:${relPath}`, { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString();
  } catch {
    return null;
  }
}

function walk(node, pathStr, visitor) {
  visitor(pathStr, node);
  if (Array.isArray(node)) {
    node.forEach((v, i) => walk(v, `${pathStr}[${i}]`, visitor));
  } else if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) walk(v, `${pathStr}.${k}`, visitor);
  }
}

/* ─────────────────────────────────────────────────────────
   Rule 1 — Parse + Pflichtfelder pro Dashboard-File
───────────────────────────────────────────────────────── */
console.log('› Validate dashboard/*.json …');
// sources.json ist ein Meta-Index (Quellen-Katalog), hat `updated` statt `stand`
const DASHBOARD_META_FILES = new Set(['sources.json']);
const dashFiles = listFiles(path.join(ROOT, 'src/data/dashboard'), '.json');
for (const file of dashFiles) {
  const rel = path.relative(ROOT, file);
  const data = readJson(file);
  if (!data) continue;
  if (DASHBOARD_META_FILES.has(path.basename(file))) {
    if (!data.updated) warn(`${rel}: Meta-File ohne "updated"-Feld`);
    continue;
  }
  if (!data.stand) err(`${rel}: fehlt "stand"-Feld (z.B. "Q1 2026")`);
  if (!data.source && !data.sources) {
    warn(`${rel}: kein "source" oder "sources"-Feld — Quelle nachtragen`);
  }
}

/* ─────────────────────────────────────────────────────────
   Rule 2 — Numerische Range-Checks
───────────────────────────────────────────────────────── */
console.log('› Range-Checks …');

// 2a: Proximity-History: scores sollen 0–100 sein
const proxFile = path.join(ROOT, 'src/data/proximity-history.json');
if (fs.existsSync(proxFile)) {
  const p = readJson(proxFile);
  if (p?.history) {
    for (const entry of p.history) {
      if (entry.score === undefined || entry.score === null) {
        err(`proximity-history.json: entry ${entry.quarter} ohne score`);
      } else if (entry.score < 0 || entry.score > 100) {
        err(`proximity-history.json: entry ${entry.quarter} score=${entry.score} außerhalb 0-100`);
      }
    }
  }
}

// 2b: AGI-Progress: composite_score + dimension values → 0-100
const agiFile = path.join(ROOT, 'src/data/dashboard/agi-progress.json');
if (fs.existsSync(agiFile)) {
  const d = readJson(agiFile);
  if (d?.composite_score !== undefined && (d.composite_score < 0 || d.composite_score > 100)) {
    err(`agi-progress.json: composite_score=${d.composite_score} außerhalb 0-100`);
  }
  d?.dimensions?.forEach((dim) => {
    if (dim.value < 0 || dim.value > 100) {
      err(`agi-progress.json: dimension ${dim.label}=${dim.value} außerhalb 0-100`);
    }
  });
}

// 2c: Generic walk: alles was wie percentage aussieht prüfen
const PCT_FIELDS = /\.(score|pct|percent|percentage|overall|confidence)$/i;
for (const file of [...listFiles(path.join(ROOT, 'src/data'), '.json'), ...dashFiles]) {
  const data = readJson(file);
  if (!data) continue;
  const rel = path.relative(ROOT, file);
  walk(data, '', (p, v) => {
    if (typeof v !== 'number') return;
    if (!isFinite(v)) err(`${rel}${p}: non-finite number`);
    if (PCT_FIELDS.test(p) && (v < 0 || v > 100)) {
      err(`${rel}${p}: Prozentwert ${v} außerhalb 0-100`);
    }
  });
}

// 2d: Arrays die "counts" sein sollten (papers, hiring etc.) dürfen nicht negativ sein
const COUNT_FIELDS = /\.(counts|mau_m|values|rounds|total|headcount)(\[|$)/i;
for (const file of [...listFiles(path.join(ROOT, 'src/data'), '.json'), ...dashFiles]) {
  const data = readJson(file);
  if (!data) continue;
  const rel = path.relative(ROOT, file);
  walk(data, '', (p, v) => {
    if (typeof v !== 'number') return;
    if (COUNT_FIELDS.test(p) && v < 0) err(`${rel}${p}: negative count ${v}`);
  });
}

/* ─────────────────────────────────────────────────────────
   Rule 3 — Delta-Check gegen vorherigen Commit
   Flagt >30% Q/Q-Änderung auf numerischen Feldern als Warning.
───────────────────────────────────────────────────────── */
console.log('› Delta-Checks (vs. HEAD~1) …');
const DELTA_THRESHOLD = 0.30;

for (const file of [...listFiles(path.join(ROOT, 'src/data'), '.json'), ...dashFiles]) {
  const rel = path.relative(ROOT, file);
  const currentContent = readJson(file);
  const prevRaw = previousVersion(rel);
  if (!prevRaw || !currentContent) continue;
  let prev;
  try {
    prev = JSON.parse(prevRaw);
  } catch {
    continue;
  }

  // Flatten beide, vergleiche numeric values auf gleichem Key-Path
  const flatCur = {};
  const flatPrev = {};
  walk(currentContent, '', (p, v) => { if (typeof v === 'number') flatCur[p] = v; });
  walk(prev, '', (p, v) => { if (typeof v === 'number') flatPrev[p] = v; });

  for (const [p, curVal] of Object.entries(flatCur)) {
    const prevVal = flatPrev[p];
    if (prevVal === undefined || prevVal === 0) continue;
    const delta = Math.abs(curVal - prevVal) / Math.abs(prevVal);
    if (delta > DELTA_THRESHOLD) {
      warn(`${rel}${p}: Δ=${(delta * 100).toFixed(1)}% (${prevVal} → ${curVal}) — Quelle im PR-Body belegen`);
    }
  }
}

/* ─────────────────────────────────────────────────────────
   Rule 4 — Briefing-Frontmatter
───────────────────────────────────────────────────────── */
console.log('› Briefing-Frontmatter …');
const briefDir = path.join(ROOT, 'src/content/briefing');
const briefRequired = ['title', 'subtitle', 'date', 'kw', 'year', 'author', 'summary', 'topStory', 'statsHighlight', 'tags'];

for (const file of listFiles(briefDir, '.md')) {
  const rel = path.relative(ROOT, file);
  const raw = fs.readFileSync(file, 'utf-8');
  const fm = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!fm) {
    err(`${rel}: kein Frontmatter`);
    continue;
  }
  const yaml = fm[1];
  for (const field of briefRequired) {
    if (!new RegExp(`^${field}:`, 'm').test(yaml)) {
      err(`${rel}: Frontmatter-Feld "${field}" fehlt`);
    }
  }
  // Quellen-Heuristik: Body sollte mindestens 3 http-Links haben
  const body = raw.slice(fm[0].length);
  const linkCount = (body.match(/https?:\/\//g) || []).length;
  if (linkCount < 3) {
    warn(`${rel}: nur ${linkCount} Links im Body — Quellenpflicht unterlaufen?`);
  }
}

/* ─────────────────────────────────────────────────────────
   Report
───────────────────────────────────────────────────────── */
const line = '─'.repeat(60);
console.log(line);

if (warnings.length) {
  console.warn(`⚠  ${warnings.length} Warning${warnings.length === 1 ? '' : 's'}:`);
  warnings.forEach((w) => console.warn('   ·', w));
}

if (errors.length) {
  console.error(`✗ ${errors.length} Error${errors.length === 1 ? '' : 's'}:`);
  errors.forEach((e) => console.error('   ·', e));
  console.error(line);
  console.error('Validation FAILED. PR-Merge blockiert, bis Errors behoben sind.');
  process.exit(1);
}

console.log(`✓ Alle Data-Files validiert (${dashFiles.length} dashboard + ${listFiles(briefDir, '.md').length} briefings)`);
if (warnings.length) {
  console.log(`  ${warnings.length} Warning${warnings.length === 1 ? '' : 's'} — zur Info, blockieren nicht.`);
}
process.exit(0);
