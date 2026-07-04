#!/usr/bin/env node
// Steg 1 i oppdater-designsystem: sammenlign skillens versjon med siste publiserte
// versjon på npm, og list mellomliggende minor-versjoner (pre-releases filtrert bort).
// Output: JSON på stdout. Exit 0 også når skillen er utdatert — `upToDate` avgjør.
import { currentVersionInfo, semverCmp, minorKey, minorCmp, fetchJson } from './lib.mjs';

const cur = currentVersionInfo();

// Abbreviated registry-metadata er mye mindre enn full metadata og unngår trunkeringsproblemer.
const meta = await fetchJson(
  `https://registry.npmjs.org/${cur.package}`,
  { accept: 'application/vnd.npm.install-v1+json' },
);

const latest = meta['dist-tags']?.latest;
if (!latest) throw new Error(`Fant ikke dist-tags.latest for ${cur.package}`);

const stable = Object.keys(meta.versions ?? {}).filter((v) => !v.includes('-'));

// Høyeste patch per minor.
const highestPatchByMinor = new Map();
for (const v of stable) {
  const k = minorKey(v);
  const prev = highestPatchByMinor.get(k);
  if (!prev || semverCmp(v, prev) > 0) highestPatchByMinor.set(k, v);
}

const curMinor = minorKey(cur.version);
const latestMinor = minorKey(latest);
const intermediateMinors = [...highestPatchByMinor.keys()]
  .filter((k) => minorCmp(k, curMinor) > 0 && minorCmp(k, latestMinor) < 0)
  .sort(minorCmp)
  .map((k) => ({ minor: k, highestPatch: highestPatchByMinor.get(k) }));

const tagName = `v${latest}`;
const tagUrl = `https://github.com/FHIDev/Fhi.Designsystem/releases/tag/${tagName}`;
let tagExists = null; // null = kunne ikke sjekkes (nettverk); verifiser manuelt
try {
  const res = await fetch(tagUrl, { method: 'HEAD', redirect: 'follow' });
  tagExists = res.ok;
} catch {
  tagExists = null;
}

const dist = meta.versions?.[latest]?.dist ?? null;

console.log(JSON.stringify({
  package: cur.package,
  currentVersion: cur.version,
  currentVersionSource: cur.source,
  latestVersion: latest,
  upToDate: cur.version === latest,
  intermediateMinors,
  tag: { name: tagName, url: tagUrl, exists: tagExists },
  dist: dist ? { tarball: dist.tarball, integrity: dist.integrity } : null,
}, null, 2));
