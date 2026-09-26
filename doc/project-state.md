# OpenCode Project State — Meeting Room Intelligence

> Persistent AI handoff document. Update this file whenever the project state changes
> so a new OpenCode session or model can continue development without re-discovering context.

Last updated: 2026-09-26 (end of Phase 8 backend session; **Phase 9 — Check-in & No-show** is next)
Repo: `Book-MeetingRoom` (branch `main`)
Working tree at session close: **uncommitted Phase 5 + Phase 6 + Phase 7 changes** — Phase 5: new
`backend/src/modules/equipment/` files plus edits to `rooms/dto/room-type.ts`, `rooms/services/room-service.ts`;
Phase 6: new `bookings/` (except entities), `participants/` (except entities) and `notifications/` files, plus
edits to `auth/repositories/employee-repository.ts` (+`findByIds`), `rooms/dto/room-type.ts`
(+occupancy fields), `backend/src/schema.ts` and this doc; Phase 7: added booking query/cancel methods,
`addParticipants`/`removeParticipant`, the waitlist service skeleton, migration
`1730000000002-AddBookingOverlapExclusionConstraint`, the 23P01→CONFLICT mapping in
`booking-service.ts`, and the Phase 7 section below; Phase 8: new `bookings/utils/recurrence.ts` +
`bookings/dto/recurrence-input.ts` and edits to `bookings/dto/create-booking-input.ts` (+`recurrence`),
`bookings/repositories/booking-repository.ts` (+`createMany`/`findByRecurrenceId`/`NewBookingData.recurrenceId`),
`participants/repositories/participant-repository.ts` (+`existsForBookingsAndEmployee`),
`bookings/services/booking-service.ts` (recurring create + `recurringBookingGroup`),
`bookings/resolvers/booking-resolver.ts`, `backend/src/schema.ts` (+`RecurrenceFrequency` enum),
`bookings/index.ts` and this doc.
The user commits manually (§8.11); if the tree is clean when you read this, all four phases are committed.

---

## 1. Project Overview

Full-stack meeting-room booking system ("Meeting Room Intelligence"). Employees find rooms,
check availability, and book/manage meetings (recurring meetings, check-in, no-show release,
waiting list). Admins manage rooms, equipment, maintenance, view office-wide bookings and
usage analytics.

Source-of-truth doc (note: `doc/`):

- `doc/requirement.md` — functional requirements (FR-1 … FR-47), business rules, data model
- `doc/plan.md` — implementation plan, folder structure, phases 1–25
- `README.md` — setup + run instructions (kept in sync with real state)

Phase structure (restructured 2026-09-25): Phases 1–3 foundation/auth (done), then a
**backend track** (Phases 4–13, one feature per phase), then a **frontend track**
(Phases 14–23, same feature order), then hardening (Phase 24) and docs (Phase 25).

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
- Admin: `admin@gmail.com` / `Admin@123`

## 5. Current Status (verified 2026-09-26)

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
- Migration `1730000000002-AddBookingOverlapExclusionConstraint` (added in the Phase 7 session) —
  enables `btree_gist` and adds `EXC_bookings_room_no_overlap`:
  `EXCLUDE USING gist ("room_id" WITH =, tstzrange("start_time","end_time") WITH &&) WHERE ("status" = 'CONFIRMED')`
  → **DB-level FR-21 guarantee** (the third mitigation `plan.md` §6 promises but that no migration
  previously provided). Partial by design: only CONFIRMED rows are constrained, so cancelling or
  completing a booking frees the slot. `down()` drops the constraint and the extension; verified
  `migrate` → `revert` → `migrate` clean.
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

### Phase 4 — Rooms (Backend): ✅ DONE (verified 2026-09-25, commit `4d26e6e`)
- `modules/rooms/`: `dto/` (`create-room-input`, `update-room-input`, `set-room-status-input`,
  `room-filter-input`, `room-type`), `repositories/room-repository.ts`, `services/room-service.ts`,
  `resolvers/room-resolver.ts`, `index.ts` — fully layered, same conventions as auth
- Queries: `rooms(filter)` (status / minCapacity / floor / equipmentIds / startTime+endTime),
  `room(id)` — both `@Authorized()`
- Mutations (all `@Authorized(UserRole.ADMIN)`): `createRoom` (dup name → CONFLICT),
  `updateRoom` (partial update, dup name excluding self → CONFLICT), `setRoomStatus`
  (disable/re-enable via status — FR-13)
- Availability (FR-9): when `startTime`+`endTime` given, filter excludes rooms with an overlapping
  CONFIRMED booking **or** overlapping maintenance window; partial time range → `ValidationError`
- Equipment search filter (FR-8) via `room_equipment` join + `HAVING COUNT(DISTINCT ...) = n`
  (room must have ALL requested equipment)
- `schema.ts`: `RoomResolver` registered + `RoomStatus` enum added to the GraphQL schema
- **Also fixed:** `logout` mutation now has `@Authorized()` (unauthenticated logout → UNAUTHENTICATED).
  Admin seed email changed to `admin@gmail.com`; dev DB email synced via UPDATE (seed stays
  idempotent-skips).
- **Verified live:** anonymous → UNAUTHENTICATED; employee queries OK / mutations → FORBIDDEN;
  filters (status/minCapacity/floor/equipment); availability exclusions (09:30–10:30 → Orion+Vega,
  15:00–16:00 → Atlas+Orion+Vega); create/dup/update/excl-self-collision/setRoomStatus;
  validation errors; `npm run typecheck` passes both workspaces; test data removed (5 seed rooms)
- **FYI:** dev DB also has a leftover signUp test employee from Phase 3 (`rohan@gmail.com`, id 7) —
  harmless; can be deleted via SQL if a clean 5-employee seed is wanted.

### Phase 5 — Equipment (Backend): ✅ DONE (verified 2026-09-25)
- `modules/equipment/`: `dto/` (`create-equipment-input`, `update-equipment-input`,
  `room-equipment-input` (roomId+equipmentId, shared by assign/remove),
  `equipment-type` + `toEquipmentType`), `repositories/equipment-repository.ts`,
  `services/equipment-service.ts`, `resolvers/equipment-resolver.ts`,
  `resolvers/room-equipment-field-resolver.ts` (FR-46), `index.ts` — fully layered
- Query: `equipment` (all records, name ASC) — `@Authorized()` (any employee needs it
  for FR-8 search filters / FR-10 room details; only the section heading in requirement.md
  says "(Admin)")
- Mutations (all `@Authorized(UserRole.ADMIN)`): `createEquipment` (dup name → CONFLICT),
  `updateEquipment` (partial; dup name excluding self → CONFLICT; only-id input is a safe
  no-op returning the record), `assignEquipmentToRoom` (dup assignment → CONFLICT),
  `removeEquipmentFromRoom` (no-op removal → NOT_FOUND). Assign/remove return `RoomType`
  so the response can include `room { equipment { ... } }`
- FR-46: `RoomType` gained `@Field(() => [EquipmentType]) equipment?` (rooms module imports
  EquipmentType — no file-level cycle); `RoomEquipmentFieldResolver` (`@Resolver(() => RoomType)`)
  resolves it on demand via `EquipmentService.listForRoom` (query-builder join, name ASC,
  `@Authorized()` + service re-check). Verified: rooms/room queries return per-room equipment;
  rooms with none return `[]` (schema type is `[EquipmentType]!`, confirmed via introspection)
- `schema.ts`: `EquipmentResolver` + `RoomEquipmentFieldResolver` registered
- **Phase 4 touch-up (found during Phase 5 testing):** whitespace-only names passed
  `@IsNotEmpty` (it doesn't trim) and were stored as `""`. Added empty-after-trim guards to
  `equipment-service` (create/update) AND `room-service` (create/update name+location) →
  `ValidationError`. No DB cleanup needed for rooms (none were created this way)
- **Verified live (dev server with node --watch):** anonymous → UNAUTHENTICATED; employee
  list OK / create+assign → FORBIDDEN; admin create/dup/whitespace/101-char VALIDATION;
  update/rename/collision/not-found/only-id-no-op; assign+field-resolver/dup/bad-room/
  bad-equipment; remove real/no-op; equipment search filter regression ([1] → 3 rooms,
  [1,2] → only Atlas); `updateRoom` with only id does not error. Test data removed via SQL
  (no delete mutation in scope — same approach as Phase 4): back to 4 equipment /
  7 room-equipment rows; `npm run typecheck` passes both workspaces
- **FYI:** dev DB has a leftover test room `heaven` (id 7, AVAILABLE) that pre-dates this
  session (present at session-start verification; not created by Phase 5 tests). Harmless —
  delete via SQL if a clean 6-row rooms table is wanted. (Known other leftover: Phase 3
  test employee `rohan@gmail.com`, see Phase 4 FYI above.)

### Phase 6 — Core Booking (Backend): ✅ DONE (verified 2026-09-25)
- `modules/bookings/`: `dto/` (`create-booking-input`, `booking-type` + `toBookingType`),
  `repositories/booking-repository.ts` (tx-aware `create` + conflict queries),
  `services/booking-service.ts` (rule engine), `resolvers/booking-resolver.ts` (createBooking),
  `resolvers/booking-relations-field-resolver.ts` (room/organizer on BookingType),
  `resolvers/room-occupancy-field-resolver.ts` (FR-47), `index.ts` — fully layered
- `modules/participants/` now layered: `dto/participant-type.ts` (+`toParticipantType`),
  `repositories/participant-repository.ts` (tx-aware `createForBooking`, `listForBooking`, `countForBooking`),
  `services/participant-service.ts`, `resolvers/booking-participants-field-resolver.ts` (BookingType.participants),
  `resolvers/participant-employee-field-resolver.ts` (ParticipantType.employee), `index.ts`
- `modules/notifications/` **skeleton** (FR-23 stub until Phase 13): `dto/notification-payload.ts`,
  `utils/payload-builders.ts` (per-recipient payload), `services/notification-service.ts`
  (logger-based stub — one log line per recipient), `index.ts`. Phase 13 swaps the emission
  internals to Socket.io; booking service already calls `notificationService.bookingCreated(...)`
  AFTER the transaction commits (a stub failure cannot roll back a booking).
- `auth/repositories/employee-repository.ts`: added `findByIds` (`In()`).
- `createBooking` mutation — `@Authorized()` (any employee). Rules (FR-18..21): start < end,
  start strictly in future, whitespace guards on title/description (consistent with Phase 5),
  room exists (NOT_FOUND) and AVAILABLE (FR-19), capacity = organizer + participants ≤ room
  capacity (FR-20), participant edge rules (dup ids → VALIDATION, organizer self-id in list →
  VALIDATION, unknown employee → NOT_FOUND — user-approved strict rules, see §9).
- **Double-booking prevention (FR-21):** overlap checks (CONFIRMED bookings + maintenance windows)
  AND all writes (booking + participant rows) run inside ONE `AppDataSource.transaction('SERIALIZABLE')`
  with bounded retry: 3 attempts, backoff 50ms × attempt; retries on pg 40001/40P01 (+ message sniff
  for TypeORM wrapping). Retries exhausted → CONFLICT ("room schedule was updated… try again").
- FR-47 (folded into Phase 6 per §9 decision): `RoomType` + `occupantCount`/`remainingCapacity`
  (`Int!`, resolved on demand): 0 / capacity when no active booking; from the CONFIRMED booking
  active at the current moment (start ≤ now < end, latest start wins) it is organizer + participants,
  remaining = capacity − occupants.
- `schema.ts`: `BookingStatus` enum registered; `BookingResolver`, `BookingRelationsFieldResolver`,
  `RoomOccupancyFieldResolver`, `BookingParticipantsFieldResolver`, `ParticipantEmployeeFieldResolver` added.
- **Verified live** (on a manually started `node -r ts-node/register src/server.ts` instance with logs
  captured to a file — the user's `node --watch` server child was DOWN at session start; watch parent
  alive, see §8.13): anonymous → UNAUTHENTICATED; valid booking w/ participants returns the full graph
  (room + equipment, organizer, participants + employee); **rejections**: start ≥ end, past start,
  whitespace title, whitespace description, duplicate participantIds, organizer-as-participant,
  unknown participant (NOT_FOUND), unknown room (NOT_FOUND), DISABLED room, MAINTENANCE-status room,
  overlap with a CONFIRMED booking (CONFLICT, names the conflicting booking), overlap with a maintenance
  window (CONFLICT, includes reason) — boundary adjacency (end 9:30 == next start 9:30) correctly allowed;
  capacity exceeded rejected + exact-fit passes (tested via temporary admin capacity change, restored);
  FR-47: 0/8 idle and 2/6 during a live-now booking, via both `room` and `rooms`; FR-23: per-recipient
  `[notification:BOOKING_CREATED]` log lines confirmed; **concurrent double-booking: 3/3 rounds** of two
  truly parallel createBooking calls (aarav vs priya, same room+slot) → exactly one winner per round,
  loser retried and got a specific CONFLICT naming the winner's booking, exactly 1 DB row per slot,
  server log shows genuine SSI aborts ("could not serialize access…") + retries.
- **Phase 7 hardening — DB-level double-booking guarantee (user-approved):** the overlap guarantee
  used to live *only* in application code, so any future path that forgot the SERIALIZABLE check
  could double-book silently. Added migration `1730000000002` with the
  `EXC_bookings_room_no_overlap` partial exclusion constraint (see Phase 2 section). This closes the
  third mitigation listed in `plan.md` §6 ("Serializable transaction + bounded retry, **database-level
  constraint**, automated test") — the constraint is what was missing.
- **Gotcha found while verifying that constraint — the loser's error changed.** With only the
  SERIALIZABLE check, a concurrent loser got `40001`, was retried, and then the app-level check
  produced a friendly `CONFLICT`. Once the exclusion constraint exists, the loser's `INSERT` instead
  blocks on the GiST index until the winner commits and then fails with **`23P01`
  (exclusion_violation)** — which is *not* in `RETRYABLE_PG_CODES`, so it escaped as a raw
  `INTERNAL_SERVER_ERROR` ("conflicting key value violates exclusion constraint…") in **3 of 6**
  measured concurrent rounds. Fixed in `booking-service.ts` with `isBookingOverlapViolation()` +
  `createWithConflictMapping()`, which re-queries the conflicting booking and throws the **same**
  friendly `ConflictError` the app-level check throws (message parity verified). Re-measured:
  **10/10 concurrent rounds** → exactly 1 winner + 1 friendly `CONFLICT` + exactly 1 DB row, zero
  raw/500 errors. **Any future bulk-insert path (Phase 8 recurring, Phase 10 waitlist conversion)
  must reuse `createWithConflictMapping` or map `23P01` itself, or it will 500.**
- **Constraint semantics verified directly in SQL:** exact overlap → `23P01` rejected; partial overlap
  → rejected; `end == next start` adjacency → allowed; same slot in a *different* room → allowed;
  a `CANCELLED` row overlapping a `CONFIRMED` one → allowed (partial constraint works); no probe rows
  leaked.
- Test data cleaned via SQL (bookings 10–21 + cascade participants deleted; temp maintenance row
  deleted; Vega capacity restored to 8). DB back to exact seed state (9 bookings / 6 participants /
  2 maintenance / 6 rooms incl. pre-existing leftover `heaven` / 1 waitlist entry).
- `npm run typecheck` passes both workspaces (final run: FULL TURBO).

### Phase 7 — Manage Bookings & Cancellation (Backend): ✅ DONE (verified 2026-09-25)
- **User-approved scope additions:** FR-28/FR-29 (add/remove participants on an existing booking) and
  FR-30 (their notifications) — scheduled in no phase of `plan.md` — were folded into Phase 7, plus
  FR-24/25/26/31 and a FR-33 waitlist hook stub.
- `booking-repository.ts` gained `findById`, `findOrganizedBy` (FR-24, startTime DESC),
  `findUpcomingForUser` (FR-25, `startTime > now` + status CONFIRMED, organizer OR participant,
  startTime ASC), `findByIdForUpdate` (tx-aware `PESSIMISTIC_WRITE`) and `cancelIfConfirmed`
  (conditional `UPDATE ... WHERE id = ? AND status = 'CONFIRMED'` — the cancellation CAS).
- `booking-service.ts` gained `myBookings`, `myMeetings`, `getById` (FR-26: organizer/participant/admin),
  `cancel` (FR-31), `addParticipants` (FR-28, batch) and `removeParticipant` (FR-29).
- `utils/booking-time-policy.ts`: single `BOOKING_CHANGE_WINDOW_MINUTES = 30` +
  `isBookingChangeWindowOpen(startTime, now)` used by cancel AND both participant mutations.
  **User decision:** reject at/after the cutoff (strictly-later-than required to change).
- `booking-resolver.ts` added `myBookings`, `myMeetings`, `bookingDetails`, `cancelBooking`
  (all `@Authorized()`; role/ownership rules enforced again in the service, per convention).
- `participants/`: `dto/add-participants-input.ts` (`bookingId` + `employeeIds: Int![]`),
  `dto/remove-participant-input.ts` (`bookingId` + `employeeId`), `resolvers/participant-resolver.ts`
  with both mutations (registered in `schema.ts`); `participant-repository.ts` gained tx-aware
  `listForBookingIds`, `findForUpdate`, `existsForBooking`, `insertMany`, `deleteForBookingEmployee`.
- **`addParticipants` rules** (all inside ONE `transaction('SERIALIZABLE')`, mirroring Phase 6):
  organizer-or-admin only; status CONFIRMED; 30-min window; non-empty + duplicate-free `employeeIds`
  (GraphQL `ArrayMinSize(1)` + service `Set` check); organizer cannot be added; employees must exist
  (NOT_FOUND, fetched in one `findByIds`); existing participant → CONFLICT; capacity
  (organizer + participants) ≤ room capacity → VALIDATION. Emits FR-30 `PARTICIPANT_ADDED` per recipient.
- **`removeParticipant` rules:** organizer or admin, or the participant removing themself; status
  CONFIRMED; 30-min window; removing a non-participant → NOT_FOUND. Emits FR-30 `PARTICIPANT_REMOVED`.
- `waitlist/services/waitlist-conversion-service.ts` created: `onBookingCancelled(booking)` is a
  **logger.debug no-op** called by `cancel` AFTER commit (FR-33; FIFO conversion is Phase 10).
- `notification-service.ts` + payload builders extended for `PARTICIPANT_ADDED`/`PARTICIPANT_REMOVED`
  (FR-30). Booking-cancellation notifications are deliberately NOT sent (not in scope, no FR).
- **Resolved the §9 Phase 6 note:** `bookingDetails` (FR-26) enforces access on the ROOT query
  (organizer/participant/admin). The nested `BookingType.participants` field resolver is
  **authentication-only again** — a live test proved a per-field re-check breaks "remove myself",
  since the requester is no longer a participant by the time the mutation's `participants` field
  resolves. Same shape as the pre-existing `room`/`organizer` field resolvers.
- **Verified live** (server on :4000, ~45 assertions, all test rows deleted in `finally`): anonymous →
  UNAUTHENTICATED on all 6 new operations; `myBookings` DESC and `myMeetings` future-only/ASC
  (seed ids 4,5,6 in order for sara); `bookingDetails` allowed for organizer/participant/admin and
  FORBIDDEN for an unrelated employee; admin `createBooking` → FORBIDDEN (employee-only rule kept);
  non-owner cancel → FORBIDDEN; cancel at 29 min → VALIDATION (owner AND admin); cancel at 31 min →
  CANCELLED; repeat cancel → VALIDATION; **concurrent owner+admin cancel → exactly one winner, the
  loser gets VALIDATION_ERROR** (CAS verified); batch add forbidden for a plain participant;
  duplicate ids/organizer-as-participant → VALIDATION; unknown employee → NOT_FOUND; existing
  participant → CONFLICT; capacity exceeded → VALIDATION (via a temporary room-capacity change,
  restored); valid batch add [4,5] returns all 3 participants; self-removal, peer removal (FORBIDDEN),
  organizer removal and admin removal all correct; add/remove inside the window → VALIDATION;
  waitlist row count unchanged (hook is a no-op). FR-30/FR-33 stubs verified separately with a
  logger capture: exact `[notification:BOOKING_CREATED|PARTICIPANT_ADDED|PARTICIPANT_REMOVED]` lines
  and the waitlist debug line.
- DB back to the exact seed baseline after testing: 9 bookings / 6 participants / 1 waitlist entry /
  room 1 capacity 10, zero `PHASE7_VERIFY_%` rows.
- `npm run typecheck` + `npm run build` pass both workspaces; `git diff --check` clean.

### Phase 8 — Recurring Meetings (Backend): ✅ DONE (verified 2026-09-26)
- `bookings/utils/recurrence.ts` (new): `RecurrenceFrequency` enum (DAILY/WEEKLY; registered in
  `schema.ts`), `generateOccurrences(startTime, endTime, frequency, endDate)` — calendar-day stepping
  (+1/+7 via `setDate`, preserves local time-of-day), **endDate INCLUSIVE** (occurrence start ≤ endDate;
  equal dates → single-occurrence series), **cap `MAX_RECURRENCE_OCCURRENCES = 90`** → ValidationError
  beyond, explicit pairwise overlap check between generated occurrences (trips when duration exceeds the
  cadence, e.g. a >24h DAILY booking) → ValidationError; `buildRecurrenceId()` → `rc-<randomUUID()>`
  (same `rc-` prefix style as the seed's `rc-standup-1`).
- `bookings/dto/recurrence-input.ts` (new): `RecurrenceInput { frequency, endDate }`;
  `CreateBookingInput` gained optional nested `recurrence` (**user decision: extend `createBooking`**
  rather than a separate mutation; the mutation still returns `BookingType` = the FIRST occurrence, which
  carries the `recurrenceId` — full series via the new query).
- `booking-repository.ts`: `NewBookingData` gained optional `recurrenceId`; new tx-aware `createMany`
  (bulk insert) + `findByRecurrenceId` (startTime ASC, id ASC). `participant-repository.ts`: new
  `existsForBookingsAndEmployee(bookingIds, employeeId)` for the FR-27 participant-of-any-occurrence check.
- `booking-service.ts`: `create` runs the shared validations once (title/range/past/participants/room
  AVAILABLE/capacity — identical for every occurrence), then branches: recurring path generates
  occurrences pre-transaction (pure checks: zero-occurrence endDate, cap, cross-occurrence overlap),
  then per occurrence checks CONFIRMED-booking + maintenance overlap and bulk-inserts all bookings +
  participants **inside ONE `transaction('SERIALIZABLE')`** with the existing bounded retry;
  **the 23P01 → friendly CONFLICT mapping now covers the bulk path** (`createRecurringWithConflictMapping`
  re-queries per occurrence on exclusion_violation — closes the Phase 7 §9 warning; zero raw 500s in all
  concurrent rounds). Conflict/maintenance messages name WHICH occurrence plus the conflicting
  booking/window. Post-commit: `bookingCreated` per occurrence (**user decision: FR-23 per-occurrence
  granularity**). New `recurringBookingGroup(user, recurrenceId)`: trims + rejects empty id → NOT_FOUND
  when no occurrences; admin / organizer-of-any / participant-of-any (else FORBIDDEN).
- `booking-resolver.ts`: `recurringBookingGroup(recurrenceId: String!): [BookingType!]!` (`@Authorized()`);
  `createBooking` passes the recurrence through. `schema.ts`: `RecurrenceFrequency` registered.
  `bookings/index.ts` exports extended. **No migration** — `recurrence_id` column + index exist since Phase 2.
- **Verified live** (own instance on :4001 with log capture; ~35 assertions; every test row deleted after):
  anonymous → UNAUTHENTICATED on both new ops; introspection confirms enum + query; **DAILY series**
  (Orion, 3 occurrences, participants [3,4]) returns the first occurrence with full graph (room/organizer/
  participants); group query returns 3×startTime-ASC, 2 participants on EVERY occurrence; **WEEKLY series**
  steps exactly +7 days; single-occurrence edge (endDate == startTime) → 1 occurrence with recurrenceId;
  rejections all with exact messages: zero-occurrence endDate, cross-occurrence overlap (25.5h DAILY),
  cap (would generate 101), past start, start ≥ end, capacity (temp Vega cap 2 → restored 8), DISABLED
  room, admin → FORBIDDEN, `frequency: MONTHLY` → GRAPHQL_VALIDATION_FAILED; **conflicts**: first-occurrence
  vs seed standup, LATER-occurrence vs a blocker single booking (conflict detected at occurrence 3),
  first- + later-occurrence vs maintenance windows (temp window on room 7; Nova temporarily AVAILABLE for
  one probe, status restored) — every failed series left **zero partial rows** (atomicity);
  **concurrency 4/4 rounds** (3× recurring-vs-single + 1× recurring-vs-recurring, truly parallel):
  exactly one winner per slot, loser gets the friendly CONFLICT naming the winner's booking + the
  occurrence, exactly 1 DB row per slot, zero raw/500 errors; FR-23: exactly 6
  `[notification:BOOKING_CREATED]` log lines for the DAILY series (2 recipients × 3 occurrences with
  occurrence-specific times). `recurringBookingGroup` access matrix: organizer/participant-of-any/admin OK,
  unrelated employee → FORBIDDEN, unknown id → NOT_FOUND, empty/whitespace id → VALIDATION_ERROR.
  DB back to the exact seed baseline (9 bookings / 6 participants / 1 waitlist entry / 2 maintenance,
  recurrence groups = 1, Vega cap 8, Nova MAINTENANCE); the user's watch server on :4000 was probed and
  already serves the new query; `npm run typecheck` + `npm run build` pass both workspaces.
- **Seed-time gotcha learned:** seed `at(dayOffset)` times are relative to the day the SEED RAN
  (2026-09-25), not "today" — e.g. Nova's AC-repair maintenance window (Sep 25 00:00 → Sep 26 08:00)
  has already ENDED. Always read live booking/maintenance times from SQL before designing conflict tests.

Current GraphQL surface (`schema.ts`):
- Query: `health`, `currentUser`, `rooms` (filter), `room` (id), `equipment`, `myBookings`,
  `myMeetings`, `bookingDetails`, `recurringBookingGroup` (recurrenceId)
- Mutation: `signUp`, `logIn`, `adminLogin`, `logout`, `createRoom`, `updateRoom`,
  `setRoomStatus`, `createEquipment`, `updateEquipment`, `assignEquipmentToRoom`,
  `removeEquipmentFromRoom`, `createBooking` (input now has optional nested
  `recurrence { frequency, endDate }`), `cancelBooking`, `addParticipants`, `removeParticipant`
- Enums: `UserRole`, `RoomStatus`, `BookingStatus`, `RecurrenceFrequency` (all via `registerEnumType`)
- RoomType exposes `equipment: [EquipmentType]!` and `occupantCount`/`remainingCapacity: Int!` via field resolvers
- New types: `BookingType` (scalars + `room`/`organizer`/`participants` field resolvers),
  `ParticipantType` (+ `employee` field resolver)

## 6. Modules & Data Model

Module folders under `backend/src/modules/` (each: dto/, entities/, repositories/, resolvers/, services/, utils/, index.ts).
**auth**, **rooms**, **equipment** and **bookings** are fully layered (bookings now includes `utils/recurrence.ts`,
Phase 8). **participants** is layered
(repository/service/DTO/field resolvers + `addParticipants`/`removeParticipant` mutations, added in Phase 7).
**notifications** is a stub skeleton (dto/services/utils; real-time only, no entities — Phase 13 wires Socket.io).
**waitlist** has `services/waitlist-conversion-service.ts` only (Phase 7 stub; Phase 10 builds the real flow).
All other modules (checkin, maintenance, analytics) have only `entities/` populated.

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
    **Watch-server note (learned in Phase 5 session):** the server process listening on :4000 may be the
    child of the user's own `npm run dev:backend` (`node --watch` parent). Killing only the child makes the
    parent respawn it within seconds (picking up current code). To stop the dev backend for real, kill the
    `node --watch` parent; to verify which code a running server has, probe the GraphQL schema (e.g. a
    new query name) instead of trusting process start time. The user's `node --watch` server auto-reloads
    on file changes — no manual restart needed after edits.
10. Dev-only: Apollo includes `stacktrace` in GraphQL error extensions when `NODE_ENV=development`.
    Production would omit it (Phase 14 hardening).
11. **Git is managed manually by the user.** Do NOT commit, push, or create PRs from an AI
    session — the user handles all git operations themselves.
12. **GraphQL Date inputs must be full ISO-8601 WITH seconds.** type-graphql v2's built-in `Date`
    scalar is graphql-scalars' `DateTimeISO`: accepts `2026-09-26T18:00:00+05:30`, REJECTS
    `2026-09-26T18:00+05:30` (missing `:00` seconds) with `GRAPHQL_VALIDATION_FAILED`
    "DateTime cannot represent an invalid date-time-string". Frontend phases must always send
    full `HH:mm:ss` ISO strings (learned in Phase 6 testing).
13. **Watch-server state at Phase 7 close:** the user's `node --watch` server was RUNNING and healthy
    on :4000 for the whole Phase 7 session, and it auto-reloaded every edit (all live tests hit the
    current code without a manual restart). Note the reload is not instant — after editing a file,
    give it ~2–3s before the next request, or you will test stale code. At Phase 6 close the child
    had been DOWN and verification had used a manually started instance instead (Phase 7 reverted to
    the normal watch-server flow).

## 9. Pending Decisions / Next Steps

**Decided 2026-09-25:**
- **Forgot-password (FR-6/FR-7) is OUT OF SCOPE for this build.** No `PasswordResetToken`
  entity, no nodemailer. Marked as out of scope in `requirement.md` (§2 + FR-6/FR-7).
- **Phase 2 committed as a checkpoint** before starting Phase 3.
- `doc/plan.md` runner reference fixed (`tsx` → `ts-node`).
- **FR-47 (room occupant count / remaining capacity) was DEFERRED, now RESOLVED** — it was in
  `requirement.md` §3.13 but scheduled in NO phase of `plan.md`; the user chose to fold it into
  Phase 6 (booking backend) and it is DONE there (see Phase 6 section + §9 Phase 6 decisions).
- **`equipment` list query is available to all authenticated users** (not admin-only):
  FR-8/FR-10/FR-46 expose equipment to employees anyway (search filters + room details).

**Decided 2026-09-25 (Phase 6 session, user-approved):**
- **FR-47 folded into Phase 6 — DONE** (`RoomType.occupantCount`/`remainingCapacity` field resolvers).
- **Full `BookingType` exposed now** (room/organizer/participants via field resolvers) instead of
  scalars-only — makes FR-18/FR-23 verifiable via the API and pre-builds Phase 7's shape.
- **Notifications module skeleton created now** (logger stub); Phase 13 only swaps the emission
  internals to Socket.io.
- **Strict participant edge rules:** duplicate ids in `participantIds` → VALIDATION; organizer's own
  id in the list → VALIDATION (organizer is implicit and counted in capacity per FR-20); unknown
  employee id → NOT_FOUND.

**Decided 2026-09-25 (Phase 7 session, user-approved):**
- **Cancellation/change window = 30 minutes before `startTime`**, enforced identically for
  `cancelBooking`, `addParticipants` and `removeParticipant` (single source:
  `utils/booking-time-policy.ts`). At/after the cutoff is rejected; admins are NOT exempt.
- **`MyBookings` = every booking the user organizes, `startTime DESC`** (not future-only).
- **`MyMeetings` = strictly future** (`startTime > now`) **CONFIRMED** bookings where the user is
  organizer or participant, `startTime ASC`.
- **FR-28/FR-29/FR-30 folded into Phase 7** (add/remove participants on an existing booking + their
  notifications) — they were scheduled in no phase of `plan.md`.
- `addParticipants` takes a **batch** `employeeIds: Int![]` (one mutation, one SERIALIZABLE tx)
  rather than one employee per call.
- FR-33 waitlist conversion is a **post-commit no-op hook stub** here; FIFO conversion stays Phase 10.
- **`BookingType.participants` field resolver is auth-only**; FR-26 access lives on `bookingDetails`
  (root). Per-field re-authorization was tried and reverted — it breaks self-removal.
- No frontend/route/sidebar work in Phase 7; booking management UI is Phase 16 (per the user's deferral).

**Decided 2026-09-26 (Phase 8 session, user-approved):**
- Recurrence is exposed by **extending `createBooking`** with an optional nested
  `recurrence: { frequency: DAILY|WEEKLY, endDate }` input (no separate mutation). The mutation returns the
  **first occurrence** (`BookingType`); the full series is fetched via `recurringBookingGroup(recurrenceId)`.
- **Occurrence cap = 90** per series — a far DAILY end date would bulk-insert unbounded rows in one transaction.
- **FR-23 recurring notifications are per occurrence** (each occurrence is a real booking with its own times;
  N occurrences × P participants events, stub log lines now, Socket.io events in Phase 13).
- `recurrenceId` format for API-created series: `rc-<randomUUID>`; **endDate is inclusive**
  (occurrence start ≤ endDate; equal dates → a single-occurrence series is allowed).
- Cross-occurrence overlap is enforced by an explicit pairwise check at generation time
  (equivalent to duration ≤ cadence) plus the DB-level `EXC_bookings_room_no_overlap` constraint.

**Then Phase 9 — Check-in & No-show (backend track):**
- `checkIn` (FR-38: organizer or listed participant; FR-39: only inside an allowed window;
  FR-40: reject a second check-in), the `no-show-release` cron (release 10 minutes after start
  with no check-in) and the `booking-completion` cron.
- **Open question for the user at Phase 9 kickoff:** FR-39 says "an allowed time window relative
  to the booking's start time" but never states its length — `requirement.md` §2 only defines the
  10-minute no-show release. This is the same documentation gap the FR-31 cancellation window had
  (resolved as 30 min), so expect to make this decision explicitly.
- Also reconcile the **dual source of truth for check-in**: `Booking.hasCheckedIn` (boolean
  column) and the `check_ins` table both exist, while `requirement.md` §5 lists `Booking.checkIn`
  *and* a `CheckIn` entity. Decide which one is authoritative in Phase 9.

## 10. Verification Checklist Before Starting New Work

- [ ] Backend: `npm run typecheck` passes (both workspaces)
- [ ] DB reachable; `npm run migrate -w backend` says "No migrations to run"
- [ ] `npm run seed -w backend` idempotent (logs "Seed skipped" if run before)
- [ ] `npm run dev` → `/health` returns `{"status":"ok"}`

Report a change/decision here when it affects how the app runs (tooling, schema, phases, conventions).