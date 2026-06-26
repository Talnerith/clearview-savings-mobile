#!/usr/bin/env bash
# Print everything a fresh Claude Code session needs to re-anchor on this
# project, in reading order. Pipe to clipboard or paste into a new session.
#
# Usage:
#   scripts/re-anchor.sh           # auto-detect newest milestone
#   scripts/re-anchor.sh 2         # force milestone 2
#
# Output sections, in order:
#   1. CLAUDE.md
#   2. Active milestone spec (docs/specs/M{N}.md)
#   3. Active milestone plan (docs/milestones/M{N}.md)
#   4. Current handoff (docs/milestones/M{N}-progress.md)
#   5. Durable memory index (memory/MEMORY.md)
#   6. Last 10 commits with hashes
#   7. Git branch + status

set -euo pipefail

# Resolve repo root from script location so the script works from any cwd.
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# --- Pick milestone number ---------------------------------------------------
# Explicit arg wins. Otherwise, take the highest M{N} across specs/ and
# milestones/ by number (not mtime — file dates are noisy on Windows checkouts).
pick_milestone() {
  if [[ $# -ge 1 && -n "${1:-}" ]]; then
    echo "$1"
    return
  fi

  local highest=0 n
  for f in docs/specs/M*.md docs/milestones/M*.md; do
    [[ -e "$f" ]] || continue
    n="$(basename "$f" | sed -n 's/^M\([0-9]\+\).*\.md$/\1/p')"
    [[ -n "$n" && "$n" -gt "$highest" ]] && highest="$n"
  done

  if [[ "$highest" -eq 0 ]]; then
    echo "ERROR: no milestone docs found in docs/specs/ or docs/milestones/" >&2
    exit 1
  fi
  echo "$highest"
}

MILESTONE="$(pick_milestone "${1:-}")"
SPEC="docs/specs/M${MILESTONE}.md"
PLAN="docs/milestones/M${MILESTONE}.md"
PROGRESS="docs/milestones/M${MILESTONE}-progress.md"

# --- Section helper ----------------------------------------------------------
section() {
  local title="$1" path="$2"
  echo
  echo "================================================================"
  echo "== $title"
  if [[ -n "$path" ]]; then
    echo "== $path"
  fi
  echo "================================================================"
  echo
}

dump() {
  if [[ -f "$1" ]]; then cat "$1"; else echo "(missing: $1)"; fi
}

section "CLAUDE.md (project rules)" "CLAUDE.md"
dump CLAUDE.md

section "Milestone ${MILESTONE} spec (frozen pre-flight contract)" "$SPEC"
if [[ -f "$SPEC" ]]; then
  cat "$SPEC"
else
  echo "(no spec for M${MILESTONE} — not written yet, or predates the convention)"
fi

section "Milestone ${MILESTONE} plan (implementation)" "$PLAN"
dump "$PLAN"

section "Milestone ${MILESTONE} progress (current handoff)" "$PROGRESS"
if [[ -f "$PROGRESS" ]]; then
  cat "$PROGRESS"
else
  echo "(no progress doc for M${MILESTONE} — either not started or already complete)"
fi

section "Durable memory index" "memory/MEMORY.md"
dump memory/MEMORY.md

section "Last 10 commits" ""
if git rev-parse --git-dir >/dev/null 2>&1; then
  git log -n 10 --pretty=format:'%h  %ad  %s' --date=short || echo "(no commits yet)"
  echo
else
  echo "(not a git repo)"
fi

section "Git branch + status" ""
if git rev-parse --git-dir >/dev/null 2>&1; then
  echo "Branch: $(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo '(none)')"
  echo
  git status --short --branch
else
  echo "(not a git repo)"
fi
