#!/usr/bin/env bash
# Samlet invariant-sjekk for skybert-skillen og oppdater-skybert-skillen.
# Én definisjon av «gyldig» — kjøres lokalt før PR og i CI.
# Kjøres fra repo-rot: bash .github/scripts/validate.sh
#
# Sjekker:
#   1. .claude/skills og .agents/skills er identiske (speilingsregel fra CLAUDE.md)
#   2. plugins/skybert/skills/skybert/SKILL.md har ingen state-HTML-kommentar (state bor KUN i .oppdater-state.json)
#   3. maintenance/skybert/.oppdater-state.json er gyldig JSON med påkrevde felter for sitt schema
#   4. Statiske kopier i plugins/skybert/skills/skybert/references/skybertapp/ finnes
#   5. Relative referanselenker i plugins/skybert/skills/skybert/SKILL.md peker på eksisterende filer
set -uo pipefail

FEIL=0
feil() { echo "FEIL: $*" >&2; FEIL=1; }
ok()   { echo "OK:   $*"; }

if [ ! -d ".claude/skills" ] || [ ! -d "plugins/skybert/skills/skybert" ]; then
  echo "FEIL: kjør fra repo-rot" >&2
  exit 1
fi

PY="$(command -v python3 || command -v python || true)"
if [ -z "$PY" ]; then
  echo "FEIL: python/python3 kreves for JSON-sjekkene" >&2
  exit 1
fi

# 1. Speiling
if diff -r .claude/skills .agents/skills > /dev/null 2>&1; then
  ok ".claude/skills == .agents/skills"
else
  feil ".claude/skills og .agents/skills divergerer — kjør scripts/sync-agents.sh"
  diff -rq .claude/skills .agents/skills >&2 || true
fi

# 2. Ingen state-kommentar i plugins/skybert/skills/skybert/SKILL.md
if grep -qE '<!-- *(Oppdater-skybert-state|Kilde-hash)' plugins/skybert/skills/skybert/SKILL.md; then
  feil "plugins/skybert/skills/skybert/SKILL.md inneholder en state-HTML-kommentar — state skal kun bo i maintenance/skybert/.oppdater-state.json"
else
  ok "ingen state-kommentar i plugins/skybert/skills/skybert/SKILL.md"
fi

# 3. State-fil: gyldig JSON + schema-felter
"$PY" - <<'EOF' || FEIL=1
import json, sys
try:
    with open("maintenance/skybert/.oppdater-state.json", encoding="utf-8") as f:
        s = json.load(f)
except Exception as e:
    print(f"FEIL: maintenance/skybert/.oppdater-state.json kan ikke parses: {e}", file=sys.stderr); sys.exit(1)

problemer = []
sv = s.get("schemaVersion")
if sv not in (2, 3):
    problemer.append(f"ukjent schemaVersion: {sv}")
if "updatedAt" not in s:
    problemer.append("mangler updatedAt")
if s.get("mode") not in ("github", "webscraping"):
    problemer.append(f"ugyldig mode: {s.get('mode')}")
if s.get("mode") == "github" and "github" not in s:
    problemer.append("mode=github men github-felt mangler")
if s.get("mode") == "webscraping" and "webscraping" not in s:
    problemer.append("mode=webscraping men webscraping-felt mangler")
if sv == 3:
    if "lastFullscanDate" not in s:
        problemer.append("schemaVersion 3 krever lastFullscanDate")
    for i, it in enumerate(s.get("openItems", [])):
        for felt in ("id", "status", "category", "summary", "firstSeen"):
            if felt not in it:
                problemer.append(f"openItems[{i}] mangler {felt}")
        if it.get("status") not in ("deferred", "partial", "failed-verification"):
            problemer.append(f"openItems[{i}] har ugyldig status: {it.get('status')}")
if problemer:
    for p in problemer:
        print(f"FEIL: .oppdater-state.json: {p}", file=sys.stderr)
    sys.exit(1)
print(f"OK:   maintenance/skybert/.oppdater-state.json gyldig (schemaVersion {sv})")
EOF

# 4. Statiske kopier finnes
for f in xrd.yaml composition.yaml functions.yaml; do
  if [ -f "plugins/skybert/skills/skybert/references/skybertapp/$f" ]; then
    ok "statisk kopi finnes: references/skybertapp/$f"
  else
    feil "statisk kopi mangler: plugins/skybert/skills/skybert/references/skybertapp/$f"
  fi
done

# 5. Relative lenker i plugins/skybert/skills/skybert/SKILL.md peker på eksisterende filer
while IFS= read -r lenke; do
  if [ ! -f "plugins/skybert/skills/skybert/$lenke" ]; then
    feil "plugins/skybert/skills/skybert/SKILL.md lenker til ikke-eksisterende fil: $lenke"
  fi
done < <(grep -oE '\]\((references/[^)#]+)' plugins/skybert/skills/skybert/SKILL.md | sed 's/^](//' | sort -u)
ok "relative lenker i plugins/skybert/skills/skybert/SKILL.md sjekket"

if [ "$FEIL" -ne 0 ]; then
  echo "validate: FEILET" >&2
  exit 1
fi
echo "validate: alle sjekker OK"
