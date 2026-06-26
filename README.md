# Clearview Savings — Mobile

Native mobile companion (iOS + Android) for
[Clearview Savings](../clearview-savings), built with Expo / React Native and
TypeScript. It runs against the **same Supabase backend** as the web app — same
Auth users, same Postgres, same Row-Level Security. There is no separate mobile
backend.

> Clearview Savings is a memory-care companion application — a simulated banking
> interface used in dementia care. It is not a real financial institution and
> never handles real money. See [`CLAUDE.md`](./CLAUDE.md) for the full product
> context and the rules this app must follow.

## Two surfaces in one app

- **Caregiver mode** (home): sign in with your existing Clearview Savings
  credentials, view your patients, their accounts and balances, and a built-in
  backend diagnostics screen.
- **Patient mode**: a calm, large-type bank view (Available Balance, Direct
  Deposit Pending, Recent Transactions), entered *from* caregiver mode. Patients
  never sign in separately.

## Getting started

```bash
npm install

# Point the app at the SAME Supabase project as the web app:
cp .env.example .env.local
#   EXPO_PUBLIC_SUPABASE_URL              = web app's NEXT_PUBLIC_SUPABASE_URL
#   EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY  = web app's NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

npm start          # Expo dev server — scan the QR with Expo Go, or:
npm run ios        # iOS simulator (macOS)
npm run android    # Android emulator
```

If `npm install` reports version mismatches, run `npx expo install --fix`.

## Testing the backend connection in-app

Sign in, then open **Diagnostics** (link on the patient list). It runs live
checks on the device — env keys present, valid Auth session, an RLS-scoped read
round-trip with latency, and token freshness — so you can confirm the app is
wired to the same backend as the web app without any external tooling.

## Scripts

| Command             | What it does                          |
| ------------------- | ------------------------------------- |
| `npm start`         | Expo dev server                       |
| `npm run ios`       | Open iOS simulator                    |
| `npm run android`   | Open Android emulator                 |
| `npm run typecheck` | `tsc --noEmit`                        |
| `npm run lint`      | `expo lint`                           |

## Multi-session workflow

This project carries the same handoff/re-anchor system as the web app:

- `CLAUDE.md` — project rules (read first).
- `docs/specs/M{N}.md` — frozen pre-flight spec per milestone.
- `docs/milestones/M{N}.md` — implementation plan.
- `docs/milestones/M{N}-progress.md` — current handoff (entry point for the
  next session).
- `docs/decisions/` — ADRs for non-obvious architectural choices.
- `memory/` — durable cross-session facts.
- `scripts/re-anchor.sh` (or `pwsh scripts/re-anchor.ps1`) — prints all of the
  above plus recent git history, in reading order, for a fresh session.

## Project layout

See the "Project layout" section in [`CLAUDE.md`](./CLAUDE.md).
