---
name: re-anchor-workflow
description: How to resume work across sessions on this project
metadata:
  type: reference
---

To resume work in a fresh session, run `scripts/re-anchor.sh` (or
`pwsh scripts/re-anchor.ps1` on Windows). It prints, in reading order:
CLAUDE.md → active milestone spec → plan → progress/handoff → memory index →
last 10 commits → git status.

**Why:** A deliberate, edited handoff doc beats a resumed transcript (which
carries mistakes and bloat). The progress doc, not the conversation, is the
entry point for the next session.

**How to apply:** When the user signals end of session mid-milestone, offer to
update `docs/milestones/M{N}-progress.md` before they exit (Done / In progress /
Not started / Decisions / Known issues / Exact next step). When starting fresh,
read the chain above, confirm the progress doc matches the actual files, then
wait for "go" before writing code. Specs are frozen once coding starts; record
deviations in the plan or an ADR, never by editing the spec. See
[[shared-backend]].
