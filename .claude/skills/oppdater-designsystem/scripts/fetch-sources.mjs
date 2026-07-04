#!/usr/bin/env node
// Steg 6a i oppdater-designsystem: arkiver nøkkelartefakter for en publisert versjon
// under designsystem/versions/sources/v{versjon}/ og oppdater designsystem/.oppdater-state.json.
// Bruk: node fetch-sources.mjs <versjon>   (f.eks. node fetch-sources.mjs 0.41.0)
//
// Arkiverer HELE upstream-filer uendret (aldri redigerte utdrag): package.json,
// custom-elements.json, web-types.json, ai-tooling/SKILL.md (de som finnes)
// + tarball-files.txt (fillisten).
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync, rmSync, mkdtempSync, readdirSync, statSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { designsystemDir, statePath, currentVersionInfo, fetchJson } from './lib.mjs';

const version = process.argv[2];
if (!/^\d+\.\d+\.\d+$/.test(version ?? '')) {
  console.error('Bruk: node fetch-sources.mjs <versjon>  (f.eks. 0.41.0)');
  process.exit(1);
}

const pkg = currentVersionInfo().package;
const meta = await fetchJson(`https://registry.npmjs.org/${pkg}/${version}`);
const { tarball, integrity } = meta.dist;

// Last ned og pakk ut tarballen i en temp-mappe.
const tmp = mkdtempSync(path.join(tmpdir(), 'fhi-ds-sources-'));
try {
  const tgz = path.join(tmp, 'package.tgz');
  const res = await fetch(tarball);
  if (!res.ok) throw new Error(`Nedlasting av tarball feilet: HTTP ${res.status}`);
  writeFileSync(tgz, Buffer.from(await res.arrayBuffer()));
  // Relativ sti + cwd: GNU tar (Git Bash) tolker "C:\..." som remote host.
  execSync('tar -xzf package.tgz', { cwd: tmp, stdio: 'inherit' }); // tar finnes på Windows 10+, macOS og Linux
  const pkgDir = path.join(tmp, 'package');

  const destDir = path.join(designsystemDir, 'versions', 'sources', `v${version}`);
  mkdirSync(destDir, { recursive: true });

  // ai-tooling/SKILL.md er obligatorisk kildeinput (se kildelesing.md) — arkiveres
  // med undermappe bevart slik at senere oppdateringer kan diffes lokalt.
  const wanted = ['package.json', 'custom-elements.json', 'web-types.json', 'ai-tooling/SKILL.md'];
  const archived = [];
  for (const name of wanted) {
    const src = path.join(pkgDir, name);
    if (existsSync(src)) {
      const dest = path.join(destDir, name);
      mkdirSync(path.dirname(dest), { recursive: true });
      copyFileSync(src, dest);
      archived.push(name);
    }
  }

  // Full filliste fra tarballen — fasit for entrypoints/artefakter.
  const files = [];
  (function walk(dir) {
    for (const name of readdirSync(dir)) {
      const p = path.join(dir, name);
      if (statSync(p).isDirectory()) walk(p);
      else files.push(path.relative(pkgDir, p).replaceAll('\\', '/'));
    }
  })(pkgDir);
  writeFileSync(path.join(destDir, 'tarball-files.txt'), files.sort().join('\n') + '\n');
  archived.push('tarball-files.txt');

  // Oppdater state-filen (bevar ukjente felt).
  const state = existsSync(statePath) ? JSON.parse(readFileSync(statePath, 'utf8')) : {};
  Object.assign(state, {
    package: pkg,
    version,
    gitTag: `v${version}`,
    tarballUrl: tarball,
    distIntegrity: integrity,
    verifiedDate: new Date().toISOString().slice(0, 10),
    archivedArtifacts: archived,
  });
  writeFileSync(statePath, JSON.stringify(state, null, 2) + '\n');

  console.log(JSON.stringify({ version, destDir: path.relative(process.cwd(), destDir), archived, statePath: path.relative(process.cwd(), statePath) }, null, 2));
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
