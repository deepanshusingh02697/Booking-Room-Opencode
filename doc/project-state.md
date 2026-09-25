# OpenCode Project State — Meeting Room Intelligence

> Persistent AI handoff document. Update this file whenever the project state changes
> so a new OpenCode session or model can continue development without re-discovering context.

Last updated: 2026-09-25 (end of Phase 3 session)
Repo: `Book-MeetingRoom` (branch `main`, working tree clean)

---

## 1. Project Overview

Full-stack meeting-room booking system ("Meeting Room Intelligence"). Employees find rooms,
check availability, and book/manage meetings (recurring meetings, check-in, no-show release,
waiting list). Admins manage rooms, equipment, maintenance, view office-wide bookings and
usage analytics.

Source-of-truth doc (note: `doc/`):

- `doc/requirement.md` — functional requirements (FR-1 … FR-47), business rules, data model
- `doc/plan.md` — implementation plan, folder structure, 15 feature phases
- `README.md` — setup + run instructions (kept in sync with real state)

Feature-driven phases: every phase delivers one feature end-to-end (backend + frontend).

## 2. Repo Layout

```
.
├── doc/                 plan.md, requirement.md (source of truth)
├── backend/             Express + TypeGraphQL + TypeORM (ts-node)
│   ├── scripts/         migrate.ts, migrate-revert.ts (custom runners)
│   └── src/
│       ├── config/       env.ts, data-source.ts
│       ├── common/       context.ts, auth-checker.ts, health-resolver.ts, errors/, logger.ts
│       ├── modules/      per-feature module folders (see §6)
│       ├── jobs/         registry.ts (cron skeleton)
│       ├── migrations/   typeorm migrations
│       ├── seed/         seed.ts
│       ├── schema.ts     buildSchema()
│       └── server.ts     Express + Apollo + cron + DB init
├── frontend/            React + Vite + Tailwind + Apollo Client
└── (turbo monorepo: root package.json workspaces [backend, frontend])
```

## 3. Tech Stack & Tooling

| Area | Choice | Notes |
|---|---|---|
| Frontend | React 18, TypeScript, Vite 5, Tailwind 3, Apollo Client 3 | `credentials: 'include'` |
| Backend | Node 22, Express 4, TypeGraphQL (v2 beta), TypeORM 0.3 | |
| DB | PostgreSQL + `pg` | TypeORM, `synchronize: false` |
| Runtime for TS | **`ts-node` (backend)** | **IMPORTANT:** was `tsx`, switched 2026-09-25 — see §8 |
| Real time | Socket.io | **not yet wired** (Phase 13) |
| Security/Automation | JWT, bcryptjs, class-validator, node-cron | auth implemented (Phase 3); node-cron jobs not yet used |
| Monorepo | Turborepo 2 (npm workspaces) | |

## 4. How to Run

Prereqs: Node 22+, local PostgreSQL running.

```bash
npm install                      # root (installs both workspaces)

cp backend/.env.example backend/.env   # then edit as needed

npm run migrate -w backend       # runs pending migrations (via scripts/migrate.ts)
npm run seed -w backend          # loads demo data (idempotent: skips if employees exist)
npm run dev                      # turbo: backend :4000, frontend :5173 (Vite proxies /graphql + /socket.io)
```

Useful commands:

```bash
npm run typecheck                # turbo run typecheck (both workspaces)
npm run dev:backend              # backend only
npm run dev:frontend             # frontend only
npm run migrate:revert -w backend
npm run build                    # backend tsc → dist, frontend vite build
```

Backend endpoints: `http://localhost:4000/health`, `http://localhost:4000/graphql`.

`backend/.env` is gitignored; `.env.example` is committed (includes a real local dev DB URL — OK for local work).

Demo credentials (from seed):
- Employee: `aarav@mri.com` / `Employee@123` (also priya/rohan/sara @mri.com)
- Admin: `admin@mri.com` / `Admin@123`

## 5. Current Status (verified 2026-09-25)

### Phase 1 — Project Foundation: ✅ DONE
- Workspaces, Turbo, shared tsconfig, typed env, error classes/codes, logger
- Express + cors + cookie-parser; Apollo + TypeGraphQL schema at `/graphql`
- `/health` endpoint; GraphQL context reads JWT cookie → nullable user
- Cron registry (`startJobs`/`stopJobs` with server)
- Frontend: Vite + Tailwind + Apollo (`credentials: 'include'`), route skeleton + AppLayout/Navbar/Sidebar,
  shared components (Button, Modal, LoadingState, EmptyState, ErrorState, StatusBadge) and form components
  (Input, Select, DateTimePicker). All routes are `PlaceholderPage`.

### Phase 2 — Database Design: ✅ DONE + validated (commit `7a6d9e4`)
- DataSource with `synchronize: false`, entities ↔ migration ↔ live DB verified identical
- Migration `1730000000000-CreateInitialSchema` — all 9 tables + enums + constraints + indexes
- Migration `1730000000001-AddWaitlistUniqueConstraint` — DB-level FR-35 guarantee
- **Verified:** `migrate` → `revert` → `migrate` → `seed` all run clean
- Seed data loaded: 5 employees (1 admin + 4), 5 rooms (AVAILABLE/MAINTENANCE/DISABLED),
  4 equipment, 7 room-equipment, 9 bookings (incl. 3 recurring, COMPLETED, CANCELLED, NO_SHOW),
  6 participants, 1 check-in, 1 waitlist entry, 2 maintenance windows
- Server boots, connects to DB, `/health` and GraphQL health query confirmed

### Phase 3 — Authentication & Roles: ✅ DONE (verified 2026-09-25, commit `dd8f4af`)
- Backend `modules/auth/`: `utils/password.ts` (bcrypt), `utils/jwt.ts` (sign/verify + cookie
  maxAge from `JWT_EXPIRES_IN`), `repositories/employee-repository.ts`, DTOs
  (`sign-up-input`, `log-in-input`, `admin-login-input`, `employee-type` output type),
  `services/auth-service.ts`, `resolvers/auth-resolver.ts`, `index.ts`
- Mutations: `signUp` (dup email → CONFLICT, auto-login cookie), `logIn` (role=EMPLOYEE only),
  `adminLogin` (role=ADMIN only), `logout` (clears cookie); Query: `currentUser` (`@Authorized()`)
- `common/auth-checker.ts` wired into `buildSchema` (`@Authorized()` → UNAUTHENTICATED,
  `@Authorized(UserRole.ADMIN)` → FORBIDDEN); services re-check auth themselves
- `common/context.ts` refactored: `UserRole` now single-sourced from the entity; token
  verify moved to `auth/utils/jwt.ts`; cookie name is `token`
- `server.ts` has an Apollo `formatError` that strips TypeGraphQL's raw `validationErrors`
  (they echoed submitted input incl. password) and renders readable constraint messages
- Frontend: `types/` (UserRole/Employee), `graphql/queries|mutations/auth.ts`,
  `context/AuthContext.tsx` + `hooks/useAuth.ts`, `pages/login/LoginPage.tsx`
  (login/register toggle + "Sign in as administrator" checkbox),
  `routes/ProtectedRoute.tsx` + `AdminRoute.tsx` (route table restructured; `/admin/*` gated),
  Navbar shows user + role + logout, Sidebar hides admin links for employees,
  **`ApolloProvider` added in `main.tsx`** (was never mounted before),
  `utils/errors.ts` (`getGraphQLErrorMessage`)
- **Verified live:** anonymous → UNAUTHENTICATED; employee login/session/currentUser OK;
  employee creds rejected by `adminLogin` and admin creds rejected by `logIn` (generic message);
  signUp/duplicate/validator errors OK; logout clears session; Vite proxy `/graphql` OK;
  `npm run typecheck` passes both workspaces
- Full `@Authorized('ADMIN')` gating gets its first real targets in Phase 4 (no admin-only
  operations existed before now)

### Phase 4 — Rooms: ⬜ NOT STARTED (next)

Current GraphQL surface (`schema.ts`):
- Query: `health`, `currentUser` (auth required)
- Mutation: `signUp`, `logIn`, `adminLogin`, `logout`
- Enum `UserRole` registered via `registerEnumType` in `schema.ts`

## 6. Modules & Data Model

Module folders under `backend/src/modules/` (each: dto/, entities/, repositories/, resolvers/, services/, utils/, index.ts).
**auth** is fully layered (all folders). All other modules currently have only `entities/` populated.

| Entity | Table | Notes |
|---|---|---|
| Employee | employees | role enum EMPLOYEE/ADMIN, unique email |
| Room | rooms | unique name, `CHK capacity > 0`, status AVAILABLE/MAINTENANCE/DISABLED |
| Equipment | equipment | unique name |
| RoomEquipment | room_equipment | unique (room_id, equipment_id) |
| Booking | bookings | status CONFIRMED/COMPLETED/CANCELLED/NO_SHOW, `CHK start < end`, `has_checked_in`, recurrence_id; indexes on (room,start,end), (organizer,start), recurrence |
| Participant | participants | unique (booking_id, employee_id) |
| CheckIn | check_ins | unique booking_id (one per booking) |
| WaitlistEntry | waitlist_entries | **unique (room_id, employee_id, start_time)** + index (room,start), `CHK start < end` |
| Maintenance | maintenance | index (room,start), `CHK start < end` |

Note: `requirement.md` data model also lists `PasswordResetToken` — **out of scope, will not be modeled** (see §9 decisions).

## 7. Architecture Conventions (from plan.md)

- Layered per module: Resolver → Service → Repository → Entity. Plan rules:
  - Resolver never touches repository/entity/DB directly
  - Service never touches the DB directly (goes through repository)
  - Frontend only talks to backend via GraphQL
- Enums are exported from entity files (e.g., `UserRole`, `RoomStatus`, `BookingStatus`).
- Protected resolvers use `@Authorized()` / `@Authorized(UserRole.ADMIN)` (checker: `common/auth-checker.ts`);
  services re-check auth/roles themselves so they stay safe when called directly.
- Session: httpOnly cookie named `token` (JWT payload `{ id, role }`), set/cleared in resolvers via context.
- Errors: `ApplicationError` subclasses (`UnauthenticatedError`, `ForbiddenError`, `NotFoundError`,
  `ConflictError`, `ValidationError`) with codes in `common/errors/`.
- CJS backend (`no "type": "module"`), `module: nodenext`, `emitDecoratorMetadata: true` (in root `tsconfig.base.json`).
- `schema.ts` registers resolvers explicitly.

## 8. Key Gotchas / Team Memory

1. **Backend runtime is `ts-node`, NOT `tsx`.** `tsx`/esbuild cannot emit TS decorator metadata,
   which TypeORM (column type inference) and TypeGraphQL both require. Scripts:
   - `dev` = `node --watch -r ts-node/register src/server.ts`
   - `migrate` / `migrate:revert` / `seed` = `ts-node` running `scripts/*.ts` / `src/seed/seed.ts`
   - Do NOT reintroduce `tsx` for backend code.
2. **Migrations/seed run via custom scripts** (`backend/scripts/migrate.ts`, `migrate-revert.ts`),
   not the TypeORM CLI, because the CLI's TS loading drops decorator metadata.
   `migrate-revert.ts` reads the last-run migration name from the `migrations` table
   (`undoLastMigration()` returns `void`).
3. **`DATABASE_URL` must NOT contain `?schema=public`** — `psql`/libpq rejects it
   (node-pg tolerates it). Current URL is clean.
4. **Frontend Vite dev must be running on 5173** or the GraphQL proxy target
   (`http://localhost:4000`) still requires backend on 4000.
5. **Foreign key / cascade pattern** is consistent: all FK columns snake_case, `onDelete: 'CASCADE'`,
   unique constraints named `UQ_*`, check constraints `CHK_*`.
6. **`.turbo/` is gitignored** (added 2026-09-25; previously cache was committed — do not re-commit it).
7. **`npm run lint` does not exist** (root `lint` script removed 2026-09-25). Typecheck is the gate.
   Plan's scope note says testing/Husky/lint tooling intentionally deferred.
8. Run `npm run typecheck` after meaningful backend or frontend changes. `npm install` sometimes
   refreshes turbo cache hashes (creates new `.turbo/cache/*` files — ignored).
9. There may be stale background servers from a sibling folder (`MeetingRoom-Intelligence`) on this machine;
   they are unrelated and can hold ports 4000/5173. (Current session stopped its dev servers cleanly —
   ports were free at Phase 3 close.)
10. Dev-only: Apollo includes `stacktrace` in GraphQL error extensions when `NODE_ENV=development`.
    Production would omit it (Phase 14 hardening).
11. **Git is managed manually by the user.** Do NOT commit, push, or create PRs from an AI
    session — the user handles all git operations themselves.

## 9. Pending Decisions / Next Steps

**Decided 2026-09-25:**
- **Forgot-password (FR-6/FR-7) is OUT OF SCOPE for this build.** No `PasswordResetToken`
  entity, no nodemailer. Marked as out of scope in `requirement.md` (§2 + FR-6/FR-7).
- **Phase 2 committed as a checkpoint** before starting Phase 3.
- `doc/plan.md` runner reference fixed (`tsx` → `ts-node`).

**Phase 4 backlog (from plan.md):**
- Room CRUD (create/update/disable/reenable/list/details, reject duplicate names) — admin
- Room search: filter by status, capacity, floor, equipment (FR-8/9/10)
- Availability: exclude overlapping CONFIRMED bookings or maintenance windows
- Frontend: Room Directory + RoomFilters, Room Details, Admin Rooms + RoomForm
- First real `@Authorized(UserRole.ADMIN)` resolvers land here

## 10. Verification Checklist Before Starting New Work

- [ ] Backend: `npm run typecheck` passes (both workspaces)
- [ ] DB reachable; `npm run migrate -w backend` says "No migrations to run"
- [ ] `npm run seed -w backend` idempotent (logs "Seed skipped" if run before)
- [ ] `npm run dev` → `/health` returns `{"status":"ok"}`

Report a change/decision here when it affects how the app runs (tooling, schema, phases, conventions).