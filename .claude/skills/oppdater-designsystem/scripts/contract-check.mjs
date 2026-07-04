#!/usr/bin/env node
// Steg 8a i oppdater-designsystem: mekaniske contract checks for designsystem-skillen.
// Bruk: node contract-check.mjs [--online]
//   offline (default): versjonskonsistens, lenkevalidering, INDEX-regler,
//                      FEATURES-skjema, .claude↔.agents-diff
//   --online:          i tillegg tarball-baserte sjekker (komponenter, ikoner, theme)
// Exit 1 hvis én eller flere sjekker feiler.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { repoRoot, designsystemDir, statePath, currentVersionInfo, semverCmp } from './lib.mjs';

const online = process.argv.includes('--online');
const errors = [];
const warnings = [];
const ok = [];

function err(msg) { errors.push(msg); }
function warn(msg) { warnings.push(msg); }
function pass(msg) { ok.push(msg); }

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

// ---------------------------------------------------------------- versjonskonsistens
const skillMd = readFileSync(path.join(designsystemDir, 'SKILL.md'), 'utf8');
const basertPaa = skillMd.match(/<!--\s*Basert på\s+@?\S+?\s+v(\d+\.\d+\.\d+)\s*-->/)?.[1];
const verifisertMot = skillMd.match(/Verifisert mot:\*\*\s*`[^`]*@(\d+\.\d+\.\d+)`/)?.[1];
const indexMd = readFileSync(path.join(designsystemDir, 'versions', 'INDEX.md'), 'utf8');
const indexBaseline = indexMd.match(/latest v(\d+\.\d+\.\d+)/)?.[1];
const indexLatestMinor = indexMd.match(/^\|\s*(\d+\.\d+)\.x\s*\|\s*Latest\s*\|/m)?.[1];
const stateVersion = existsSync(statePath)
  ? JSON.parse(readFileSync(statePath, 'utf8')).version
  : null;

if (!basertPaa) err('SKILL.md: fant ikke "<!-- Basert på ... -->"-kommentaren');
if (!verifisertMot) err('SKILL.md: fant ikke "Verifisert mot:"-feltet');
if (basertPaa && verifisertMot && basertPaa !== verifisertMot) {
  err(`Versjonsavvik: Basert på v${basertPaa} ≠ Verifisert mot ${verifisertMot}`);
}
if (basertPaa && indexBaseline && basertPaa !== indexBaseline) {
  err(`Versjonsavvik: SKILL.md v${basertPaa} ≠ INDEX-baseline v${indexBaseline}`);
}
if (basertPaa && indexLatestMinor && !basertPaa.startsWith(`${indexLatestMinor}.`)) {
  err(`Versjonsavvik: SKILL.md v${basertPaa} matcher ikke INDEX Latest-rad ${indexLatestMinor}.x`);
}
if (stateVersion && basertPaa && stateVersion !== basertPaa) {
  err(`Versjonsavvik: .oppdater-state.json v${stateVersion} ≠ SKILL.md v${basertPaa}`);
}
if (!stateVersion) warn('designsystem/.oppdater-state.json mangler (opprettes av fetch-sources.mjs)');
if (errors.length === 0) pass(`Versjonskonsistens: v${basertPaa}`);

// ---------------------------------------------------------------- relative lenker
// versions/sources/ er arkiverte upstream-filer — deres interne lenker valideres ikke.
const sourcesDir = path.join(designsystemDir, 'versions', 'sources') + path.sep;
const mdFiles = walk(designsystemDir).filter((f) => f.endsWith('.md') && !f.startsWith(sourcesDir));
let brokenLinks = 0;
for (const file of mdFiles) {
  const text = readFileSync(file, 'utf8');
  for (const m of text.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) {
    const target = m[1];
    if (/^(https?:|mailto:|#)/.test(target)) continue;
    const resolved = path.resolve(path.dirname(file), target.split('#')[0]);
    if (!existsSync(resolved)) {
      err(`Brutt lenke i ${path.relative(repoRoot, file)}: ${target}`);
      brokenLinks++;
    }
  }
}
if (brokenLinks === 0) pass(`Relative lenker: alle ${mdFiles.length} md-filer OK`);

// ---------------------------------------------------------------- INDEX-regler
const rows = [...indexMd.matchAll(/^\|\s*(\d+\.\d+)\.x\s*\|\s*(Latest|Supported)\s*\|[^|]*\|\s*([^|]*)\|/gm)]
  .map((m) => ({ minor: m[1], status: m[2], deltaCell: m[3].trim() }));
if (rows.length === 0) {
  err('INDEX.md: fant ingen versjonsrader');
} else {
  if (rows.length > 10) err(`INDEX.md: ${rows.length} rader (Latest+Supported) — maks 10`);
  const latestRows = rows.filter((r) => r.status === 'Latest');
  if (latestRows.length !== 1) err(`INDEX.md: ${latestRows.length} Latest-rader — skal være nøyaktig 1`);
  const minors = rows.map((r) => `${r.minor}.0`);
  for (let i = 1; i < minors.length; i++) {
    if (semverCmp(minors[i - 1], minors[i]) <= 0) {
      err(`INDEX.md: radene er ikke sortert synkende (${rows[i - 1].minor}.x etterfulgt av ${rows[i].minor}.x)`);
    }
  }
  const seen = new Set();
  for (const r of rows) {
    if (seen.has(r.minor)) err(`INDEX.md: duplikat versjon ${r.minor}.x`);
    seen.add(r.minor);
    const link = r.deltaCell.match(/\(([^)]+\.md)\)/)?.[1];
    if (r.status === 'Supported' && !link) err(`INDEX.md: Supported-rad ${r.minor}.x mangler delta-fil-lenke`);
    if (link && !existsSync(path.join(designsystemDir, 'versions', link))) {
      err(`INDEX.md: delta-fil ${link} finnes ikke`);
    }
  }
  if (errors.every((e) => !e.startsWith('INDEX.md'))) pass(`INDEX.md: ${rows.length} rader, sortert, alle delta-filer finnes`);
}

// ---------------------------------------------------------------- FEATURES.md
const featuresPath = path.join(designsystemDir, 'versions', 'FEATURES.md');
if (!existsSync(featuresPath)) {
  warn('versions/FEATURES.md mangler');
} else {
  const features = readFileSync(featuresPath, 'utf8');
  if (!/\|\s*Feature\s*\|\s*Introduced\s*\|\s*Type\s*\|\s*Scope\s*\|\s*Source\s*\|/.test(features)) {
    err('FEATURES.md: mangler påkrevde kolonner (Feature | Introduced | Type | Scope | Source)');
  } else if (!/[Dd]ekningsgrense/.test(features)) {
    err('FEATURES.md: mangler eksplisitt dekningsgrense-deklarasjon');
  } else {
    // Datarader (etter header + separator): Introduced skal være et semver-nummer.
    const lines = features.split('\n');
    const headerIdx = lines.findIndex((l) => /\|\s*Feature\s*\|\s*Introduced\s*\|/.test(l));
    let badRows = 0;
    for (const line of lines.slice(headerIdx + 2)) {
      if (!line.trim().startsWith('|')) continue;
      const cells = line.split('|').map((c) => c.trim());
      // cells[0] er tom (før første |); Feature=1, Introduced=2
      if (!/^\d+\.\d+(\.\d+)?$/.test(cells[2] ?? '')) {
        err(`FEATURES.md: rad uten gyldig Introduced-versjon: ${line.trim()}`);
        badRows++;
      }
    }
    if (badRows === 0) pass('FEATURES.md: skjema, dekningsgrense og rader OK');
  }
}

// ---------------------------------------------------------------- .claude ↔ .agents
function treeMap(root) {
  const map = new Map();
  if (!existsSync(root)) return map;
  for (const f of walk(root)) map.set(path.relative(root, f), readFileSync(f, 'utf8'));
  return map;
}
const claudeTree = treeMap(path.join(repoRoot, '.claude', 'skills'));
const agentsTree = treeMap(path.join(repoRoot, '.agents', 'skills'));
let syncDiffs = 0;
for (const [rel, content] of claudeTree) {
  if (!agentsTree.has(rel)) { err(`.agents/skills mangler ${rel}`); syncDiffs++; }
  else if (agentsTree.get(rel) !== content) { err(`.claude/.agents divergerer: ${rel}`); syncDiffs++; }
}
for (const rel of agentsTree.keys()) {
  if (!claudeTree.has(rel)) { err(`.agents/skills har ekstra fil ${rel}`); syncDiffs++; }
}
if (syncDiffs === 0) pass(`.claude/skills ↔ .agents/skills: identiske (${claudeTree.size} filer)`);

// ---------------------------------------------------------------- online-sjekker
if (online) {
  const cur = currentVersionInfo();
  let files = null;
  try {
    const json = execSync(`npm pack ${cur.package}@${cur.version} --dry-run --json`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    files = JSON.parse(json)[0].files.map((f) => f.path);
  } catch (e) {
    err(`--online: npm pack feilet (${e.message.split('\n')[0]}) — kjør manuelle kommandoer i kontraktsjekker.md`);
  }

  if (files) {
    // Theme-fil
    if (files.includes('theme/default.css')) pass('Tarball: theme/default.css finnes');
    else err('Tarball: theme/default.css mangler i publisert pakke');

    // Komponent-entrypoints vs komponenttabellen i SKILL.md
    const tableComponents = new Set(
      [...skillMd.matchAll(/\[`(fhi-[a-z0-9-]+)`\]\(references\/components\//g)].map((m) => m[1]),
    );
    const pkgComponents = new Set(
      files
        .filter((f) => /^fhi-[a-z0-9-]+\.js$/.test(f) && !f.startsWith('fhi-icon-'))
        .map((f) => f.replace(/\.js$/, '')),
    );
    for (const c of tableComponents) {
      if (!pkgComponents.has(c)) err(`Komponenttabellen har ${c}, men pakken mangler entrypoint ${c}.js`);
    }
    for (const c of pkgComponents) {
      if (!tableComponents.has(c)) warn(`Pakken har entrypoint ${c}.js som ikke står i komponenttabellen i SKILL.md`);
    }
    if ([...tableComponents].every((c) => pkgComponents.has(c))) {
      pass(`Komponenttabellen: alle ${tableComponents.size} komponenter har entrypoint i pakken`);
    }

    // Ikonliste i icon-usage.md vs ikon-entrypoints
    const iconMd = readFileSync(path.join(designsystemDir, 'references', 'icon-usage.md'), 'utf8');
    const iconSection = iconMd.split(/^## Tilgjengelige ikoner/m)[1] ?? '';
    const docIcons = new Set(
      [...iconSection.matchAll(/`([a-z0-9]+(?:-[a-z0-9]+)*)`/g)].map((m) => m[1]),
    );
    const pkgIcons = new Set(
      files.filter((f) => /^fhi-icon-[a-z0-9-]+\.js$/.test(f)).map((f) => f.replace(/^fhi-icon-|\.js$/g, '')),
    );
    for (const i of docIcons) {
      if (!pkgIcons.has(i)) err(`icon-usage.md lister ikonet "${i}" som ikke finnes i pakken`);
    }
    for (const i of pkgIcons) {
      if (!docIcons.has(i)) warn(`Pakken har ikonet "${i}" som ikke er listet i icon-usage.md`);
    }
    if ([...docIcons].every((i) => pkgIcons.has(i))) {
      pass(`Ikonlisten: alle ${docIcons.size} dokumenterte ikoner finnes i pakken (pakken har ${pkgIcons.size})`);
    }
  }
} else {
  warn('Online-sjekker hoppet over (kjør med --online for tarball-baserte sjekker)');
}

// ---------------------------------------------------------------- rapport
for (const msg of ok) console.log(`OK    ${msg}`);
for (const msg of warnings) console.log(`WARN  ${msg}`);
for (const msg of errors) console.log(`FEIL  ${msg}`);
console.log(`\n${ok.length} OK, ${warnings.length} advarsler, ${errors.length} feil`);
process.exit(errors.length > 0 ? 1 : 0);
