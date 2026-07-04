// Delte hjelpefunksjoner for oppdater-designsystem-scriptene.
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Scriptene ligger i .claude/skills/oppdater-designsystem/scripts/ → roten er 4 nivåer opp.
export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
export const designsystemDir = path.join(repoRoot, 'designsystem');
export const statePath = path.join(designsystemDir, '.oppdater-state.json');

/**
 * Gjeldende pakke + versjon. .oppdater-state.json er autoritativ;
 * `<!-- Basert på ... -->`-kommentaren i SKILL.md er fallback.
 */
export function currentVersionInfo() {
  if (existsSync(statePath)) {
    const s = JSON.parse(readFileSync(statePath, 'utf8'));
    if (s.package && s.version) return { package: s.package, version: s.version, source: 'state-file' };
  }
  const skill = readFileSync(path.join(designsystemDir, 'SKILL.md'), 'utf8');
  const m = skill.match(/<!--\s*Basert på\s+(@?\S+?)\s+v(\d+\.\d+\.\d+)\s*-->/);
  if (m) return { package: m[1], version: m[2], source: 'skill-comment' };
  throw new Error('Fant ikke gjeldende versjon: verken designsystem/.oppdater-state.json eller "<!-- Basert på ... -->" i designsystem/SKILL.md.');
}

export function semverCmp(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pa[i] ?? 0) - (pb[i] ?? 0);
  }
  return 0;
}

export function minorKey(v) {
  const [maj, min] = v.split('.');
  return `${maj}.${min}`;
}

export function minorCmp(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  return pa[0] - pb[0] || pa[1] - pb[1];
}

export async function fetchJson(url, headers = {}) {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`${url} svarte HTTP ${res.status}`);
  return res.json();
}
