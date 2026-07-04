#!/usr/bin/env bash
# Speiler .claude/skills/ -> .agents/skills/ (kompatibilitetskopi for Codex, se CLAUDE.md)
# og verifiserer at trærne er identiske etterpå.
# Kjøres fra repo-rot: bash .claude/skills/oppdater-skybert/scripts/sync-agents.sh
set -euo pipefail

if [ ! -d ".claude/skills" ]; then
  echo "FEIL: kjør fra repo-rot (fant ikke .claude/skills)" >&2
  exit 1
fi

rm -rf .agents/skills
mkdir -p .agents
cp -r .claude/skills .agents/skills

if diff -r .claude/skills .agents/skills > /dev/null; then
  echo "OK: .agents/skills er identisk med .claude/skills"
else
  echo "FEIL: trærne divergerer fortsatt etter kopiering" >&2
  diff -r .claude/skills .agents/skills >&2 || true
  exit 1
fi
