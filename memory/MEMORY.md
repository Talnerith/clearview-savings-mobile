# Project memory — Clearview Savings Mobile

Durable, cross-session facts that are NOT specific to a single milestone. One
line per memory; the file it points to holds the detail. Milestone-specific
state lives in `docs/milestones/M{N}-progress.md`, not here.

- [Shared backend](shared-backend.md) — same Supabase project as the web app; RLS is the boundary; publishable key only
- [Re-anchor workflow](re-anchor-workflow.md) — how to resume across sessions; run scripts/re-anchor
