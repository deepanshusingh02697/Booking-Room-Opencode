# OpenCode Project State — Meeting Room Intelligence

> Persistent AI handoff document. Update this file whenever the project state changes
> so a new OpenCode session or model can continue development without re-discovering context.

Last updated: 2026-09-26 (end of Phase 13 backend session; **Phase 13 — Real-time Notifications (backend) is
DONE — the BACKEND TRACK (Phases 4–13) IS COMPLETE. Next is Phase 14 — Rooms (Frontend), the first frontend phase**)
Repo: `Book-MeetingRoom` (branch `main`)
Working tree at session close: **uncommitted Phase 9 + Phase 10 + Phase 11 + Phase 12 + Phase 13 changes**.
Phase 13 added the real-time layer: `src/realtime/events.ts` (one socket event per notification type +
the ISO-string wire payload type), `src/realtime/socket.ts` (Socket.IO server, cookie-handshake auth,
per-user `user:<id>` rooms, `emitToUser`, `closeSocketServer`), `src/common/cookie-header.ts` (raw
`Cookie:` header parsing so the handshake and Express share one cookie reader), and rewired
`common/context.ts` (`userFromCookies` / `userFromCookieHeader` — now the single token→user mapping for
both transports) + `auth/utils/jwt.ts` (exports `SESSION_COOKIE`, now imported by the auth resolver,
the context and the socket handshake). `NotificationService` keeps its `[notification:TYPE]`
`logger.info` line **and** emits the event; `server.ts` creates the HTTP server before
`initSocketServer(server)` and awaits `closeSocketServer()` in the shutdown path. New
`backend/scripts/socket-verify.ts` (`npm run socket:verify -w backend`) + `socket.io-client` in
backend devDependencies. **No migration** (no schema change). Phase 12 built
`modules/analytics/` from an empty folder skeleton — `dto/date-range-input.ts`,
`dto/usage-analytics-type.ts` (+`toUsageAnalyticsType`), `repositories/analytics-repository.ts`
(read-only), `services/analytics-service.ts`, `resolvers/analytics-resolver.ts`, new `index.ts`;
`schema.ts` (+1 resolver). **No migration** (read-only aggregates over existing columns/indexes).
Phase 11 layered
`modules/maintenance/` end to end — `dto/create-maintenance-input.ts`, `dto/maintenance-type.ts`
(+`toMaintenanceType`), `repositories/maintenance-repository.ts` (tx-aware `create`, `findById`,
`findForRoom`, `deleteById`), `services/maintenance-service.ts` (SERIALIZABLE + bounded retry, reuses
`BookingRepository.findConflictingBooking`/`findConflictingMaintenance` inside its own transaction),
`resolvers/maintenance-resolver.ts` + `maintenance-room-field-resolver.ts`, new `index.ts`;
`schema.ts` (+2 resolvers). **No migration** (table + `reason` + index + `CHK start < end` all exist
since Phase 2). Phase 10 added the full
`modules/waitlist/` layering — `dto/join-waitlist-input.ts`, `dto/waitlist-entry-type.ts`,
`repositories/waitlist-repository.ts`, `services/waitlist-service.ts`,
`utils/waitlist-conversion.ts`, `resolvers/waitlist-resolver.ts` +
`waitlist-entry-room-field-resolver.ts` + `waitlist-entry-employee-field-resolver.ts`, rewritten
`index.ts`; `waitlist/services/waitlist-conversion-service.ts` went from stub to real FIFO
conversion (takes an injected `WaitlistBookingCreator`); `bookings/services/booking-service.ts`
(`cancel` passes `(user, data) => this.create(user, data)` into the hook);
notifications dto/builders/service (+`WAITLIST_CONVERTED`); `schema.ts` (+3 resolvers).
Phase 9 (check-in module, both cron jobs, migration `1730000000003`) is still uncommitted too.
Phases 5–8 were committed before this session (commit `068eb30`).
The user commits manually (§8.11); if the tree is clean when you read this, Phases 9–12 are committed.

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
**backend track** (Phases 4–13, one feature per phase — **CLOSED/DONE as of 2026-09-26**), then a
**frontend track** (Phases 14–23, same feature order, **starting with Phase 14**), then hardening
(Phase 24) and docs (Phase 25).

## 2. Repo Layout

```
.
├── doc/                 plan.md, requirement.md (source of truth)
├── backend/             Express + TypeGraphQL + TypeORM (ts-node)
│   ├── scripts/         migrate.ts, migrate-revert.ts, socket-verify.ts (custom runners)
│   └── src/
│       ├── config/       env.ts, data-source.ts
│       ├── common/       context.ts, auth-checker.ts, health-resolver.ts, cookie-header.ts, errors/, logger.ts
│       ├── modules/      per-feature module folders (see §6)
│       ├── realtime/     events.ts, socket.ts  (Phase 13)
│       ├── jobs/         registry.ts + no-show-release.ts, booking-completion.ts (Phase 9)
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
| Real time | Socket.io | **wired in Phase 13** — `realtime/socket.ts`, cookie handshake auth, per-user rooms |
| Security/Automation | JWT, bcryptjs, class-validator, node-cron | auth implemented (Phase 3); node-cron jobs live since Phase 9 |
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
npm run socket:verify -w backend  # bare Socket.IO client: verifies all 5 real-time notification events
npm run build                    # backend tsc → dist, frontend vite build
```

Backend endpoints: `http://localhost:4000/health`, `http://localhost:4000/graphql`,
`http://localhost:4000/socket.io` (Socket.IO, cookie handshake auth).

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

### Phase 9 — Check-in & No-show (Backend): ✅ DONE (verified 2026-09-26)
- **User-approved decisions (asked at kickoff per §9):**
  - **FR-39 check-in window = [startTime, startTime + 10 min)** — the same 10-minute constant as the
    no-show release (single source: `checkin/utils/check-in-window.ts`, `CHECK_IN_WINDOW_MINUTES`).
    Check-in opens exactly at start; closes exactly when the room would be released.
  - **`check_ins` table is the single source of truth** — `bookings.has_checked_in` column DROPPED
    (migration `1730000000003-DropBookingHasCheckedIn`; `down()` re-adds the column and backfills it
    from `check_ins` — verified both directions). `BookingType.hasCheckedIn` (still `Boolean!`) is now
    a field resolver over `check_ins`; new nullable `BookingType.checkIn: CheckInType` exposes who/when
    (+ `CheckInType.employee` field resolver). DB-level FR-40 guarantee = `UQ_check_ins_booking`
    unique(booking_id); the service also maps pg `23505` on the insert to a friendly CONFLICT (safety
    net beyond the pessimistic lock).
  - **Ended-but-never-checked-in → NO_SHOW, not COMPLETED** — `booking-completion` only completes
    bookings that HAVE a check-in row; `no-show-release` claims any CONFIRMED no-check-in booking
    whose start+10 min has passed (even if the meeting already ended). Deterministic: checked-in
    bookings always end COMPLETED, never-checked-in ones always end NO_SHOW.
  - **CHECK_IN notification stub notifies the organizer only**, and NOT when the organizer themself
    checks in (no self-notification). Logger stub now; Socket.io in Phase 13.
- `modules/checkin/` fully layered: `utils/check-in-window.ts`, `dto/check-in-type.ts` (+`toCheckInType`),
  `repositories/check-in-repository.ts` (tx-aware `create`, `findByBookingId(InTransaction)`),
  `services/check-in-service.ts`, `resolvers/check-in-resolver.ts` (mutation `checkIn(id: Int!): BookingType!`,
  plain arg like `cancelBooking`), `resolvers/booking-check-in-field-resolver.ts` (`hasCheckedIn`,
  `checkIn` on BookingType, auth-only like other field resolvers),
  `resolvers/check-in-employee-field-resolver.ts`, `index.ts`.
- **`checkIn` rules (one default-isolation transaction with `findByIdForUpdate` pessimistic lock,
  mirroring `addParticipants`):** booking exists (NOT_FOUND) → organizer or listed participant
  (FORBIDDEN otherwise — **an admin who is not organizer/participant is rejected too**; FR-38 is
  strict, but an admin who IS a listed participant can check in — no blanket role gate) → status
  CONFIRMED (else VALIDATION) → window open (two distinct messages: "Check-in opens at …" before
  start / "The check-in window closed 10 minutes after …" past start+10) → no existing check-in row
  (CONFLICT) → insert `check_ins` row (who + when). Post-commit: notification stub.
- **Cron jobs (both `* * * * *`, registered in `registry.ts` which now imports the job files and
  exports the `Job` type):** `no-show-release` → `CheckInService.releaseNoShows(now)` — one tx:
  candidate SELECT (CONFIRMED + startTime ≤ now−10min + NOT EXISTS check_ins, typed subquery) then
  per candidate lock + re-check + CAS `UPDATE … WHERE status='CONFIRMED'` → NO_SHOW; post-commit
  `waitlistConversionService.onBookingNoShowReleased` stub (Phase 10 wires FIFO here) + INFO log.
  `booking-completion` → `BookingService.completeFinishedBookings(now)` — same lock/re-check/CAS
  pattern over (CONFIRMED + endTime ≤ now + EXISTS check_ins) → COMPLETED + INFO log.
  **Locking design note:** both jobs and `checkIn` take the bookings-row pessimistic lock, so a
  check-in racing the release serializes correctly (check-in commits → job re-check sees the row and
  skips; job commits NO_SHOW → check-in's locked read rejects non-CONFIRMED).
- **Verified live** (own instance on :4001 with log capture, user's watch server on :4000 running the
  same code+crons concurrently — both idempotent): ~25 assertions, all PASS — anonymous →
  UNAUTHENTICATED; fresh booking `hasCheckedIn:false`/`checkIn:null` (field resolver on the mutation
  return); too-early and window-closed VALIDATION with exact messages; organizer and participant
  check-in success (mutation return shows `hasCheckedIn:true` + full checkIn graph; persisted via
  `bookingDetails` incl. `employee`); FR-40 duplicate (other participant AND same user) → CONFLICT;
  unrelated employee → FORBIDDEN; admin (not on booking) → FORBIDDEN; CANCELLED booking → VALIDATION;
  unknown id → NOT_FOUND; exactly one `[notification:CHECK_IN]` line (recipient=organizer, participant
  checked in) and none for the organizer's self check-in. **no-show cron:** overlapping createBooking
  → CONFLICT while CONFIRMED, then `[no-show-release]` log + NO_SHOW within ~40s, then the same
  overlap → SUCCESS (room actually freed); waitlist stub debug line fires. **completion cron:** ended
  + checked-in → COMPLETED within ~25s; ended + never-checked-in stays CONFIRMED within grace, then
  becomes **NO_SHOW (not COMPLETED)** once grace passes (decided semantics verified).
  **`myBookings` field-resolver matrix:** all 6 test bookings correct (CONFIRMED/true+row,
  NO_SHOW/false+null, CANCELLED, COMPLETED/true+row). Passive proof on real data: the user's :4000
  cron auto-released seed bookings 1–4 (yesterday's/today's CONFIRMED no-check-in meetings) to
  NO_SHOW and correctly left future standups 5/6, COMPLETED-with-check-in 7 and CANCELLED 8.
  All test rows deleted (cascade); DB back to its true baseline (40 bookings = 9 seed + 31 user
  series, 68 participants, 1 check_in on booking 7, 1 waitlist, 2 maintenance). `npm run typecheck`
  + `npm run build` pass both workspaces; migrate → revert → migrate clean (down backfill verified:
  booking 7 got `t`, rest `f`).
- **FYI (dev DB):** seed row `checkedInAt` for booking 7 is still 09:55 (pre-rule) — seed is
  idempotent-skip so the fix (10:02, in-window) only applies to fresh DBs. Harmless.

### Phase 10 — Waitlist (Backend): ✅ DONE (verified 2026-09-26)
- **User-approved decisions (asked at kickoff per §9 — see §9 "Decided 2026-09-26 (Phase 10 session)").**
- `modules/waitlist/` is now fully layered: `dto/join-waitlist-input.ts` (`JoinWaitlistInput` =
  `roomId` + `startTime` + `endTime`; **no title/description** — the waitlist entry has nowhere to
  store them), `dto/waitlist-entry-type.ts` (`WaitlistEntryType` + `toWaitlistEntryType`, with
  `room`/`employee` relation fields), `repositories/waitlist-repository.ts` (`create`, `findById`,
  `findByEmployee` (createdAt ASC, id ASC), `findOverlappingForEmployee`, `findFifoOverlappingForRoom`
  (overlap + createdAt ASC, id ASC), `deleteById`),
  `services/waitlist-service.ts`, `utils/waitlist-conversion.ts` (`WAITLIST_CONVERSION_TITLE =
  'Waitlisted booking'`), `resolvers/waitlist-resolver.ts` (query `myWaitlist`, mutations
  `joinWaitlist(input)` / `leaveWaitlist(entryId: Int!): Boolean!`) and two auth-only field resolvers
  (`room` via `RoomService.getById`, `employee` via `AuthService.currentUser` — same shape as the
  booking/participant/check-in field resolvers), plus a rewritten `index.ts`.
- **`joinWaitlist` rules** (all `@Authorized()`; employee-only, mirroring `createBooking`):
  start < end; start strictly in the future; room exists (NOT_FOUND) and `AVAILABLE`
  (VALIDATION, message names the room + status); **no overlapping maintenance window** (VALIDATION,
  message includes the reason) — checked *before* the availability check, so a maintenance-blocked
  slot never reads as "joinable"; **an overlapping CONFIRMED booking must exist** (else VALIDATION
  "Room X is available for the requested time. Book it directly instead of joining the waitlist.");
  duplicate = **any existing entry of the same user in the same room whose window overlaps**
  (CONFLICT) + pg `23505` mapped to the same CONFLICT as a safety net. No transaction: the
  `UQ_waitlist_room_employee_start` index from Phase 2 is the FR-35 guarantee.
- **`leaveWaitlist`** — `Boolean!`; entry must exist (NOT_FOUND) and belong to the caller
  (**FORBIDDEN for anyone else, admins included** — strict FR-36, same call as the Phase 9 check-in
  decision); returns `false` → mapped to CONFLICT only if the delete affected 0 rows.
- **`myWaitlist`** — any authenticated user, **all** their entries in `createdAt ASC, id ASC`
  (FR-37 literal; no time filtering — the Phase 20 UI can filter).
- **FR-33 FIFO conversion (real now, both stubs replaced).** `onBookingCancelled(booking,
  createBooking)` returns the created `Booking | null`:
  candidates = entries in the same room **overlapping the freed slot**, `createdAt ASC, id ASC`;
  one early skip when the room is missing or not `AVAILABLE` (logged once, no per-entry noise);
  then the **first candidate that converts wins** (per user decision — not all of them). The booking
  is created at the **freed slot's exact times** with the **generated title**, the waiter as
  **organizer**, no participants, no `recurrenceId`; the entry is then deleted and a
  **`WAITLIST_CONVERTED`** notification goes to the waiter (carries the *waitlist* window alongside
  the booking times, since they can differ). `create` is invoked through an **injected
  `WaitlistBookingCreator`** — see §8.17 for why — so the conversion reuses the whole FR-18..21 rule
  engine, the SERIALIZABLE retry and the `23P01` → friendly-CONFLICT mapping instead of adding a
  second insert path into `bookings`. Conversion is **best effort by design**: a failing candidate is
  logged at `warn` and the loop moves to the next entry, because `cancelBooking` has already committed
  and must not report an error for a successful cancellation.
- **`onBookingNoShowReleased` is now a documented no-op** (user decision): the no-show release fires at
  `start + 10 min`, i.e. exactly when the check-in window closes, so any converted booking would start
  in the past and be released again on the next tick — draining the whole waitlist one entry per
  minute. It logs an INFO line naming the skipped booking; the call site in `check-in-service.ts` is
  unchanged so the wiring stays visible for Phase 13.
- **Verified live** (watch server on :4000, logs captured to `/tmp/mri-phase10-server.log`;
  **66 assertions + 9 concurrency assertions, all PASS**, every test row deleted afterwards):
  anonymous → UNAUTHENTICATED on all three operations; admin `myWaitlist` OK / `joinWaitlist` →
  FORBIDDEN; start ≥ end, past start, unknown room, DISABLED room, MAINTENANCE-status room, free slot
  and maintenance-blocked slot all rejected with the exact messages (maintenance message includes
  "Phase10 verify"); `joinWaitlist` returns the full `room { name } employee { email }` graph;
  overlapping duplicate → CONFLICT while an adjacent free window is rejected for being *available*;
  `myWaitlist` ordered by join time (not slot time) and per user; `leaveWaitlist` FORBIDDEN for
  another user's entry / NOT_FOUND for an unknown id / `true` for own entry (and rohan keeps only the
  seed entry id 1 afterwards). **Conversion chain:** blocker 11:00–12:00 with priya (11:00), sara
  (11:15) and rohan (12:00, non-overlapping) waiting → cancel converts **priya first** (booking at
  11:00–12:00, CONFIRMED, `recurrenceId: null`), the freed slot is genuinely occupied again (a new
  `createBooking` there → CONFLICT), priya's entry is gone while her other entry and sara's/rohan's
  entries survive; priya cancelling her converted booking converts **sara** next; sara cancelling hers
  converts **nobody** (rohan's window does not overlap the freed slot) and exactly 2 `Waitlisted
  booking` rows ever exist. **Recurring:** cancelling one occurrence of a 3-occurrence DAILY series
  converts the waiter into a standalone booking with `recurrenceId: null`. **No-show:** a probe
  booking SQL-shifted to start 15 min ago was released to `NO_SHOW` by the cron, the waiting entry
  **survived**, no booking was created for the waiter, and the skip INFO line was logged.
  **Concurrency:** 5 truly parallel identical `joinWaitlist` calls → exactly 1 success, 4 clean
  `CONFLICT`s, 1 DB row; 2 parallel `cancelBooking` on the same booking → exactly 1 `CANCELLED` +
  1 `VALIDATION_ERROR`, **exactly one** conversion booking (no double-fire), net +1 row.
  3 `WAITLIST_CONVERTED` + 3 conversion INFO log lines confirmed.
   DB back to the exact baseline (40 bookings / 68 participants / 1 waitlist / 2 maintenance / 1 check_in,
   seed waitlist entry id 1 intact). `npm run typecheck` + `npm run build` pass both workspaces;
   `npm run migrate -w backend` → "No migrations to run" (**Phase 10 added no migration** — every column
   it needs has existed since Phase 2).

### Phase 11 — Maintenance Management (Backend): ✅ DONE (verified 2026-09-26)
- **User-approved decisions (asked at kickoff per §9 — see §9 "Decided 2026-09-26 (Phase 11 session)").**
- `modules/maintenance/` went from **only `entities/maintenance.ts`** to fully layered:
  `dto/create-maintenance-input.ts` (`roomId` + `startTime` + `endTime` + optional `reason`,
  `MaxLength(1000)`), `dto/maintenance-type.ts` (`MaintenanceType` + `toMaintenanceType` — `reason` is
  `@Field({ nullable: true })` and mapped `?? undefined`, mirroring `BookingType.description`),
  `repositories/maintenance-repository.ts` (tx-aware `create(manager, data)`,
  `findById`, `findForRoom` (**startTime ASC, id ASC**), `deleteById` → boolean),
  `services/maintenance-service.ts`, `resolvers/maintenance-resolver.ts` +
  `resolvers/maintenance-room-field-resolver.ts` (auth-only `room` via `RoomService.getById`, same shape
  as the waitlist/booking field resolvers), new `index.ts`. **No migration** — table, `reason` column,
  `(room_id, start_time)` index and `CHK start < end` all exist since Phase 2.
- **Surface:** query `roomMaintenance(roomId: Int!): [MaintenanceType!]!` (`@Authorized()` — all
  authenticated, Phase 5 `equipment`-list precedent); mutations `createMaintenance(input:
  CreateMaintenanceInput!): MaintenanceType!` and `deleteMaintenance(id: Int!): Boolean!` — both
  `@Authorized(UserRole.ADMIN)` **and** re-checked by the service (`requireRole`, room-service style).
- **`createMaintenance` rules** (in order): admin → `reason` trimmed, blank-after-trim → VALIDATION
  ("Maintenance reason cannot be empty.", same guard as booking description) → `startTime < endTime`
  (VALIDATION) → **room must exist only, no status gate** (user decision) → then ONE
  `transaction('SERIALIZABLE')` with the **same bounded retry** as `createBooking` (3 attempts, 50ms ×
  attempt, retries on 40001/40P01 + message sniff, exhaustion → friendly CONFLICT "The room schedule was
  updated while the maintenance window was being saved. Please try again."). Inside that tx it reuses the
  **`BookingRepository.findConflictingBooking` / `findConflictingMaintenance` pair (both take an
  `EntityManager` first arg)** exactly as §9 planned — booking conflict first (CONFLICT naming title +
  times, identical wording to `buildBookingConflictMessage`), then maintenance conflict (CONFLICT with
  the existing window's times + reason suffix). No new overlap queries were written, and no 23P01
  mapping is needed (the `maintenance` table has no exclusion constraint — SSI + the app-level recheck
  is the guarantee).
- `deleteMaintenance` → entry must exist (NOT_FOUND "Maintenance record not found.") then delete;
  `deleteById` affecting 0 rows → CONFLICT. Returns `true`.
- `roomMaintenance` → room must exist (NOT_FOUND) then chronological windows; **all statuses, no time
  filtering** (FR-43 literal, like `myWaitlist`).
- **Verified live** (watch server on :4000): **30 sequential + 6 concurrency assertions, all PASS**, all
  test rows deleted afterwards. anonymous → UNAUTHENTICATED on all three operations; employee →
  FORBIDDEN on both mutations but **OK on `roomMaintenance`** (incl. the `room { name status }` field
  resolver); start ≥ end, blank reason → VALIDATION_ERROR with the exact messages; unknown room → NOT_FOUND;
  create with **no reason** returns `reason: null` + resolved `room { name }`; create on a **DISABLED** room
  → success; **past/ongoing** window → success; **adjacent** window (end == next start) → success;
  chronological order proven with rows inserted out of order (3 rows room 5: Sep 20 → Oct 1 → Oct 2, UTC
  `Z` serialization compared, not `+05:30` prefixes); overlap with the Sep 27 **"Recurring Standup"**
  CONFIRMED booking → CONFLICT naming the booking; overlap with the seed **"Room disabled - renovation"**
  window → CONFLICT with the reason in the message. **Phase Done-when (availability):** `rooms(filter:
  {startTime, endTime})` excluded the maintained room (and Polaris via its seed window), a `createBooking`
  inside the window → CONFLICT "under maintenance", a `joinWaitlist` inside it → VALIDATION
  maintenance-blocked; after `deleteMaintenance` the room reappeared in search and the **same slot became
  bookable** (a real CONFIRMED booking), and a repeat delete → NOT_FOUND. **Concurrency: 3/3 rounds** of two
  truly parallel identical `createMaintenance` → exactly 1 winner + 1 friendly CONFLICT + exactly 1 DB row
  per slot; **3/3 rounds** of parallel `createMaintenance` (admin) vs `createBooking` (employee) on the same
  room+slot → exactly 1 winner, loser always a friendly error, **no raw 500s** (maintenance won all 3 —
  it has less pre-transaction work, so the booking side loses and hits the retry → app-level recheck path
  already proven in the booking-over-maintenance and maintenance-over-booking assertions). Cleanup via SQL;
  maintenance back to the exact 2 seed rows (ids 1, 2), zero `Phase11%` bookings. `npm run typecheck` +
  `npm run build` pass both workspaces.
- **FYI (dev DB, user activity — do NOT delete):** the live baseline drifted since the Phase 10 session
  while the user used the app: **42 bookings / 72 participants / 2 waitlist entries / 2 maintenance /
  1 check-in / 6 rooms** (was 40/68/1/2 in §8.16).

### Phase 12 — Admin Calendar & Analytics (Backend): ✅ DONE (verified 2026-09-26)
- **User-approved decisions (asked at kickoff per §9 — see §9 "Decided 2026-09-26 (Phase 12 session)").**
- `modules/analytics/` went from an **empty folder skeleton** to fully layered: `dto/date-range-input.ts`
  (`DateRangeInput { startTime, endTime }` — bare `@Field()` `Date` fields with **no class-validator
  decorators**, deliberately matching `CreateBookingInput`/`JoinWaitlistInput`: the codebase convention
  is that the GraphQL `DateTimeISO` scalar enforces shape and the **service** owns range rules, so
  ordering is validated in `AnalyticsService`, not in the DTO),
  `dto/usage-analytics-type.ts` (`UsageAnalyticsType` = `roomId`/`roomName`/`totalBookings`/
  `cancellations`/`noShows`, all `Int` + `toUsageAnalyticsType` mapper, which takes the repository row
  via a **type-only** import so there is no runtime edge), `repositories/analytics-repository.ts`
  (`findBookingsOverlapping`, `findUsageByRoom`), `services/analytics-service.ts`,
  `resolvers/analytics-resolver.ts`, new `index.ts`. **`entities/` deliberately stays empty** — this
  module owns no tables (plan.md §3.2 gives analytics no entities; all reads go through the `Booking` /
  `Room` entities). **No migration.**
- **Surface:** queries `adminCalendar(input: DateRangeInput!): [BookingType!]!` and
  `usageAnalytics(input: DateRangeInput!): [UsageAnalyticsType!]!` — both `@Authorized(UserRole.ADMIN)`
  (FR-44/FR-45) **and** re-checked by the service (`requireRole`). `adminCalendar` **reuses `BookingType`**,
  so the existing `room`/`organizer`/`participants`/`hasCheckedIn`/`checkIn` field resolvers light up on
  calendar rows with no new types — the `recurringBookingGroup` precedent.
- **Range basis (both queries): interval overlap** — `startTime < rangeEnd AND endTime > rangeStart`,
  i.e. half-open `[rangeStart, rangeEnd)`: a booking starting exactly at `rangeEnd`, or ending exactly at
  `rangeStart`, is excluded. Reuses the exact condition shape of
  `BookingRepository.findConflictingBooking`, so "what overlaps" means the same thing in Phases 6–12.
- **`adminCalendar`:** **all statuses** (CONFIRMED + COMPLETED + CANCELLED + NO_SHOW — FR-44 "all
  bookings"; the admin audit view is the point), office-wide across every room, ordered `startTime ASC,
  id ASC`. Historical/past ranges allowed; the only validation is `startTime < endTime` → VALIDATION
  ("Date range start time must be before end time.").
- **`usageAnalytics`:** one row per room via `rooms LEFT JOIN bookings ON <overlap>` grouped by
  `room.id, room.name`, ordered `room.name ASC`. **Every room appears, including idle ones with
  0/0/0** (a LEFT JOIN, not an inner join). `totalBookings = COUNT(booking.id)` over **all statuses**,
  `cancellations`/`noShows` are the `COUNT(CASE WHEN status = … THEN 1 END)` subsets — so the three
  numbers always reconcile (`total ≥ cancellations + noShows`, and `sum(total)` = the calendar count).
  COUNTs come back as strings from `getRawMany`, so the repository `Number()`-normalises every field —
  the same defensive normalisation `room-repository.findBusyRoomIds` does on its raw `roomId`s
  (`room-repository.ts:103-106`).
- **Verified live** (watch server on :4000): **20 assertions, all PASS** — the strongest ones compare the
  API output against **SQL ground truth computed in the test script** rather than against hand-written
  expectations. anonymous → UNAUTHENTICATED on both queries; employee → FORBIDDEN on both; `start == end`,
  `start > end` → VALIDATION_ERROR with the exact message; a 2020 (historical) range is accepted.
  **Calendar:** wide range (Sep 1 2026 → Jan 1 2027) returned **exactly the 42 booking ids SQL reports**;
  a second range (Sep 27 → Oct 1) matched its SQL truth (the 2 standups); ordering verified as
  `startTime ASC, id ASC`; all four statuses present in one response; a 2030 range → `[]`; **both
  half-open boundaries** verified (a booking starting at `rangeEnd` and one ending at `rangeStart` are
  both excluded); the full nested graph resolves on a calendar row (booking 200 → room `heaven`,
  organizer `rohan@gmail.com`, 2 participants each with `employee.email`, `hasCheckedIn: false`).
  **Analytics:** per-room rows **== the SQL aggregate** for the wide range and for Sep 27 → Oct 1; all 6
  rooms present **including `Polaris 0.03` at 0/0/0**; reconciliation holds (sum 42 = calendar count,
  every `total ≥ cancelled + noShows`); an empty 2030 range returns 6 rows of zeros.
  (One assertion was initially written against booking 5 expecting participants — bookings 5/6 genuinely
  have **zero** participants; the field-resolver check was re-run against booking 200, which has 2.)
- **Read-only phase: the DB was not touched** — before/after counts identical
  (42 bookings / 72 participants / 2 waitlist / 2 maintenance / 1 check-in / 6 rooms). `npm run migrate -w
  backend` → "No migrations to run". `npm run typecheck` + `npm run build` pass both workspaces.
- **Notes for Phase 13:** swapping the five `NotificationService` logger stubs
  for Socket.io emissions was the only backend work left — **DONE, see the Phase 13 section below.** The
  Phase 22 frontend will need `adminCalendar` + `roomMaintenance` composed to draw maintenance blocks on
  the admin calendar, since `adminCalendar` intentionally returns bookings only.

### Phase 13 — Real-time Notifications (Backend): ✅ DONE (verified 2026-09-26) — BACKEND TRACK COMPLETE
- **User-approved decisions (asked at kickoff per §9 — see §9 "Decided 2026-09-26 (Phase 13 session)").**
- **New `src/realtime/` (2 files, plus one new `common/` file):**
  - `realtime/events.ts` — `NOTIFICATION_EVENTS` map (**one event name per notification type**:
    `notification:BOOKING_CREATED`, `notification:PARTICIPANT_ADDED`, `notification:PARTICIPANT_REMOVED`,
    `notification:CHECK_IN`, `notification:WAITLIST_CONVERTED` — the names mirror the existing
    `[notification:TYPE]` log tag), `notificationEventName(type)`, and the **wire payload type**
    `NotificationEventPayload` + `toNotificationEventPayload()`. The wire type is the same shape as
    `NotificationPayload` except every date is an **ISO-8601 string** (Socket.IO transports JSON, so a
    `Date` would silently become a string anyway; the explicit type keeps the client contract honest).
    `WAITLIST_CONVERTED` carries `waitlistStartTime`/`waitlistEndTime` next to the booking times;
    `CHECK_IN` carries `checkedInByName`.
  - `realtime/socket.ts` — `initSocketServer(httpServer)` creates the Socket.IO server
    (`cors: { origin: env.FRONTEND_ORIGIN, credentials: true }`, same origin/credentials as the Express
    CORS config), an `io.use` middleware resolves the session from the **handshake `Cookie:` header**
    and **rejects** with `next(new Error('Unauthorized'))` when it is missing/invalid, and on connection
    joins the socket to the per-user room `user:<employeeId>`. Also exports `emitToUser(employeeId,
    event, payload)` (the only entry point `NotificationService` uses) and `closeSocketServer()`.
    Connect/disconnect/rejected-handshake are logged (INFO/WARN).
  - `common/cookie-header.ts` — `parseCookieHeader()` + `readCookie()`. `cookie-parser` does **not**
    re-export its parser (only `JSONCookie(s)`/`signedCookie(s)`), and the handshake never passes
    through Express middleware, so this small parser is the one cookie reader both transports use.
- **One token→user mapping for both transports:** `common/context.ts` now exports
  `userFromCookies(cookies)` **and** `userFromCookieHeader(header)`; `buildContext()` is a thin wrapper
  over the former, and the socket middleware uses the latter. `SESSION_COOKIE = 'token'` moved from a
  private const in `auth/resolvers/auth-resolver.ts` to `auth/utils/jwt.ts` and is now imported in all
  three places (single source, no third copy).
- **Transport swap in `NotificationService`:** the five public methods and their five call sites
  (`booking-service.ts` ×4, `check-in-service.ts`, `waitlist-conversion-service.ts`) are **unchanged**;
  only the private `emit()` changed — it now calls `this.log()` (the **same** `[notification:TYPE]`
  `logger.info` line as before, kept deliberately) and then
  `emitToUser(recipientId, notificationEventName(type), toNotificationEventPayload(payload))`.
  All five payload builders stayed untouched (they were already written and tested in Phase 6).
  **No new payload types** — no `BOOKING_CANCELLED`, no `NO_SHOW_RELEASED`.
- **`server.ts`:** `http.createServer(app)` moved above the shutdown block, `initSocketServer(server)`
  is called before `server.listen()`, and shutdown is now `stopJobs() → apollo.stop() →
  await closeSocketServer()` (which also closes the HTTP server) → `process.exit(0)`. The `listen`
  callback logs the `/socket.io` endpoint.
- **Verification client (new `backend/scripts/socket-verify.ts`, `npm run socket:verify -w backend`):**
  logs priya/aarav/sara/rohan in over GraphQL, opens one socket per employee (`transports: ['websocket']`,
  `extraHeaders: { cookie: token }`), drives every notification-producing mutation through the public
  API, and asserts delivery + **absence of cross-talk**. `socket.io-client` was added to
  **backend devDependencies** (it was only a frontend dep before). Env overrides: `VERIFY_SERVER_URL`
  (default `http://localhost:${PORT}`).
- **Verified live (watch server on :4000):** **27/27 checks PASS** — `handshake without a session cookie
  is rejected` and `handshake with an invalid token is rejected` (both `error="Unauthorized"`);
  4 authenticated sockets connect; **BOOKING_CREATED** reaches the participant's socket with the exact
  payload (recipient/room/organizer/times) and fires **exactly once per recipient** (not once per
  booking); **PARTICIPANT_ADDED** reaches the added employee; **PARTICIPANT_REMOVED** reaches the removed
  employee; **CHECK_IN** reaches the organizer with `checkedInByName="Rohan Mehta"`; **WAITLIST_CONVERTED**
  reaches the waiter after a cancellation, carrying both the converted booking times and the waitlist
  window, and the converted booking is confirmed CONFIRMED + owned by the waiter. **11 negative
  assertions** prove per-user rooms: the organizer never receives `BOOKING_CREATED`/
  `PARTICIPANT_ADDED`/`PARTICIPANT_REMOVED`/`WAITLIST_CONVERTED`, the checking employee never receives
  `CHECK_IN`, and no unrelated socket ever receives anything. Script self-cleanup verified: before/after
  counts identical (42 bookings / 72 participants / 1 check-in / 2 waitlist entries).
- **Verified separately on a second instance (:4001, logs captured to `/tmp/mri-p13-server.log`):** boot
  logs `Socket.io ready for origin http://localhost:5173`, the same instant logs
  `Socket connected: employee 5 (EMPLOYEE) joined room user:5.` **and**
  `[notification:BOOKING_CREATED] user 5 invited to …` (log + socket coexist, as decided), the client
  receives the ISO-string payload, and `SIGINT` → `All cron jobs stopped` / `Server closed` / port
  released.
- **DB untouched overall:** Phase 13 adds **no migration** (`npm run migrate -w backend` → "No migrations
  to run"). Baseline after the session: **42 bookings / 72 participants / 1 check-in / 2 waitlist entries
  / 2 maintenance / 6 rooms** (the Phase 12 baseline; three orphaned `Phase13%` bookings from an earlier
  aborted run of the script were deleted).
  `npm run typecheck` + `npm run build` pass both workspaces; `git diff --check` clean.
- **Script bug worth remembering (cost one debugging round):** the first `connect()` helper armed a
  5s `setTimeout` that was **never cleared** on success, so it called `socket.close()` on all four
  sockets 5s after they connected. The first three flows finished inside that window and passed; the
  check-in (90s later) and the waitlist steps then saw **no delivery at all** and looked like a server
  bug. Any promise-with-timeout around a socket must `clearTimeout` (and `off()` its listeners) on
  settle — the committed `connect()` does.
- **Backend track closed (plan.md §M3):** the complete GraphQL + Socket.IO API now exists and has been
  exercised directly, with no UI. Everything from here is frontend, feature by feature, in the same order.

Current GraphQL surface (`schema.ts`):
- Query: `health`, `currentUser`, `rooms` (filter), `room` (id), `equipment`, `myBookings`,
  `myMeetings`, `bookingDetails`, `recurringBookingGroup` (recurrenceId), `myWaitlist`,
  `roomMaintenance` (roomId), `adminCalendar` (input: DateRangeInput), `usageAnalytics` (input: DateRangeInput)
- Mutation: `signUp`, `logIn`, `adminLogin`, `logout`, `createRoom`, `updateRoom`,
  `setRoomStatus`, `createEquipment`, `updateEquipment`, `assignEquipmentToRoom`,
  `removeEquipmentFromRoom`, `createBooking` (input now has optional nested
  `recurrence { frequency, endDate }`), `cancelBooking`, `addParticipants`, `removeParticipant`,
  `checkIn(id)`, `joinWaitlist(input: JoinWaitlistInput!)`, `leaveWaitlist(entryId: Int!): Boolean!`,
  `createMaintenance(input: CreateMaintenanceInput!)`, `deleteMaintenance(id: Int!): Boolean!`
- Enums: `UserRole`, `RoomStatus`, `BookingStatus`, `RecurrenceFrequency` (all via `registerEnumType`)
- RoomType exposes `equipment: [EquipmentType]!` and `occupantCount`/`remainingCapacity: Int!` via field resolvers
- New types: `BookingType` (scalars + `room`/`organizer`/`participants` field resolvers + field-resolved
  `hasCheckedIn: Boolean!` and nullable `checkIn: CheckInType`), `ParticipantType` (+ `employee` field
  resolver), `CheckInType` (+ `employee` field resolver), `WaitlistEntryType` (+ `room`/`employee` field
  resolvers), `JoinWaitlistInput`, `MaintenanceType` (+ `room` field resolver), `CreateMaintenanceInput`,
  `UsageAnalyticsType`, `DateRangeInput`
- **Phase 13 added no GraphQL surface** (no new query/mutation/type/enum) — real-time delivery is a
  Socket.IO channel, not GraphQL. The `schema.ts` resolver list is unchanged since Phase 12.

## 6. Modules & Data Model

Module folders under `backend/src/modules/` (each: dto/, entities/, repositories/, resolvers/, services/, utils/, index.ts).
**auth**, **rooms**, **equipment**, **bookings** (incl. `utils/recurrence.ts`, Phase 8), **checkin**
(Phase 9), **waitlist** (Phase 10), **maintenance** (Phase 11) and **analytics** (Phase 12) are fully
layered. **analytics** is the one module with **no `entities/`** — it owns no tables, only read-only
aggregate queries over bookings/rooms (`plan.md` §3.2), so its `entities/`, `utils/` folders stay empty.
**participants** is layered
(repository/service/DTO/field resolvers + `addParticipants`/`removeParticipant` mutations, added in Phase 7).
**notifications** is no longer a stub: it still owns the payload DTO + builders, and since Phase 13 its
`NotificationService` emits over Socket.IO (via `realtime/`) in addition to logging — still no entities,
no repository, no resolver (it is not a GraphQL surface).

Outside the module folders, **`realtime/`** (Phase 13) is the transport layer for notifications:
`events.ts` (event names + wire payload types) and `socket.ts` (server, handshake auth, per-user rooms,
`emitToUser`). It is deliberately **not** inside `modules/notifications/` because the transport is shared
infrastructure (the same pattern as `jobs/` for cron), and `NotificationService` imports it as a leaf.

| Entity | Table | Notes |
|---|---|---|
| Employee | employees | role enum EMPLOYEE/ADMIN, unique email |
| Room | rooms | unique name, `CHK capacity > 0`, status AVAILABLE/MAINTENANCE/DISABLED |
| Equipment | equipment | unique name |
| RoomEquipment | room_equipment | unique (room_id, equipment_id) |
| Booking | bookings | status CONFIRMED/COMPLETED/CANCELLED/NO_SHOW, `CHK start < end`, recurrence_id; indexes on (room,start,end), (organizer,start), recurrence. `has_checked_in` column DROPPED in Phase 9 — `check_ins` is the single source of truth |
| Participant | participants | unique (booking_id, employee_id) |
| CheckIn | check_ins | unique booking_id (one per booking) — records who (`checked_in_by`) and when |
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
    the normal watch-server flow). Phase 9 used the same approach (watch server kept running, extra
    instance on :4001 with log capture for deterministic log assertions).
14. **The cron jobs are LIVE from Phase 9 onward.** Any server running current code ticks
    `no-show-release` + `booking-completion` every minute. Consequences: (a) yesterday's/today's
    CONFIRMED bookings with no check-in get auto-released to NO_SHOW — the seed's bookings 1–4 were
    released this way the moment the watch server reloaded (expected, by design); the seed's future
    standups (5/6) will be released ~10 min after their 09:00 starts unless someone checks in;
    (b) multiple instances against the same DB (e.g. watch server + a test instance) are safe —
    both jobs are idempotent CAS updates; whichever instance wins the tick does the work, so
    per-instance log lines for cron actions can be racy (assert DB state, logs opportunistically;
    request-driven logs like CHECK_IN notifications are deterministic if the test instance handles
    the mutation).
15. **Raw-SQL time-shifts in tests must respect `EXC_bookings_room_no_overlap`.** Shifting a
    CONFIRMED booking's times via psql into a slot occupied by ANOTHER CONFIRMED booking in the same
    room fails with 23P01 (good — the constraint even catches test drift). Learned in Phase 9:
    spread SQL-shifted test bookings across rooms, and never swallow psql stderr in test helpers.
16. **Dev DB baseline (re-verified at the Phase 13 session close, 2026-09-26):** the user keeps using the
   app, so the numbers drift between sessions — always re-read them with SQL before designing conflict
   tests. Seed leftovers (room `heaven` id 7, employee `rohan@gmail.com` id 7) are **real data — do not
   suggest deleting them**. Baseline at Phase 13 close: **42 bookings, 72 participants, 1 check_in,
   2 waitlist entries, 2 maintenance, 6 rooms** (identical to the Phase 11/12 baseline).
17. **NEVER let two services `new` each other — it stack-overflows at boot, not at call time.**
    Phase 10 first wired `WaitlistConversionService` → `BookingService` while `BookingService` already
    held a `WaitlistConversionService` (the Phase 7 cancel hook). Because every dependency is a
    *property initializer*, the two constructors recursed and the server died at startup with
    `RangeError: Maximum call stack size exceeded` — the `node --watch` child just vanished with **no
    output in the terminal** (the crash only shows in a manually started instance). The fix is the
    pattern to reuse: **the caller injects the capability** —
    `WaitlistConversionService.onBookingCancelled(booking, (user, data) => this.create(user, data))`,
    with `import type { CreateBookingData }` (type-only, so no runtime require edge at all). Any
    future "module A must call module B's service, and B already calls A" need should follow this,
    not a lazy getter or an eager `new`.
18. **Cron/log test tooling note (Phase 10):** `grep` on a captured server log needs `-a` — the log
    contains query output that grep treats as binary, and it silently prints
    "Binary file … matches" instead of the lines. Also, a converted *recurring* series creates N rows
    from **one** `createBooking` return value: track every occurrence id (`recurringBookingGroup`)
    when writing cleanup SQL, or the extra rows leak into the next session's baseline.
19. **`backend/scripts/` is OUTSIDE the `tsc` program** (`backend/tsconfig.json` has
    `"include": ["src"]` and `rootDir: "src"`, so adding `scripts` would break `npm run build`).
    Consequence: `npm run typecheck` does **not** check `migrate.ts` / `migrate-revert.ts` /
    `socket-verify.ts` — `ts-node` type-checks them when they run, so a broken script only fails at
    run time. Read the first `TSError` carefully; do not assume `typecheck` passed means the scripts
    compile.
20. **Socket delivery is room-based, so "no event" is ambiguous (Phase 13).** `emitToUser` does
    `io.to('user:<id>').emit(...)` — an event fires whether or not anyone is listening, and an
    **offline recipient is indistinguishable from a broken emit**. When a notification "does not
    arrive", check in this order: (1) is the client socket still connected (log `disconnect` on the
    client), (2) did the handshake succeed at all, (3) is the recipient id in the payload the id you
    think it is, (4) only then suspect the server. The `[notification:TYPE]` log line is the ground
    truth for "the server emitted it" — it exists precisely so a delivery failure can be split into
    emit-side vs receive-side.
21. **`node-cron` + `node --watch`:** editing any file the server has loaded restarts the child, which
    **drops all open sockets** (clients see `disconnect: io server disconnect` / `transport close`).
    During Phase 13 this is a real hazard for any multi-minute socket test: don't edit backend files
    while `socket-verify` is waiting on the 90s check-in window.

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

**Decided 2026-09-26 (Phase 9 session, user-approved — resolved the §9 open questions):**
- **FR-39 check-in window = [startTime, startTime + 10 min)** — same constant as the no-show release
  (single source `checkin/utils/check-in-window.ts`).
- **`check_ins` table is the single source of truth**; `bookings.has_checked_in` dropped via
  migration `1730000000003` (down backfills the boolean from `check_ins`). `BookingType.hasCheckedIn`
  is now a field resolver; `UQ_check_ins_booking` is the DB-level FR-40 guarantee.
- **Ended + never-checked-in → NO_SHOW (not COMPLETED)** — completion only completes bookings with
  a check-in row; no-show claims any past-grace no-check-in booking (even ended).
- **CHECK_IN notification → organizer only**, skipped when the organizer themself checks in
  (no self-notification). Stub now; Socket.io in Phase 13.

**Decided 2026-09-26 (Phase 10 session, user-approved — all asked at kickoff):**
- **A converted booking uses the FREED SLOT's exact times + a generated title**
  (`'Waitlisted booking'`, `utils/waitlist-conversion.ts`) — a waitlist entry has no title field, and
  reusing the freed slot is always conflict-free. Consequence accepted: a partial overlap means the
  waiter's booking can differ from the window they joined for.
- **One new notification type `WAITLIST_CONVERTED`, sent to the waiter.** FR-23 `BOOKING_CREATED`
  would have had **zero recipients** (the waiter *is* the organizer and there are no participants),
  so the waiter would never learn they got a room. The payload carries the waitlist window
  (`waitlistStartTime`/`waitlistEndTime`) next to the booking times because the two can differ —
  Phase 20/23 will need both.
- **No conversion on no-show release** (the release fires at `start + 10 min`, exactly when the
  check-in window closes, so every converted booking would start in the past and be re-released,
  draining the list ~1 entry/minute). `onBookingNoShowReleased` stays wired as a logged no-op.
- **One conversion per freed slot = the first FIFO entry that converts** (matches `plan.md`
  "automatically books the first waiting user" and FR-33's singular "a matching entry").
- **`joinWaitlist` mirrors `createBooking`**: employees only (admin → FORBIDDEN) and the room must be
  `AVAILABLE`. FR-34 only mentions the unavailable/maintenance conditions; the stricter mirror was
  chosen for consistency. Maintenance overlap is checked *before* the availability check.
- **`leaveWaitlist(entryId: Int!): Boolean!`, own entry only** — an admin removing someone else's
  entry is FORBIDDEN (strict FR-36, consistent with the Phase 9 check-in decision).
- **`myWaitlist` returns every entry in `createdAt ASC`** — no past-window filtering (FR-37 literal).
- **FR-35 "duplicate" = any overlapping entry of the same user in the same room** (stricter than the
  exact `(room, employee, start_time)` index, which stays as the DB-level backstop). Adjacent windows
  (`end == next start`) are still allowed.

**Decided 2026-09-26 (Phase 11 session, user-approved — all asked at kickoff):**
- **`createMaintenance` allows past/ongoing starts** (only `startTime < endTime` is enforced). FR-41 has
  no past-date rule (that requirement belongs to the booking engine), and an admin must be able to record
  an emergency repair that already began. The CONFIRMED-booking overlap check still blocks any window
  colliding with a live or upcoming booking.
- **No room-status gate** — `createMaintenance` only requires the room to EXIST (NOT_FOUND otherwise).
  FR-41 mentions no status rule, and windows on a DISABLED / MAINTENANCE-status room are exactly the
  admin use case (unlike `createBooking`/`joinWaitlist`, which are booking-path operations).
- **`roomMaintenance` is open to ALL authenticated users** (`@Authorized()`), the same call as the Phase 5
  `equipment`-list decision: employees need to see *why* a room is unavailable in search/Room Details
  (Phase 21), and FR-9 already exposes maintenance's effect to them. `requirement.md` §3.11's "(Admin)"
  heading was not treated as a restriction.
- **`deleteMaintenance` returns `Boolean!`** (NOT_FOUND if absent) — `leaveWaitlist` precedent; the caller
  already knows which window it asked to delete.

**Decided 2026-09-26 (Phase 12 session, user-approved — all four asked at kickoff):**
- **Range basis = interval overlap for both queries** — `startTime < rangeEnd AND endTime > rangeStart`
  (half-open). The user chose overlap over "starts within" because the calendar must show bookings that
  are *running* across the window edges, not just ones beginning in it. This also reuses the exact
  conflict-query condition already proven in Phases 6–11, so "overlaps" means one thing app-wide.
- **"Total bookings" counts ALL statuses** (CONFIRMED + COMPLETED + CANCELLED + NO_SHOW). Cancellations
  and no-shows are reported as **subsets** of that total, not exclusions — an admin usage report wants
  raw volume with the outcomes broken out, and the three numbers then always reconcile
  (`total ≥ cancelled + noShows`). The user explicitly rejected filtering cancellations out of the total.
- **Zero-usage rooms DO appear** in `usageAnalytics` rows (0/0/0), via `rooms LEFT JOIN bookings`.
  A usage report that silently omits an idle room reads as "no data" rather than "unused", and the
  frontend (Phase 22) needs the full room list to render a complete table.
- **Calendar payload = flat `[BookingType!]!`** — reuse `BookingType` so the existing room/organizer/
  participants field resolvers work on calendar rows, exactly like `recurringBookingGroup` already does
  (FR-44's "AdminCalendar" is the query/feature name, not a new GraphQL type). Maintenance windows stay
  on `roomMaintenance`; Phase 22 composes the two.

**Decided 2026-09-26 (Phase 13 session, user-approved — all six asked at kickoff):**
- **One socket event per notification type** — `notification:BOOKING_CREATED`, `notification:PARTICIPANT_ADDED`,
  `notification:PARTICIPANT_REMOVED`, `notification:CHECK_IN`, `notification:WAITLIST_CONVERTED`
  (names mirror the `[notification:TYPE]` log tag). Rejected the alternative of one generic
  `notification` event with `type` in the body, so the client can subscribe per event. Emitted to the
  per-user room `user:<employeeId>`.
- **An unauthenticated handshake is REJECTED** (`next(new Error('Unauthorized'))`) rather than allowed
  into no room — strict handshake auth mirroring `@Authorized()`. Consequence for Phase 23: the
  frontend socket client must connect **only when logged in**, and re-connect after login/logout.
- **The `[notification:TYPE]` `logger.info` line is KEPT** alongside the socket emit (log + emit, not
  either/or) — server-side observability, and it keeps the log-based assertions of Phases 6–10 valid.
  It is also the ground truth that separates "the server didn't emit" from "the client didn't receive"
  (see §8.20).
- **No new payload types** — still exactly the five that exist in `dto/notification-payload.ts`. No
  `BOOKING_CANCELLED`, no `NO_SHOW_RELEASED`; `requirement.md` has no FR for either.
- **`NotificationService` reaches the server through a module singleton** in `realtime/socket.ts`
  (`initSocketServer` / `emitToUser` / `closeSocketServer`), NOT constructor injection. Reason: the
  services are property-initialised `new X()` three levels deep, so injection would mean re-plumbing
  every resolver and re-risking the §8.17 construction cycle. `emitToUser` warns and no-ops when the
  socket server is not initialised (keeps the module usable from tests/scripts).
- **The bare verification client is committed** as `backend/scripts/socket-verify.ts`
  (`npm run socket:verify -w backend`) and `socket.io-client` was added to **backend devDependencies**
  (previously only a frontend dep) so the backend is self-contained.

**Next — Phase 14 — Rooms (Frontend), the FIRST frontend phase (backend track closed):**
- Everything the Rooms UI needs already exists and was verified in Phase 4/5: `rooms(filter)` /
  `room(id)` (`@Authorized()`), `createRoom` / `updateRoom` / `setRoomStatus` (ADMIN),
  `equipment` list + `assignEquipmentToRoom` / `removeEquipmentFromRoom` (ADMIN), and the
  `RoomType.equipment` / `occupantCount` / `remainingCapacity` field resolvers.
- `RoomFilterInput` supports `status`, `minCapacity`, `floor`, `equipmentIds`, `startTime`+`endTime`
  **in one query** (a room must have ALL requested equipment; the time pair excludes rooms with an
  overlapping CONFIRMED booking **or** maintenance window). That combination is enough for
  RoomFilters + live "is this slot free" feedback without a new backend query — treat any change as a
  "Backend adjustments" step per `plan.md` §Phase 14, not a new module.
- Frontend scaffolding already present: Vite/Tailwind/Apollo with `credentials: 'include'`, the route
  table with `ProtectedRoute`/`AdminRoute`, `AuthContext`/`useAuth`, AppLayout/Navbar/Sidebar, and the
  shared components (`Button`, `Modal`, `LoadingState`, `EmptyState`, `ErrorState`, `StatusBadge`,
  `Input`, `Select`, `DateTimePicker`). Every page is still a `PlaceholderPage`.
- **Socket client is Phase 23, not 14** — but note the Phase 13 handshake rule: connect only when
  authenticated, and re-connect on login/logout. Vite already proxies `/socket.io` with `ws: true`.
- Remember when sending dates: GraphQL `DateTimeISO` requires **full ISO-8601 with seconds**
  (`2026-09-26T18:00:00+05:30`; `…T18:00+05:30` is rejected) — see §8.12.

## 10. Verification Checklist Before Starting New Work

- [ ] Backend: `npm run typecheck` passes (both workspaces)
- [ ] DB reachable; `npm run migrate -w backend` says "No migrations to run"
- [ ] `npm run seed -w backend` idempotent (logs "Seed skipped" if run before)
- [ ] `npm run dev` → `/health` returns `{"status":"ok"}`
- [ ] `npm run socket:verify -w backend` → 27/27 checks passed (only needed when touching `realtime/`,
      `notifications`, or the session/cookie plumbing; takes ~2.5 min because it waits for a real
      check-in window)

Report a change/decision here when it affects how the app runs (tooling, schema, phases, conventions).