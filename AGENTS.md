# AGENTS.md

Instructions for AI coding agents working in this repository. Rules here are **project** rules; if
this file ever conflicts with `doc/requirement.md`, the requirement document wins and this file is
the thing to fix.

## What this is

Meeting Room Intelligence — a full-stack meeting-room booking system. TypeScript monorepo
(Turbo + npm workspaces): `backend` (Express + Apollo GraphQL + TypeORM + Socket.IO + PostgreSQL),
`frontend` (React + Vite + Apollo Client + Tailwind). No CI, no lint config, no frontend tests.

## Source of truth — read, do not duplicate

| File | What it owns |
| --- | --- |
| `doc/requirement.md` | Requirements and business rules (FR-ids). The rules themselves live here. |
| `doc/plan.md` | Phase-by-phase plan and what is done vs open. |
| `doc/project-state.md` | Session history, decisions (§9) and traps (§8). Long; grep it before re-deriving anything. |

If you change behaviour, update the matching document in the same change. Do not restate their
content here.

## Gates — all of these must pass before a change is done

```bash
npm run typecheck          # both workspaces
npm run build              # both workspaces
npm run test -w backend    # safe: skips the DB suites, opens no connection
npm run test:db -w backend # DESTRUCTIVE — see below
```

There is no lint step; do not invent one uninvited.

## Architecture — who owns what

Backend modules are feature folders under `backend/src/modules/<feature>/`, layered:

```
Resolver (GraphQL only) → Service (rules, auth, transactions) → Repository (queries) → Entity
```

- A resolver must not touch a repository, and a service must not import `typeorm` `Repository`
  directly — the repository layer exists to own SQL.
- Authorization (`requireAuthenticated` / `requireRole`) belongs in the **service**, not the
  resolver. A service method may take an optional trailing `loaders` argument; resolvers pass
  `ctx.loaders`.
- `AppContext` (`backend/src/common/context.ts`) carries `req`, `res`, `user` and the per-request
  DataLoaders. Loaders are per request — never module-level singletons.
- Services construct their repositories from `AppDataSource`. They resolve at call time, so a test
  can initialise that one DataSource and the whole service layer works.
- Writes that must not race (overlapping bookings, cancellation + waitlist conversion, maintenance
  windows) go through `AppDataSource.transaction`, sometimes `SERIALIZABLE` with a retry.

Frontend: `src/pages` per route, `src/components/{layout,common,forms}`, `src/graphql` for queries,
`src/realtime` for the socket, `src/hooks` for shared hooks, `src/theme` for the design tokens.
Reuse existing components and tokens before adding new ones; `theme/index.ts` owns spacing, type
scale and copy.

## Invariants that break silently

- Overlap prevention is a PostgreSQL exclusion constraint plus a serializable transaction — not an
  application-level check alone. Never "simplify" it into a pre-check.
- Cancellation is rejected inside 30 minutes before `startTime`. Participant add/remove has the same
  window. Test fixtures must not use `startOfNextHour()` for these — it can land inside the window.
- A waitlist entry is only valid when the window is genuinely unavailable (an overlapping confirmed
  booking exists) and not blocked by maintenance.
- `MaintenanceService.create` refuses a window that overlaps a confirmed booking. Any test that needs
  both to exist has to insert the booking through a fixture, not through the service.
- Room uniqueness is by name; `EquipmentService.create` refuses a duplicate name.
- `recurrenceId` groups occurrences; an occurrence can be cancelled without cancelling the series.

## Tests

- Suites live beside the code they test: `backend/src/modules/<feature>/<feature>-service.test.ts`.
- DB suites are **destructive**: they truncate every table between tests and only run behind
  `RUN_DB_TESTS=1` (`npm run test:db -w backend`). Never run them against a database you have not
  been asked to touch; the test DataSource prints the target database name on start — read it.
- After a DB run the database is left empty on purpose, so `npm run seed -w backend` restores the
  demo data. The seed is a no-op while rows exist, so if a run crashed before teardown, truncate
  first.
- Use `describeDb` from `backend/src/test/test-utils.ts` and the fixture helpers next to it. Do not
  invent a second fixture layer.
- The test DataSource clears TypeORM's `migrations` glob on purpose: TypeORM `require()`s migration
  files during `initialize()` and cannot load `.ts` under Vitest. Do not "fix" this by making the
  app migrations `.js`.

## Traps already paid for

- Apollo's `skip` does not survive `refetch()`; a validity guard has to live in the refetch handler.
- esbuild does not emit decorator metadata, so Vitest needs `unplugin-swc` (see
  `backend/vitest.config.ts`). Removing it breaks every entity.
- `Booking.recurrenceId` is typed `string`, not `string | null`, although the column is nullable.
- A GraphQL arg declared `nullable: true` arrives as explicit `null`; a `= {}` default parameter does
  not cover it.
- `socket.ts` handlers bind to the socket that exists at bind time. Connect first, then subscribe.

## Workflow

- **The user commits manually.** Do not run `git commit`, `git add -A`, or push unless asked in that
  same request.
- Do not add a dependency, a service, a config knob or a phase without being asked. If a fix seems
  to need one, say so and let the user decide.
- Do not create documentation files unless asked. Update the existing ones instead.
- Keep changes in the layer that owns the behaviour; avoid opportunistic refactors, renames and
  cleanup in unrelated files.
- Temporary verification scripts belong outside the repo (e.g. `/tmp`), and nothing test-harness
  related gets committed unless the user asks.
