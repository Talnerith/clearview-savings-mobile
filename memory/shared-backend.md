---
name: shared-backend
description: Mobile app uses the same Supabase project as the web app; RLS is the security boundary
metadata:
  type: project
---

The mobile app talks to the **same Supabase project** as the web app
(`../clearview-savings`). Same Auth users, same Postgres, same Row-Level
Security policies. Point `EXPO_PUBLIC_SUPABASE_URL` /
`EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` at the web app's `NEXT_PUBLIC_*` values.

**Why:** "Same backend" was a hard requirement. Reusing Supabase + RLS directly
(rather than a new REST/BFF layer) means security is inherited, not re-authored,
and there is one source of truth.

**How to apply:** Only the publishable (anon-tier) key ships in the bundle —
never the secret/service key. Every read is RLS-scoped; never trust an id from
the client. Row types in `lib/queries.ts` must stay in sync with the web Drizzle
schema (`../clearview-savings/lib/db/schema.ts`). Balance-affecting writes stay
in the web app — see [[re-anchor-workflow]] and ADR 0001.
