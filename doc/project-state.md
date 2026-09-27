# OpenCode Project State — Meeting Room Intelligence

> Persistent AI handoff document. Update this file whenever the project state changes
> so a new OpenCode session or model can continue development without re-discovering context.

Last updated: 2026-09-27 (**Phase 18 — Recurring Meetings (Frontend) is DONE, so the frontend
track is 5 of 10 phases in: 14 Rooms ✅, 15 Equipment ✅, 16 Core Booking ✅, 17 Manage Bookings &
Cancellation ✅, 18 Recurring Meetings ✅. Next is Phase 19 — Check-in & No-show (Frontend).**
Phase 18 needed **one small backend change** — human `en-GB`/UTC wording for the booking-conflict and
maintenance messages, in a new `bookings/utils/conflict-message-time.ts`; `recurringBookingGroup`
itself needed no contract change and the plan's "no N+1" check confirmed it stays lean. New frontend
surface: the recurrence section on Create Booking, the recurring-series panel on Booking Details, the
add/remove-participant modals the user pulled into this phase, and recurring notes on booking rows.
Verified live: **64/64 API checks and 52/52 headless-Chrome UI checks**, DB left at its exact
baseline, `typecheck` + `build` green. §9.7 records this session's decisions and the fixture rules.)
Repo: `Book-MeetingRoom` (branch `main`)
Working tree at session close: **uncommitted Phase 15 + Phase 16 + Phase 17 + Phase 18 changes**
(Phase 14 is committed as `5fe0881`). Phase 18's new/changed files, on top of the earlier sets:
backend new `modules/bookings/utils/conflict-message-time.ts` + `booking-service.ts` (message text
only — **no migration, no schema change**); frontend new `utils/recurrence.ts` (client mirror of the
server's generator), new `components/forms/DatePicker.tsx` and `components/common/DetailRow.tsx`,
new `pages/create-booking/RecurrenceSection.tsx` and `BookingConfirmedPanel.tsx`, new
`pages/booking-details/RecurringSeriesPanel.tsx` + `AddParticipantsModal.tsx` +
`RemoveParticipantModal.tsx`, `recurrence`/`recurrenceId` on `Booking` plus
`RecurrenceFrequency`/`RecurringBookingGroup` types, the `ADD_PARTICIPANTS_MUTATION` /
`REMOVE_PARTICIPANT_MUTATION` / `RECURRING_BOOKING_GROUP_QUERY` documents, `ParticipantPicker`'s
`excludeIds` prop, and the recurring note in `MyBookingsPage` / `MyMeetingsPage` /
`EmployeeDashboard` (both meeting panels). The user commits manually (§8.11); the verification
harnesses live in `/private/tmp/p18-*.mjs` (nothing test-related is committed, §8.7).

**UI design-system session (2026-09-26, AFTER the Phase 13 work — read this before any frontend phase):**
the user supplied two design screenshots (login + register) and instructed that **the whole application must
look like them, not just the auth screen**. The auth screen was rebuilt to match them within ~1.5px and its
tokens/components are now the app-wide UI baseline: **§7.1 holds the full spec (colours, type scale, control
heights, split-layout rules), §9.1 holds the decisions.** Uncommitted from that session:
`frontend/src/components/auth/` (4 new files), `frontend/src/pages/login/LoginPage.tsx` and
`frontend/tailwind.config.ts` (modified). The two reference PNGs sit untracked in the repo root.

**App-shell / dashboard design session (2026-09-27 — the NEWEST UI input, read this first):**
the user supplied **two more** design screenshots — the **admin dashboard** and the **employee dashboard** —
with the same instruction: the app must follow them. They define the authenticated shell (navy top bar, admin
left sidebar, employee centred top nav, `#F5F5F5` page background, black-hairline white cards, stat tiles,
panel cards, empty states, dashboard buttons) that **every page built in Phases 14–23 sits inside**. Spec:
**§7.2**; decisions: **§9.2**; extraction method + the "no image vision in this session" caveat: **§8.24**.
**Both §7.2 sessions are now built and applied** — all 12 tokens are in `frontend/tailwind.config.ts`, the
two role shells are extracted and re-measured (§5), and the Phase 14 + Phase 15 pages sit inside them.

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
- **the user's design screenshots + §7.1 + §7.2 of this file** — the visual source of truth for the frontend
  (four references in total: login + register → §7.1, admin dashboard + employee dashboard → §7.2; the login
  pair's PNGs are untracked in the repo root, the dashboard pair is Cloudinary-only, URLs in §7.2)

Phase structure (restructured 2026-09-25): Phases 1–3 foundation/auth (done), then a
**backend track** (Phases 4–13, one feature per phase — **CLOSED/DONE as of 2026-09-26**), then a
**frontend track** (Phases 14–23, same feature order — **14 Rooms, 15 Equipment, 16 Core Booking,
17 Manage Bookings & Cancellation and 18 Recurring Meetings DONE as of 2026-09-27, next is Phase 19
Check-in & No-show**), then hardening (Phase 24) and docs (Phase 25).

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
│   └── src/
│       ├── components/   auth/ (design-system primitives — §7.1), layout/, forms/, common/
│       ├── pages/        login/ (§7.1) + real pages per built phase: room-directory/, room-details/,
│       │                 admin-rooms/ (14) + equipment/ (15) + create-booking/, my-bookings/,
│       │                 my-meetings/, booking-details/ (16–18); the rest still render PlaceholderPage
│       ├── context/ hooks/ graphql/ routes/ theme/ types/ utils/ realtime/
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

## 5. Current Status (verified 2026-09-27)

### UI Design System + Auth Screen (frontend baseline): ✅ DONE (2026-09-26, uncommitted)
- Rebuilt `/login` (both modes) from the two user-supplied design screenshots. Verified by pixel-diffing
  headless-Chromium renders at `1783×895 @2x` against the references: **every ink block within ±1.5px** in
  both login and register, colours exact, and at `390×844` the brand panel is gone and the form fills the
  screen. Method + tokens + component specs: **§7.1**; decisions: **§9.1**.
- New `frontend/src/components/auth/` — `AuthBrandPanel` (`hidden lg:flex`, `w-1/2`, `bg-navy`),
  `AuthTabs` (2-col grid, 2px navy underline on the active half), `AuthField` (`h-11`, 4px radius, 1px black
  border, `sr-only` label mode, inline eye show/hide), `RoleSelector` (2-col cards, navy check on selection).
- `frontend/tailwind.config.ts` gained the 11 measured colour tokens (§7.1 table). No other config touched.
- `pages/login/LoginPage.tsx` rewritten: Employee/Admin role cards replace the old "sign in as administrator"
  checkbox (still `logIn` vs `adminLogIn`), register adds a client-only confirm-password, forgot-password is
  UI-only. Auth wiring (`useAuth` + `AuthContext`) and the redirect-to-`/` behaviour are unchanged.
- **This is a baseline, not Phase 14.** Phase 14 (Rooms) is still the next phase — see §9.1 for what a new
  page is expected to reuse.

### App Shell & Dashboard Theme (admin + employee panels): ✅ BUILT + RE-MEASURED (2026-09-27, uncommitted)
- The user supplied the **admin dashboard** and **employee dashboard** screenshots and instructed that the app
  must follow them. Full measured spec: **§7.2**; decisions: **§9.2**; extraction method: **§8.24**.
- **What the spec pins down:** two shells (admin = 299 px left sidebar, employee = centred horizontal top
  nav, both under a navy bar), 12 new colour tokens, the navy top bar geometry, nav active/inactive states
  (admin = solid navy block, employee = `#41487E` pill), the 1 px black-bordered white card with its soft
  shadow, the 40×39 `#EEF0FE` stat tile with a navy numeral, the panel card, the one-line centred muted
  empty state, 40 px Title-Case dashboard buttons, the type-scale extension (only 18 px is new) and the
  dashboard copy rules.
- **All 12 tokens are now in `frontend/tailwind.config.ts`**, and the primitives (`AppCard`, `StatCard`,
  `PanelCard`, `PageHeader`, `EmptyState`, `LoadingState`, `ErrorState`, `Modal`, `StatusBadge`, `Button`,
  `Input`, `Select`, `DateTimePicker`, `TopNav`, `AppLayout`) are extracted and wired to real GraphQL data.
- **Re-measured after building (§8.24 method, PIL run-length + ink profiles).** Now matching the references:
  - navy bar **54 px admin / 58 px employee** — exact; dominant colour histogram matches token-for-token.
  - admin sidebar: eyebrow ink top within **0.5 px**; active item rect **114→158 px, identical to the
    reference**; nav item pitch **48 px** identical; 299 px sidebar and 4-up stat card span within **1 px**.
  - employee: 3-up stat row cards within **1.5 px** of the reference (`111.5/622 … 1676` vs
    `113/622 … 1675.5`); 58 px bar exact.
  - content stack: greeting sub-caption, stat row and panel row all land within **2–3 px** of the reference
    on both shells. `PageHeader` takes an explicit `topPad` prop because the two references differ (admin
    `pt-8`, employee `pt-10`) — do **not** re-merge these into one value.
  - **Known 5 px residual on the `h1` ink box** (admin 85→106.5 ref vs 90.5→117 mine). The reference PNGs
    use a different typeface whose cap-height ratio differs from Tailwind's system stack; §7.1 already
    records that a webfont is out of scope. Every block *below* the `h1` matches, so this is cosmetic and
    was deliberately left alone rather than chased with a magic offset.
- **Bugs found and fixed during the re-measure** (each was a real defect, not a tuning nit):
  1. The admin top nav was `hidden lg:block`, i.e. it rendered the horizontal nav *at desktop* on top of
     the sidebar. Corrected to `lg:hidden` (the strip only appears below `lg`).
  2. `typeScale.pageTitle` carried `leading-[59px]`, inherited from the auth screen's 48 px two-line brand
     heading. It pushed the whole dashboard content stack ~20 px down. Now `leading-none`.
  3. The employee content wrapper had `px-6` *inside* `max-w-[1563px]`, so the content was 1514 px wide
     instead of 1563 px. The max-width now applies to the content, with the page padding moved outside.
  4. Below `lg` the header used a 3-track grid that overflowed at 390 px (brand + nav + user cluster), so
     the employee nav pill rendered flush at `x = 0`. It is now a wrapping flex header that drops the nav to
     its own full-width scrollable strip; both roles match at 390×844.
- **Caveat retained:** the session's model had no image vision, so every number here is pixel-measurement +
  OCR, not visual judgement. Geometry is measured; interpretation is flagged in §7.2/§9.2.

### Phase 14 — Rooms (frontend): ✅ BUILT + COMMITTED (2026-09-27, commit `5fe0881`)
- Built the full Phase 14 frontend on top of the §7.2 shell. **No backend changes were made or needed** —
  the existing `rooms` / `room` queries, `RoomFilterInput` and the create/update/status mutations already
  cover the directory, filters, details and admin management.
- **Room Directory** (`pages/room-directory/`) — `RoomDirectoryPage` + `RoomFilters` + `RoomCard`,
  1/2/3-up responsive grid. Filters are explicit-apply (status, min capacity, floor, free-from/free-until
  `DateTimePicker`) with a Clear button, matching the reference's button language. Verified live against the
  seeded backend: 6 rooms total; `AVAILABLE` → 4, `MAINTENANCE` → 1, `DISABLED` → 1, `minCapacity=10` → 4,
  `floor=2` → 3, Clear → 6. All correct.
- **Room Details** (`pages/room-details/RoomDetailsPage.tsx`) — live status, occupant count, remaining
  capacity, and a hand-off note to Phase 8 for booking. Verified live (`/rooms/1` → "Atlas 2.01", no alert).
- **Admin Rooms** (`pages/admin-rooms/`) — `AdminRoomsPage` + `RoomForm` in a `Modal`. Verified live: the
  Add Room modal opens with name / capacity / floor / location fields.
- **Routes** — `/rooms`, `/rooms/:id`, `/admin/rooms`, plus placeholder routes for `/equipment`, `/wait-list`,
  `/meetings`, `/admin/calendar`, `/admin/analytics` using the reference's own nav labels.
- **Deviations from §7.2.11, made with explicit user authorisation (§9.2):** the room-directory grid, the
  filter panel, the details layout and the admin room form are **improvised** — §7.2.11 said to ask the user
  for these designs rather than improvise, and the user chose to proceed with an improvised catalog. They
  reuse the §7.1/§7.2 primitives and are not pixel-referenced. Revisit if the user later supplies designs.
- **Equipment filter/display is deliberately NOT in Phase 14** (it is the Phase 15 equipment phase), so
  `RoomForm` has no equipment fields. → **Superseded in Phase 15**: equipment is now on the directory
  cards, the admin cards, room details and the filters (but still not inside `RoomForm`; assignment is a
  separate `EquipmentManager` modal).
- **Open gap — the two admin dashboard list panels render heading + caption only.** Both
  `Today's Bookings` and `Room Usage` return real data (1 booking; 6 usage rows) but render **no rows**,
  because §7.2.11 excludes list rows from the design and the user instructed that list-row markup not be
  invented. A populated panel therefore looks empty. **This needs the user's row design before it can be
  finished** — see §9.2. → **CLOSED in Phase 15**: the user chose to improvise the rows from the existing
  primitives, which produced the shared `components/common/ListRow.tsx` (see the Phase 15 section).

### Phase 15 — Equipment (Frontend): ✅ BUILT (2026-09-27, uncommitted)
- **The equipment feature itself needed no backend work, and none was done for it.** The phase's "Backend
  adjustments" step asked whether the equipment field resolver returns everything the `EquipmentManager` UI
  needs in one round trip: it does. `equipment` is `@Authorized()` for every employee, and both
  `assignEquipmentToRoom` / `removeEquipmentFromRoom` return `RoomType`, whose `equipment` field resolver
  can be selected in the mutation's own selection set — so the whole manager is **1 query + 2 mutations,
  zero extra round trips**. `rooms(filter: { equipmentIds })` already AND-filters. **The one backend change
  in this phase is the `filter: null` fix further down, which was a pre-existing bug found by verification
  and patched only after asking the user.**
- **New GraphQL layer:** `queries/equipment.ts` (`EQUIPMENT_QUERY`), `mutations/equipment.ts`
    (`CREATE_EQUIPMENT_MUTATION`, `UPDATE_EQUIPMENT_MUTATION`, `ASSIGN_EQUIPMENT_MUTATION`,
  `REMOVE_EQUIPMENT_MUTATION` — the last two share a local `fragment RoomWithEquipment on RoomType`),
 `equipment { id name }` added to both
  `ROOMS_QUERY` and `ROOM_DETAILS_QUERY`, `equipmentIds?: number[]` added to the `RoomsVars` filter type,
  and `Equipment` + `Room.equipment` added to `types/index.ts`. The existing `fragment RoomFields` in
  `mutations/rooms.ts` was left alone on purpose — the per-file field list is the established convention.
- **`EquipmentManager`** (`pages/admin-rooms/EquipmentManager.tsx`) — a `wide` `Modal` reached from a new
  **Equipment** button on every Admin Rooms card. Two sections: **Assigned (n)** (one `ListRow` per item
  with a 40 px outline **Remove**) and **Available (n)** (the unassigned remainder, each with a primary
  **Add**). It keeps its own `assigned` state, seeded from `room.equipment` and replaced by the mutated
  room's returned `equipment`, so the panel is correct even before the Apollo cache re-renders the parent.
  Per-row spinner + disabled buttons while a mutation is in flight; one inline `role="alert"` line for
  mutation errors; `ErrorState` + retry for the equipment query. Reached from `AdminRoomsPage` via
  `equipmentRoom` state.
- **`/equipment` catalog page** (`pages/equipment/EquipmentPage.tsx` + `EquipmentForm.tsx`) — replaces
  the Phase 15 `PlaceholderPage` on the route the admin nav has always linked to. `PanelCard` of
  `ListRow`s (name + outline **Edit**) with a **Add Equipment** page-header action; create/rename share
  one modal that mirrors `RoomForm`'s validation (required after trim, ≤ 100 chars) and surfaces backend
  CONFLICT messages through `getGraphQLErrorMessage`. **There is still no `deleteEquipment` mutation** —
  a record can be renamed and unassigned but never deleted, so the page deliberately has no delete action.
- **Equipment everywhere else:** `components/common/EquipmentChips.tsx` (bordered `rule` chips, `max` +
  "+N more", muted empty line) is used by the Room Directory `RoomCard` (max 4), the Admin Rooms card
  (max 4) and a new **Equipment** `PanelCard` (`title="Equipment"`, `sub="Everything assigned to this room"`)
  on `RoomDetailsPage` — passed to `EquipmentChips` with **no `max`**, so every chip is listed, and
  `emptyText="No equipment is assigned to this room yet."` when the room has none.
  `RoomFilters` gained an **Equipment** section: checkbox
  tiles (`border-navy bg-tint` when selected, `border-hairline` otherwise, §7.1's selection-card tokens)
  with the caption *"A room must have every item you select."* — matching the backend's AND semantics.
  **`equipmentIds` is only sent when at least one box is ticked**, because `RoomFilterInput` has
  `@ArrayMinSize(1)` and an empty array is a VALIDATION error.
- **The Phase 14 open gap is closed, plus its employee twin:** `components/common/ListRow.tsx` (flex row,
  `border-b border-rule py-3 last:border-b-0`, optional action slot) now backs **all four** dashboard
  panels that were rendering heading-only — admin `Today's Bookings` (title + `09:00 – 09:30 · Atlas 2.01`
  + `StatusBadge`) and `Room Usage` (`1 booked · 0 cancelled · 1 no-show`), employee `Today's Meetings`
  and `Upcoming Meetings` (same meeting row, extracted as a local `MeetingRow`). New
  `formatTime`/`formatTimeRange` in `utils/date.ts` render browser-local times, consistent with the
  "today is the browser's local day" decision in §9.3. `Modal` gained an optional `size="wide"`
  (`max-w-2xl` + `max-h-[85vh] overflow-y-auto`) for the manager.
- **Verified live:** **28/28 API checks** against the watch server on :4000 (`rooms(filter: null)` is treated
  as no filter — the regression test for the fix below; `equipment` shape; equipment on
  every room incl. `[]` for bare rooms; single- and multi-id filtering with **AND** confirmed — Display →
  3 rooms, Display+Video Conference → 1; `equipmentIds: []` → VALIDATION; assign → the room immediately
  appears under that filter and the returned room carries the full list; duplicate assign → CONFLICT;
  remove → gone, other items survive; no-op remove → NOT_FOUND; create/rename/duplicate-name/whitespace
  rejections; employee `createEquipment` → FORBIDDEN). Then **headless-Chrome DOM checks** (CDP, system
  Chrome, session cookie injected — the session's model has no image vision, so this is DOM/text
  verification, not a visual diff): the manager add/remove round trip (Assigned 3→4→3, then 3→5→3 to force
  the truncation branch), `+1 more` at 5 items on both cards while room details still lists all 5,
  `/equipment` 6 rows, the AND filter from the
  UI, the employee shell's rows, `/equipment` redirecting an employee to `/`, and **0 px horizontal
  overflow at 390×844 on all five pages**. **No page exceptions.**
- **DB left at its exact session-start baseline** (6 rooms / 6 equipment / 7 room_equipment / 42 bookings /
  72 participants / 2 waitlist / 1 check-in, identical room→equipment assignments) — every test row was
  removed via SQL, including the two `Phase15 verify%` equipment records, because the API has no delete.
  `npm run typecheck` + `npm run build -w frontend` pass.
  *(Historical: the equipment side has since drifted to 7 equipment / 10 room_equipment because the user
  kept using the app — the live baseline is §8.16, re-verified at the Phase 16 close.)*
- **Found during verification, then FIXED with the user's approval — the only backend change in this phase:**
  `rooms(filter: null)` used to return `INTERNAL_SERVER_ERROR`. `RoomService.search(user, filter: RoomFilter
  = {})` relied on a default parameter, which only applies to `undefined`, so an explicit `null` reached
  `filter.startTime` and threw (`room-service.ts:113`). No frontend path hit it (Apollo omits `undefined`
  variables), but it was a live trap for any caller that builds the filter conditionally. The fix
  normalises once at the top — `search(user, filter: RoomFilter | null = {})` then
  `const criteria = filter ?? {}`, with every field read off `criteria` — and the resolver's arg type was
  widened to the truth, `RoomFilterInput | null | undefined`, so the next reader is not misled into
  repeating the mistake. **The Phase 15 API script now asserts it** (`rooms(filter: null)` must return the
  full room list, not an error): **28/28 checks pass.** A sibling trap from the same phase is *not* a bug and
  is left as-is: **`equipmentIds: []` is a VALIDATION error**, because `RoomFilterInput` carries
  `@ArrayMinSize(1)`, so an unselected multi-select must be omitted rather than sent empty. The same
  default-parameter pattern may exist in other services with defaulted input DTOs — that sweep was
  deliberately **not** done here (out of the approved scope).
- **Deviations from §7.2.11, made with explicit user authorisation (§9.4):** the equipment chips, the
  `ListRow` list markup, the checkbox filter tiles, the `EquipmentManager` layout and the `/equipment`
  catalog page are all **improvised** on the §7.1/§7.2 primitives and are **not pixel-referenced**.
  Revisit any of them if the user later supplies designs.

### Phase 16 — Core Booking (Frontend): ✅ BUILT (2026-09-27, uncommitted)
- **The one backend change, asked about before coding: an `employees` query.** The `ParticipantPicker` had
  no way to list colleagues — the directory is a plain, non-paginated list
  (`EmployeeRepository.list()` → `AuthService.list()` → `@Query(() => [EmployeeType]) @Authorized()
  employees` on `AuthResolver`, mapped through the existing `toEmployeeType` helper, so **no password
  column is exposed**). It is `UNAUTHENTICATED` when anonymous and readable by both roles; the user chose
  the whole directory (the admin account included) ordered by `lastName`, `firstName`, `id`, with the
  **UI** hiding the signed-in user, because the server already rejects the organiser as their own
  participant (verified: "The organizer is already part of the booking and cannot be added as a
  participant"). **`AuthResolver` was already registered in `schema.ts`, so no schema wiring was needed.**
  Note the DB order is Postgres' byte order, so a lowercase surname (`kumar`) sorts after the capitalised
  ones — that is the seeded data, not a bug.
- **No availability query was added (user decision, §9.5).** The plan's "Backend adjustments" step
  suggested a lightweight *is this slot free* query; the user chose to reuse
  `rooms(filter: { startTime, endTime })`, which already existed. The page therefore runs **two
  `ROOMS_QUERY` instances**: one unfiltered (the room list to choose from) and one filtered by the chosen
  range (`skip`ped while the range is unusable), then diffs the ids client-side.
- **The important subtlety in that diff: `RoomFilterInput`'s time filter excludes overlapping bookings and
  maintenance windows but does NOT filter on room status.** A `DISABLED` room still comes back from the
  time-filtered query, so the UI shows it and lets you select it, and the server rejects it with *"Room
  "Polaris 0.03" is not available for booking (current status: DISABLED)"*. That is deliberate here: it
  keeps the client's "unavailable" claim honest (it is a *time* answer) and leaves status rejections to the
  engine. The room card prints the status label instead of a free/unavailable line for non-`AVAILABLE`
  rooms, so nothing is mislabelled.
- **`CreateBookingPage` + `ParticipantPicker`** (`pages/create-booking/`) — improvised on the §7.1/§7.2
  primitives (user decision, §9.5, no design supplied). Room selector as a `role="radiogroup"` of
  uniform cards with a per-room line (`Free for this slot` / `Unavailable` / `Checking availability…` /
  the room's own status), the two `DateTimePicker`s side by side, title (≤ 200) + description (≤ 1000),
  and the participant chips. **Availability is advisory, the server is authoritative:** a selected room that
  is not free shows a `role="status"` warning naming the room and says submitting "will be rejected by the
  booking engine", but the button is **not** disabled — so a user can still provoke and see the real
  CONFLICT message, which is the phase's "done when".
- **Client-side validation mirrors the server's rules** (required title after trim, start in the future,
  end after start, a room chosen, attendees ≤ capacity) and gates the button via `disabled`. The
  `capacity` message is the room's own wording: *"Polaris 0.03 seats 2, but you have 3 attendees."*
- **A failed availability query no longer lies (fixed during verification).** The first cut only read
  `availability.data`, so a failed check left `freeRoomIds` empty and marked **every** available room
  "Unavailable" with no explanation. The page now tracks `availabilityKnown = !loading && !error`, prints
  `Availability unknown` per card, and shows an inline retry line saying the check failed and the server
  will still reject a taken room.
- **`defaultSlotInput()` in `utils/date.ts`** — the default slot is the next half-hour boundary + 60 min.
  It exists because the first cut called `nextHalfHourInput()` **twice** for start and end; the two calls
  can straddle a half-hour boundary and silently produce a 30- or 90-minute default. One clock reading now
  feeds both ends, at init and in `reset()`.
- **Success stays on the page (user decision, §9.5):** a `Booking Confirmed` panel with the title, a
  `StatusBadge`, and `Room` / `When` / `Organiser` / `Participants` detail rows, plus **Book another room**
  (full reset) and **View My Bookings** (written against Phase 17's `PlaceholderPage`, so it was a dead
  link until Phase 17 shipped). This is why the mutation selects a full `BookingFields` fragment — `room`, `organizer` and `participants` are all
  auth-only fields that must be asked for, and the panel renders them without a second round trip. The
  fragment includes `employeeId` as well as `employee { … }`, because the `Participant` fallback renders
  `Employee #<employeeId>` when `employee` is missing.
- **Recurrence is deliberately absent** (Phase 18), so `CreateBookingInput` gets no `recurrenceId` and the
  page has no recurrence controls. Verified the created booking comes back with `recurrenceId === null`.
- **Entry points:** `/create-booking?room=<id>` preselects a room — linked from **Room Details**
  ("Book this room", primary, shown only for `AVAILABLE` rooms, replacing the old plain `Link` note) — and
  the **employee dashboard** now uses the previously-unused `copy.dashboardButtons.bookARoom` token for its
  primary action instead of "Find a Room". Both verified. The route sits inside `ProtectedRoute` only, **not**
  `AdminRoute`: the nav never links an admin there and the server returns `FORBIDDEN` for an admin
  `createBooking`, but there is no client-side role redirect.
- **Icons follow §9.3, not hand-rolled SVG.** The first cut drew `CheckIcon`/`PlusIcon` as inline SVG,
  which contradicted the `react-icons@5.7.0` decision; they are now `LuCheck`/`LuPlus` from
  `react-icons/lu`, the same set `theme/navigation.ts` and `Modal` use.
- **Verified live — API, 44/44:** the `employees` query (anonymous → `UNAUTHENTICATED`; employee + admin
  get the same ordered directory; shape-only fields; no password; session untouched); the availability
  filter (free set, adjacency — `end == next start` stays free — and both a maintenance window and a real
  booking dropping their room out of it); **every** `createBooking` rule (past, inverted range,
  whitespace title, 201-char title → `BAD_USER_INPUT` from the DTO, `DISABLED`, `MAINTENANCE`, overlap,
  maintenance overlap, over-capacity, exact fit, duplicate/self/unknown participant, unknown room, admin
  `FORBIDDEN`, anonymous `UNAUTHENTICATED`); and the **concurrent double-booking guarantee: 3/3 rounds,
  exactly one winner each, loser got the mapped CONFLICT and never a raw exclusion-constraint error**.
  Capacity needed a boundary the seeded data cannot reach (6 employees, smallest room 6 seats), so Vega's
  capacity was temporarily lowered through the admin `updateRoom` mutation and restored afterwards.
- **Verified live — UI, 86/86 + design contract 17/17** (headless Chrome over CDP with the session cookie
  injected; the model has no image vision, so these are DOM/geometry assertions, not a visual diff): the
  60-minute default slot on a future half hour; per-room annotations (`Maintenance`/`Disabled` never read
  "Free"); the directory hiding the signed-in user while keeping the admin account; search by name and by
  email plus the empty copy; every validation gate including submit-disabled and the red error border; the
  attendee counter tracking selections; the client capacity guard (exact fit allowed, one over blocked,
  with the picker's own remaining-seat warning); a booking created behind the UI's back so the same slot
  reads "Unavailable" on reload, and submitting anyway surfaces the engine's CONFLICT **verbatim, naming
  the blocking booking**, with no success panel; the full happy path → `Booking Confirmed` panel (room,
  `Confirmed` badge, organiser, both participant names, description) and the booking really persisted in
  `myBookings` with its participants; **Book another room** resetting everything; both entry points; and
  **0 px horizontal overflow at 390×844** with the room grid collapsing to one column. The design audit
  confirms §7.1 compliance from computed styles: 44 px controls, 4 px radius, 1 px black border (red when
  invalid), 16 px input font, the 2 px navy focus ring, no `tabindex="-1"`, and the participant chips at
  44 px — the chips were 38 px until the audit caught it and they now carry `min-h-11`. **No page
  exceptions.**
- **DB left at its exact session-start baseline** (6 rooms / 7 equipment / 10 room_equipment / 42 bookings /
  72 participants / 1 check-in / 2 waitlist / 2 maintenance / 6 employees, every room's capacity + status
  restored). Every test row was removed, including the temporary maintenance window and the lowered room
  capacity. `npm run typecheck` + `npm run build -w frontend` pass.
- **Improvised surfaces (§7.2.11), user-authorised (§9.5), not pixel-referenced:** the room selector
  cards, the participant chips, the confirmation panel and the whole form layout. Revisit if the user
  supplies designs. **Not built here, by decision:** recurrence (Phase 18). The My Bookings / Booking
  Details screens this panel links to were built in Phase 17, so "View My Bookings" now lands on a real
  page.


### Phase 17 — Manage Bookings & Cancellation (Frontend): ✅ BUILT (2026-09-27, uncommitted)
- **Zero backend changes**, confirmed against the code before writing any frontend: Phase 7 already exposes
  `myBookings` (every booking the caller organises, `startTime DESC`), `myMeetings` (CONFIRMED-only future
  bookings where the caller organises **or** is a participant, `startTime ASC`), `bookingDetails(id)`
  (organiser, any participant, or an admin; otherwise `FORBIDDEN`, and `NOT_FOUND` for an unknown id) and
  `cancelBooking(id)` (organiser or admin, `CONFIRMED` only, refused at/after 30 minutes before the start).
  **No migration.** The only GraphQL work was the *selection sets*: the plan's "verify the existing types
  carry what the UI needs" step.
- **`bookingDetails` was missing four things the details page has to show, and all four exist on
  `BookingType` already:** `hasCheckedIn`, `checkIn { checkedInBy, checkedInAt, employee { firstName,
  lastName } }`, `createdAt` and `updatedAt`. `checkIn` comes from Phase 9's `CheckInType` and its
  `employee` relation is auth-only, so it must be asked for explicitly; `hasCheckedIn` and the
  timestamps are scalars that a details page simply had never selected. No server change, no N+1 (verified:
  booking 7's check-in resolves in the same round trip).
- **`BookingRow` is the phase's one new shared primitive** (`components/common/BookingRow.tsx`), improvised
  on §7.1/§7.2 like §9.4's `ListRow` (§7.2.11 does not cover list rows). It wraps `ListRow`, makes the
  **whole row** the link to `/bookings/:id` (an `after:inset-0` overlay on a `relative` row), shows the
  booking's `StatusBadge`, and takes two optional props: `showDate` (adds the calendar date to the second
  line) and `note` (extra context such as `In progress`, `Organiser`, `Invited`). It is now used by
  **My Bookings, My Meetings and both employee-dashboard meeting panels**, so every booking row in the app
  links to its details page. **Consequence to remember (§8.30): the action slot is inside the link's overlay,
  so it is not independently clickable — keep it a non-interactive badge.**
- **`MyBookingsPage`** — two `PanelCard`s, as decided (§9.6): **Upcoming** (not finished yet, soonest first)
  and **Past** (most recent first, capped at 10 rows with `Show all (N)` / `Show less`). Both panels render
  `EmptyState` when empty, and the whole page reads `myBookings` once and splits it client-side, with **one**
  `new Date()` per render so the two lists cannot disagree (§8.28's family). `isInProgress` +
  `isFuture` + `minutesUntil` were added to `utils/date.ts` for this.
- **A booking the engine already gave up on must never read "In progress" (found in verification).** The
  10-minute no-show release flips a booking to `NO_SHOW` while it is still in the future, so the first
  version showed a `NO_SHOW` row inside **Upcoming** with the note `In progress` — a meeting that is
  definitively not happening, described as though it were. The note is now gated on
  `status === CONFIRMED`. The *placement* is still purely time-based (a not-yet-ended `NO_SHOW` booking
  stays in Upcoming for those 10 minutes), which matches the panel copy "Your bookings that have not
  finished yet" — see §8.31.
- **`BookingDetailsPage`** — `PageHeader` (`pt-10`, §7.2) with the Cancel action and a Back button, then
  three `AppCard`s: **Booking** (status badge, a status note explaining what the engine already did, and
  `When` / `Room` (linking to `/rooms/:id`) / `Organiser` / `Check-in` / `Series` / `Booked on` rows, plus
  the description), **Room** (status badge, name/capacity/floor/location, "View Room Details"), and
  **Participants**. The room value is a `<Link>`, so `DetailRow.value` is typed `ReactNode`, not `string`.
  Missing relations degrade instead of crashing: `Employee #<id>` when `employee`/`organizer` is absent,
  `Room #<id>` when the room is gone, `—` when `createdAt` is missing. `FORBIDDEN` gets a bespoke "You are
  not part of this booking" state (via the new `getGraphQLErrorCode`), an unknown id gets "That booking link
  is not valid", and any other failure is a retryable `ErrorState`.
- **`CancelBookingModal` — the server is the authority, on purpose (§9.6).** It lists who may cancel
  (organiser or admin), that the window closes 30 minutes before the start, that a recurring occurrence
  cancels alone, and that a queued waitlist entry is offered the slot automatically. It **never disables the
  confirm button on client-side time maths**, and it renders the server's message verbatim, so the two
  authoritative rejections are visible where the user acted: *"Bookings can only be cancelled until 30
  minutes before they start."* and *"You are not allowed to perform this action."* The copy deliberately
  does **not** claim participants are notified — cancellation notifications were never built (Phase 7
  emits none), so promising them would be a lie.
- **The cancel result is a normalised `BookingFields` payload**, so the cache update alone re-renders the
  details page (badge, status note, and the Cancel action disappearing) and My Bookings. `myMeetings` is
  CONFIRMED-only, so the mutation also carries `refetchQueries: [{ query: MY_MEETINGS_QUERY }]` — a cache
  write cannot remove a row from a query that filters it out server-side.
- **`MyMeetingsPage`** (`/meetings`, built in this phase per §9.6) lists the caller's confirmed future
  meetings with `Organiser` / `Invited` as the row note, reusing `BookingRow`; the employee dashboard's two
  meeting panels use the same component with `showDate` left off, which keeps the exact time-only line
  they were measured with in §5 while making the rows link.
- **Routes:** `/bookings`, `/bookings/:id` and `/meetings` were `PlaceholderPage`s and are now the real
  pages, all inside `ProtectedRoute` only (**not** `AdminRoute` — an admin may legitimately open any
  booking, §7's own role matrix). Phase 16's success panel link now lands on a real My Bookings page.
- **Verified live — API, 41/41** (`/private/tmp/p17-api.mjs`): anonymous `UNAUTHENTICATED` on all four
  operations; `myBookings` returns only the caller's own bookings, `startTime DESC`, every row with its
  room; `myMeetings` is CONFIRMED-only, strictly future, `ASC`; the whole `bookingDetails` access matrix
  (organiser ✓, participant ✓, uninvolved `FORBIDDEN` ✓, admin on anyone's ✓, unknown id `NOT_FOUND` ✓,
  `checkIn { employee { … } }` resolving on booking 7, `hasCheckedIn` a boolean, `checkIn` null when
  nobody checked in); and every `cancelBooking` rule — inside the 30-minute window → `VALIDATION_ERROR`
  with the exact message, a real cancel → `CANCELLED` + the full graph, twice → `VALIDATION_ERROR`
  ("Only confirmed bookings can be modified."), an uninvolved employee and a mere participant → both
  `FORBIDDEN`, an admin cancelling someone else's booking ✓, unknown id `NOT_FOUND` — **plus the waitlist
  chain the modal's copy promises: a colleague queued for the cancelled slot was auto-converted into a
  booking and their entry left `myWaitlist`.**
- **Verified live — UI, 52/52 + 6/6** (headless Chrome over CDP; DOM/geometry assertions, not a visual diff
  — the model has no image vision): the two panels and their sub-copy; `In progress` on a running booking
  and **not** on a `NO_SHOW` one; a same-day row showing a time range and a five-days-out row showing a
  date; the Past cap at 10 with `Show all (13)` revealing all 13 and then `Show less`; Cancelled and
  No-show badges in Past; **every** booking row on all three screens linking to `/bookings/:id`; Upcoming
  sorted ascending; the details page's room/organiser/participants/series/check-in/"Booked on" rows with
  **no** participant controls (Phase 18+) and no `tabindex="-1"`; the modal's four guidance lines; the
  30-minute rejection shown **verbatim** with the modal staying open and no navigation; a participant's
  cancel attempt surfacing `FORBIDDEN`; a real cancel flipping the badge to `Cancelled`, removing the
  Cancel action, adding the status note, keeping the row in My Bookings **and** dropping it from My
  Meetings; the employee dashboard's today-panel rows linking to details; and a `COMPLETED` booking
  (booking 7) showing `Priya Verma at Thu 24 Sept · 09:55` as read-only with no Cancel action and the
  "already finished" note. **No page exceptions, no console errors.**
- **Test data note for anyone re-running this:** `createBooking` refuses a start time in the past, so
  past-capped and in-progress fixtures were inserted straight into `bookings` and deleted afterwards. The
  live release cron flips any CONFIRMED booking to `NO_SHOW` **10 minutes after it _starts_** (§8.31), so an
  "in progress" fixture has a ~10-minute lifetime.
- **DB left at its exact session-start baseline** (42 bookings / 72 participants / 2 waitlist / 1 check-in /
  6 rooms / 6 employees, waitlist entries 1 and 28 intact). All 14 temporary rows and their participants
  were removed. `npm run typecheck` + `npm run build -w frontend` pass.
- **Improvised surfaces (§7.2.11), user-authorised (§9.6), not pixel-referenced:** `BookingRow`'s row
  layout, the details page's three-card composition, the cancel modal's bullet list and the My Bookings /
  My Meetings panel pairs. Revisit if the user supplies designs. **Not built here, by decision:** recurrence
  and participant add/remove (**both built in Phase 18**), the check-in button (Phase 19 — the details page
  shows check-in **read-only**), and the waitlist indicator (Phase 20).

### Phase 18 — Recurring Meetings (Frontend): ✅ BUILT (2026-09-27)
- **Backend: no contract change, one message-text change.** The plan's "verify `recurringBookingGroup` needs
  no N+1" check passed — it selects `BookingType` scalars only, so no per-occurrence field resolvers. What the
  phase *did* need was human wording: `bookings/utils/conflict-message-time.ts` (`formatConflictTime`,
  `formatConflictWindow`, `en-GB` + `timeZone: 'UTC'`) renders the conflict and maintenance messages with
  explicit UTC instead of raw ISO, e.g. `Room "Vega 3.02" is already booked for the occurrence at Mon, 1 Feb
  2027, 09:00 UTC (conflicts with "…", Mon, 1 Feb 2027, 09:00 UTC to Mon, 1 Feb 2027, 09:30 UTC).` The raw-ISO
  messages in check-in/waitlist/maintenance were deliberately left alone (not booking conflicts). **No
  migration.**
- **`utils/recurrence.ts` is a step-for-step client mirror of the server generator** — `previewOccurrences`,
  `repeatUntilToGraphQLDate`, `frequencyLabel`/`frequencyAdverb`, `buildRecurrenceNotes`, `bookingRowNote`, plus
  the same 90-occurrence cap and the same inclusive end-of-day rule. It exists so the form can block an invalid
  series *before* submitting and label the button `Create N Bookings`, and so the row notes stay consistent.
  **When the server's generator changes, this file must change with it** (gotcha §8.34).
- **Create Booking:** `RecurrenceSection` (repeat toggle, Every day / Every week cards, inclusive "Repeat
  until" `DatePicker`, live 5-row preview with a 90-occurrence hint) and the new `BookingConfirmedPanel`, which
  re-reads the authoritative series after creation instead of trusting a client count. `recurrence` is
  submitted **only** when repeat is on (§8.25).
- **Booking Details:** `RecurringSeriesPanel` — the occurrence count feeds the Series `DetailRow`, the list is
  capped at 10 with Show all / Show less, every occurrence links to its own details page, and the panel states
  that occurrences are cancelled **one at a time** (there is deliberately no whole-series cancel). Plus the
  participant work the user pulled into this phase: `AddParticipantsModal` (reuses Create Booking's
  `ParticipantPicker` through a new `excludeIds` prop, one batch mutation, "n seats are left" in the subtitle,
  verbatim server errors) and `RemoveParticipantModal` (confirm, with "Leave this meeting" for a participant
  removing themself) — both behind one **Add People** control that only the organiser or an admin sees. Per
  §9.6 no client-side 30-minute maths gates them; the modal states the rule and the server's rejection is
  shown where the user acted.
- **Recurring row notes:** `Repeats every week` (or `…every day`) as a subtle second-line note on My Bookings,
  My Meetings and both employee-dashboard panels, inferred from the gaps between the occurrences on screen —
  never from a stored pattern, so a series edited occurrence-by-occurrence stays honest.
- **One verification finding worth keeping:** an empty `employeeIds` never reaches the service —
  `@ArrayMinSize(1)` on `AddParticipantsInput` answers first, as **`BAD_USER_INPUT`** rather than
  `VALIDATION_ERROR` (§8.35). The modals show whatever code comes back, so nothing needed changing, but an
  API harness must not assert the service's error class for that case.
- **Verified live: 64/64 API checks** (inclusive end date, the exact 90/91 cap boundary, both conflict and
  maintenance message shapes, half-open back-to-back still allowed, the full `addParticipants` /
  `removeParticipant` permission + capacity + 30-minute + cancelled-booking matrix, `recurringBookingGroup`
  authorisation for a participant / an admin / an unrelated user) **and 52/52 headless-Chrome UI checks**
  (recurrence section preview + cap block + submit label, the confirmation panel, the notes on all four lists,
  the series panel and its Show all / no-whole-series-cancel rules, add/remove as organiser, participant
  self-removal including the 30-minute rejection shown verbatim, the "this booking is already full" copy, and a
  390 px pass with zero console errors). Harnesses: `/private/tmp/p18-api.mjs`, `/private/tmp/p18-ui.mjs` +
  `p18-ui-seed.mjs` / `p18-ui-cleanup.mjs` (run the seed first; it prints the IDs the UI harness expects).
- **DB left at its exact session-start baseline** (42 bookings / 72 participants / 2 waitlist / 1 check-in /
  6 rooms / 7 equipment / 10 room_equipment / 6 employees / 2 maintenance; waitlist entries 1 and 28 intact, max
  booking id 280). `npm run typecheck` and `npm run build` (both workspaces, `--force`) pass.
- **Improvised surfaces (§7.2.11), user-authorised (§9.7), not pixel-referenced:** the recurrence section's
  cadence cards + preview, the series panel, both participant modals, `DatePicker`, `DetailRow` and the
  `BookingConfirmedPanel` composition.

### Phase 19 — Check-in & No-show (Frontend): ✅ BUILT (2026-09-27, uncommitted)
- **One backend contract addition, and it is the only schema change in the phase.** `BookingType` gained
  `checkInWindowOpensAt` and `checkInWindowClosesAt`, both non-null, mapped in `toBookingType` as **plain
  scalars** — `booking.startTime` and `checkInWindowEnd(booking.startTime)`. No field resolver, no extra query,
  no migration: the window was already computed server-side in `check-in/utils/check-in-window.ts`, this just
  publishes it. Because they are plain mapped values they cost nothing on a list either, so `myBookings` can
  select them with the same field-resolver-free guarantee as the rest of the lean row fragment. **The
  alternative considered and rejected:** field resolvers for the two bounds, which would have re-run
  `checkInWindowEnd` per row per request and quietly broken the "no field resolvers in a list fragment" rule
  that §8.19 established for Phase 18's `recurringBookingGroup`.
- **`frontend/src/types/index.ts` marks both bounds optional** even though the server makes them non-null. The
  list fragment does not select them, so a `Booking` from `myBookings` genuinely has no such property. Optional
  is the honest type; the details page guards on them being present.
- **`CHECK_IN_MUTATION` selects a deliberately lean set** (`id status startTime endTime checkInWindowOpensAt
  checkInWindowClosesAt`) and pairs with `refetchQueries: [BOOKING_DETAILS_QUERY]` +
  `awaitRefetchQueries: true`. This is required, not tidiness: `hasCheckedIn` and `checkIn` on `BookingType`
  are **field resolvers**, so Apollo's cache write from the mutation response cannot populate them. Without the
  awaited refetch the Check-in row would keep saying "Not checked in" and the button would stay on screen after
  a successful check-in. The mutation *does* carry the two bounds, so a caller that only needs the new state
  never has to refetch.
- **The window is displayed, never used to hide the button** (user decision §9.8). `BookingDetailsPage` shows a
  one-click **Check In** button in the existing `PageHeader` action group — no confirmation modal — and a plain
  sentence under the Check-in `DetailRow` giving both server bounds: `Check-in opens at 23:06 and closes at
  23:16. If nobody checks in, the room is released when that window closes.` The client never compares those to
  the clock to decide visibility; eligibility is `status === CONFIRMED && !hasCheckedIn && (organiser or
  listed participant)`, and the server's rejection is what the user sees. Per §9.6 that is deliberate: the page
  states the rule, the server enforces it, and a client-side timer would only be a second source of truth to
  drift.
- **FR-38 is stricter than FR-28 and gets no admin exemption.** The details page already had an `isOrganiser`
  for the Add People control, but that one includes admins (FR-28) — reusing it would have offered Check In to
  an admin the server is guaranteed to refuse. So a separate `isBookingOrganiser` (strict) plus a
  `participants.some(p => p.employeeId === user?.id)` test decides visibility. Verified both ways: a listed
  participant who is not the organiser **can** check in, and an admin who is neither organiser nor participant
  gets **no** button even though they can read the booking and see the Check-in row.
- **`useRefetchOnFocus` (new hook) + a My Bookings Refresh control.** The no-show release and the completion
  sweep run on a cron and emit no socket event (Phase 13 shipped no `NO_SHOW_RELEASED` type on purpose,
  §8.17), so a list is stale the moment the server decides something. The hook re-runs the caller's refetch on
  `window` `focus`, held in a ref so an inline arrow does not re-subscribe each render; it is wired into both
  `MyBookingsPage` and `BookingDetailsPage`. My Bookings also gets an explicit **Refresh** button next to
  *Book a Room*. No polling was added (§9.8).
- **Success and failure are reported where the user acted**, above the cards and next to the button that
  produced them: `role="status"` with `Checked in — the room will not be released for a no-show.`, and
  `role="alert"` carrying the GraphQL message **verbatim**. The success line is additionally gated on the
  refetched `booking.checkIn`, so a fresh mount can never replay a stale flash. The success copy states the
  consequence rather than restating the action, because `no-show-release` skips any booking that has a
  `check_ins` row — that is why checking in matters, and the page now says so.
- **The list fragment was left alone** (user decision §9.8): no check-in fields and no "checked in" note on
  `BookingRowFields`, so My Bookings picks up the new state through the refetch above. Asserted on the wire in
  the UI harness, not just by eye.
- **One verification finding that changes how this feature must be tested:** `no-show-release` is scheduled
  `* * * * *` (`backend/src/jobs/no-show-release.ts`) — **every minute**. A CONFIRMED booking whose 10-minute
  window has passed is therefore flipped to `NO_SHOW` within 60 seconds, which means (a) a fixture whose
  window has closed cannot be used to test the closed-window error, because the button is *correctly* gone by
  the time a page loads, and (b) in production the `checkIn` "window closed" message is only reachable in the
  sub-minute gap between the window closing and the sweep. The closed-window path is still real and is covered
  by the API harness, which calls the mutation directly; the **UI** refusal test uses a booking that starts in
  the future instead, which no sweep will ever touch. See §8.36.
- **Verified live: 26/26 API checks** (both bounds on `bookingDetails` for an organiser and for an admin, the
  bounds on every `myBookings` row, `opensAt === startTime` and `closesAt === startTime + 10min` exactly, the
  whole `checkIn` matrix — success inside the window, `CONFLICT` on the duplicate, `VALIDATION_ERROR` for a
  closed window and for a too-early check-in, `FORBIDDEN` for an uninvolved employee **and** for an uninvolved
  admin, `FORBIDDEN`-vs-`UNAUTHENTICATED` for anonymous, `NOT_FOUND`, and `VALIDATION_ERROR` for a cancelled
  booking — plus `check_ins` holding exactly one row per success and none for any refusal)
  **and 44/44 headless-Chrome UI checks** (one-click with no modal, both bounds rendered and matching the API
  to the minute, the button vanishing and the Check-in row filling in after success, the verbatim
  too-early refusal in a `role="alert"` with the button kept and the window line kept, the released booking
  correctly hiding the button and showing a No-show badge, the FR-38 participant/admin split, the Refresh
  control and focus refetch proven by **counting the GraphQL requests on the wire**, the lean list fragment
  proven unchanged on the wire, and a 390 px pass with zero console errors). Harnesses:
  `/private/tmp/p19-api.mjs`, `/private/tmp/p19-ui.mjs` + `p19-ui-seed.mjs` (run the seed first; it prints the
  IDs **and the pristine baseline** the UI harness must restore).
- **DB left at its exact session-start baseline** (42 bookings / 72 participants / 1 check-in / 2 waitlist /
  2 maintenance / 6 rooms / 7 equipment / 10 room_equipment / 6 employees). `npm run typecheck` and
  `npm run build` pass (both workspaces). There is no lint script in this repo, so typecheck + build is the
  gate.
- **Improvised surfaces (§7.2.11), user-authorised (§9.8), not pixel-referenced:** the Check In button's
  placement in the existing header action group, the one-line window explanation, and the status/alert styling.

- Workspaces, Turbo, shared tsconfig, typed env, error classes/codes, logger
- Express + cors + cookie-parser; Apollo + TypeGraphQL schema at `/graphql`
- `/health` endpoint; GraphQL context reads JWT cookie → nullable user
- Cron registry (`startJobs`/`stopJobs` with server)
- Frontend: Vite + Tailwind + Apollo (`credentials: 'include'`), route skeleton + AppLayout/Navbar/Sidebar,
  shared components (Button, Modal, LoadingState, EmptyState, ErrorState, StatusBadge) and form components
  (Input, Select, DateTimePicker). At this point every route was `PlaceholderPage`; Phases 14–15 have since
  made `/login`, `/`, `/rooms`, `/rooms/:id`, `/admin/rooms` and `/equipment` real pages.

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
- **Later — Phase 19 (frontend) publishes this window.** `BookingType` gained
  `checkInWindowOpensAt`/`checkInWindowClosesAt`, mapped from the same `checkInWindowEnd` this section's
  `[startTime, startTime + 10 min)` decision defines, so the frontend states the server's rule instead of
  repeating the 10 minutes. See the Phase 19 section in §5 and decisions §9.8. Note the schedule: this
  section's own note that release happens "within ~40s" is because `no-show-release` is `* * * * *`
  (§8.37).

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

### 7.1 Frontend UI Design System — APP-WIDE (binding on every frontend phase)

**The rule:** the user's design screenshots are the visual contract for the **whole application**, not just the
screen they happen to depict. There are now **two** such contracts and both are binding:

- **§7.1 — the auth/form language** (from the login + register screenshots): colours, type scale, 44px form
  controls, 4px radii, split-layout rules. Every new page, component, table, modal and empty/error state built
  in Phases 14–23 must be composed from the tokens and primitives below. No new hex literals in components, no
  new font sizes, no per-page spacing improvisation. If a screen genuinely needs something not covered, add it
  to `frontend/tailwind.config.ts` and record it here — never inline a one-off value.
- **§7.2 — the authenticated app shell + dashboard** (from the admin + employee dashboard screenshots): the
  navy top bar, the admin sidebar / employee top nav, the `#F5F5F5` page background, the black-hairline white
  card, the stat tile, the panel card, the one-line empty state and the dashboard buttons. **Every
  authenticated page is rendered inside this shell, and its content is composed from these primitives.**

§7.1 and §7.2 agree on the things they share (navy `#1F2867` is the brand, 4px radii, 15px and 14px type
steps, muted `#6B7180` body-secondary) — where they differ, **§7.2 wins inside the authenticated shell** and
§7.1 wins on `/login` and any bare form screen.

**Colours** (all 11 measured from the reference PNGs; defined in `frontend/tailwind.config.ts`):

| Token | Hex | Use |
|---|---|---|
| `navy` | `#1F2867` | primary brand — active tab underline, primary button fill, selected card border + check, focus ring, brand panel |
| `brand` | `#2C60F2` | inline text links ("Create account", "Forgot password?") |
| `tint` | `#F4F5FE` | selected surface (role card fill) |
| `hairline` | `#D3D3D3` | unselected card border |
| `mist` | `#DDDFE8` | tagline on navy |
| `ink` | `#232324` | headings + field text |
| `copy` | `#363636` | body / sub-heading |
| `label` | `#272727` | field labels, switch line |
| `muted` | `#6B7180` | captions, icons, copyright |
| `idle` | `#767676` | inactive tab label |
| `hint` | `#808080` | input placeholders |

**Type scale** (px; Tailwind's default steps cover everything except the two arbitrary values):

| Size | Class | Use |
|---|---|---|
| 48 / lh 59 | `text-[48px] leading-[59px] font-bold` | brand wordmark (navy panel) |
| 30 | `text-[30px] font-bold` | page heading ("Employee Login") |
| 16 | `text-base` | tagline, switch line |
| 15 | `text-[15px] font-bold` | tab labels — arbitrary size, not a default step |
| 14 | `text-sm` | labels, role titles, sub-heading |
| 13 | `text-[13px] font-semibold uppercase tracking-[0.08em]` | primary button label |
| 12 | `text-xs` | captions, copyright |

**Controls** (all measured at 1783×895 @2x; use the auth components, don't re-derive these):

- **Text field** — `h-11` (44px), `rounded` (4px), **1px solid black** (not a grey token), `px-3`, `text-base
  text-ink`, `placeholder:text-hint`, focus `focus:ring-2 focus:ring-navy`. Error state `border-red-500` +
  `text-xs text-red-600` message 6px below. → `AuthField`
- **Primary button** — `h-11`, `rounded`, `bg-navy`, white uppercase 13px semibold, hover `#16204F`
  (hover shade is inline — it is a hover-only value, not a token). Full-width in forms. → `LoginPage`
- **Tabs** — `grid grid-cols-2`; each half `border-b-2 pb-2.5 text-[15px] font-bold text-center`; active =
  `border-navy text-navy`, inactive = `border-transparent text-idle hover:text-navy`. **The 2px navy rule
  spans only the active half**, not the full row. → `AuthTabs`
- **Selection card** (role pickers, and the pattern for any 2-option chooser) — `grid grid-cols-2 gap-4`,
  `rounded border px-4 pt-3.5 pb-3 text-left`; selected = `border-navy bg-tint` + navy check (16px,
  `strokeWidth 3`); unselected = `border-hairline bg-white hover:border-idle`. Title 14 semibold `ink`,
  caption `text-xs text-muted` 4px below. → `RoleSelector`
- **Brand panel / split layout** — page root `flex min-h-screen bg-white`; panel
  `hidden w-1/2 items-center bg-navy px-16 lg:flex`; form column
  `flex w-full items-center justify-center px-6 py-12 lg:w-1/2 lg:py-16`; inner `w-full max-w-[428px]`.
  **Below `lg` the brand panel is hidden and the form is the whole screen** (verified at 390×844).
- **Icons** — no icon library is installed; use inline SVG with `stroke="currentColor"`
  (`strokeWidth 1.5` eye, `3` check; 20px eye, 16px check).

**Copy rules:** nav wordmark is "Room / Meeting Intelligence" (two lines, forced `<br/>`); tagline "Streamline
your meetings operations with our comprehensive Room Meeting Intelligence."; copyright
"© 2026 Room Meeting Intelligence"; primary button labels are UPPERCASE ("SIGN IN", "REGISTER").

**Fonts:** no webfont — Tailwind's default stack (system-ui). The reference PNGs were rendered with a
different face, so stroke weight can't be matched exactly; tab labels use `font-bold` because it measured
1.14× the reference ink vs 0.66× for `font-medium` and 1.28× for `font-semibold`. **Don't re-tune this
without re-measuring** (see §8.22).

**Fidelity workflow — how §7.1 was produced, and how to verify the next screen:**
1. Screenshot the target viewport in headless Chromium at `1783×895`, `deviceScaleFactor: 2`.
2. Compare **ink-block bounding boxes** (dark pixels in the form column) against the reference, in device px
   ÷2 = CSS px. Every block must land within ~2px.
3. Confirm the copy with OCR (RapidOCR) and the colours by pixel sampling.
4. Re-render at `390×844` and confirm the mobile collapse.
5. **Re-measure the whole column after any single change** — the form column is vertically centred
   (`items-center`), so adding height anywhere moves every other block by half the delta. The register mode
   therefore carries a deliberate `mt-2` on the inner column to absorb its own height difference from login.

**What is deliberately NOT unified yet:** the shared `components/common/Button.tsx`,
`components/forms/Input.tsx` and `Select.tsx` still have their original look — they are used by every
placeholder route, so restyling them has a wide blast radius and no visible benefit yet. New screens should
use the auth primitives; consolidating the shared ones into the §7.1 look is a follow-up once there is more
than one real page to keep consistent.

### 7.2 App Shell & Dashboard Theme — APP-WIDE (binding on every authenticated page)

Extracted 2026-09-27 from the two dashboard screenshots. **The extraction session itself was doc-only, but
the §7.2 colour tokens are now in `tailwind.config.ts` and the theme is applied** (Phase 14 built the two
role shells; Phase 15 finished the four dashboard panels; Phase 16 added the first real *form* screen
inside them — see "Rollout" at the end and §5).

**Reference images** (Cloudinary is the only copy — re-fetch before re-measuring, do not assume a local file):

| Panel | URL | Pixels | CSS viewport |
|---|---|---|---|
| Admin dashboard | `https://res.cloudinary.com/delubzbh2/image/upload/v1790473926/Screenshot_2026-09-27_at_7.21.33_AM_ms3nie.png` | 3580×1782 @2x | 1790×891 |
| Employee dashboard | `https://res.cloudinary.com/delubzbh2/image/upload/v1790473925/Screenshot_2026-09-27_at_7.20.51_AM_hba8qf.png` | 3576×1804 @2x | 1788×902 |

```bash
mkdir -p /tmp/mri-theme
curl -sL -o /tmp/mri-theme/admin.png    "https://res.cloudinary.com/delubzbh2/image/upload/v1790473926/Screenshot_2026-09-27_at_7.21.33_AM_ms3nie.png"
curl -sL -o /tmp/mri-theme/employee.png "https://res.cloudinary.com/delubzbh2/image/upload/v1790473925/Screenshot_2026-09-27_at_7.20.51_AM_hba8qf.png"
```

All numbers below are **measured**, in CSS px (device px ÷ 2). Method and the re-run recipe: **§8.24**.

#### 7.2.1 Two shells, one language

Both references are dashboards, and they show the same visual language with a different chrome:

| | Admin shell | Employee shell |
|---|---|---|
| Top bar | navy, **54 px** tall | navy, **58 px** tall |
| Nav | **left sidebar, 299 px**, white + `border-r` | **horizontal nav, centred** in the bar |
| Content | `px-6`, 1440 px wide (x 324→1764) | `max-w-[1563px] mx-auto`, ~110 px margins |
| Stat row | `grid-cols-4` (4 cards) | `grid-cols-3` (3 cards) |
| Panels | `grid-cols-2` (2 cards) | `grid-cols-2`, then one full-width card |
| Menu | `ADMIN MENU` eyebrow → Dashboard, Calendar, Rooms, Equipment | Dashboard, Find Room, Bookings, Wait-List, Meetings |

**Rule:** pick the shell from the user's role (admin → sidebar, employee → top nav) and never mix them. Both
shells share every colour, card, button and empty-state rule below, so an admin page and an employee page
built from these primitives must look like one product. `/login` and any bare form screen stay §7.1.

#### 7.2.2 New colour tokens (add to `frontend/tailwind.config.ts`; the 11 §7.1 tokens stay as they are)

| Token | Hex | Use |
|---|---|---|
| `navySoft` | `#41487E` | active nav pill **on** the navy bar (employee) — a lighter navy, not a tint of white |
| `navyLabel` | `#D2D4E1` | inactive nav label on navy |
| `shell` | `#F5F5F5` | **the page background** behind all cards (both shells) — the single most-used new value |
| `heading` | `#191E2B` | page h1 + panel card titles. **Darker than §7.1's `ink` (#232324)** — use `heading` for headings, keep `ink` for field text |
| `body` | `#3B4352` | sidebar nav labels, outline-button labels, secondary rows |
| `statLabel` | `#4D5664` | the stat card's bottom label |
| `faint` | `#999FAC` | the `ADMIN MENU` eyebrow and other faint captions on white |
| `rule` | `#E5E6EA` | sidebar right hairline, card separators (lighter than §7.1's `hairline`) |
| `tintStrong` | `#EEF0FE` | the stat-number tile. **§7.1's `tint` (#F4F5FE) is too weak here** — keep `tint` for the auth role cards |
| `roleBg` | `#FFFBEC` | role badge fill — Tailwind `amber-50` |
| `roleRule` | `#FAE591` | role badge 1px border — Tailwind `amber-200` |
| `roleInk` | `#AC5415` | role badge label — Tailwind `amber-700` |

Plus one rule that is not a token but a **literal**: cards and outlined buttons use a **1 px solid `#000000`**
border — the same "black hairline, not a grey token" decision §7.1 already makes for text fields. Reuse
`border-black`; do not invent a grey.

**What did NOT change:** `navy` `#1F2867` is still the brand and still measures exactly the same in all four
screenshots, and `muted` `#6B7180` is still the sub-caption / empty-state colour. The dashboard references
*confirm* §7.1 rather than contradicting it.

#### 7.2.3 Shell geometry

**Navy top bar (both shells)** — `bg-navy`, white content, `px-6` right padding (content ends x 1764 in a
1790 viewport; the bar has no visible bottom border or shadow).
- Wordmark, left, x 19.5→237, ink 17.5 tall, white — same "Room Meeting Intelligence" lockup as §7.1.
- Right cluster, in order: **user name** (white, 15 px, x 1527→1614) → **role badge** → **Logout**
  (white, 15 px, x 1719→1758). The badge is a 1 px-bordered pill, ~24 px tall, vertically centred.

**Admin sidebar** — `w-[299px]`, `bg-white`, `border-r border-rule` (1 px `#E5E6EA`), full height below the bar.
- `ADMIN MENU` eyebrow: `text-xs uppercase tracking-[0.08em] text-faint`, left edge x 24.5.
- Nav items: an item block spans x 12→287 (`mx-3` inside the 299 px sidebar), is **44 px tall**, and repeats
  on a **48 px pitch** (labels at ink y 130.5 / 178.5 / 227 / 274.5). Icon 20×20 at x 23, label 15 px at
  x 53 (≈10 px gap).
- **Active item = solid `bg-navy`, white icon + white label, `rounded` (4 px).** Inactive = transparent, label
  `body` `#3B4352`. There are **no dividers** between items.

**Employee top nav** — horizontally **centred** in the bar (nav block centre 897 vs bar centre 894 at 1788).
- Items at x 615 / 746 / 875 / 995 / 1112 → pitch 118–130 px.
- **Active item = `bg-navySoft` `#41487E` pill, 118 × 35.5 px, `rounded`, white 16 px icon + white 15 px
  label.** Inactive = transparent, label `navyLabel` `#D2D4E1` 15 px.

#### 7.2.4 The card (most-reused primitive — build one `AppCard` from this)

- `bg-white` + **`border border-black` (1 px `#000`)** + `rounded` (4 px; the corner arc measures ~3–4 px).
- A **very soft shadow**: outside the border the page background ramps `#F5F5F5 → #F0F0F0` over ~3 px on
  every side. That is `shadow-sm` at most — **do not use `shadow-md`/`shadow-lg`**, and do not add a
  coloured glow.
- Padding **~21–24 px** (measured 21.5 top on the stat tile, 25.5 on panel titles). Use `p-6` and accept ±2.
- Heights are content-driven, not tokens: stat card 152–154, admin panel 168, employee panel 216,
  full-width card 268.

**Grid gaps (measured, and they genuinely differ — do not "harmonise" them):**
stat rows `gap-4` (**16 px**), the two-wide panel row `gap-5` (**20 px**). Border-to-border the gaps measure
17 px and 21 px respectively, the extra ~1 px being the shadow.

#### 7.2.5 Stat card (admin 4-up, employee 3-up)

Layout is **top tile, bottom label, deliberate white space between** — the tile sits in the card's top-left
padding corner and the label sits on the card's bottom padding edge, leaving ~57 px of empty white between
them. **Do not centre the tile or pull the label up**; the gap is the design.

- **Tile: 40 × 39 px, `bg-tintStrong` `#EEF0FE`, `rounded` (4 px).**
- **Numeral: `#1F2867`, ink 15 × 16 px (≈22–24 px type), centred in the tile** (measured numeral centre x
  364.75 / y 198.75 vs tile centre 364.75 / 198.75 — dead centre).
- **Label on the card's bottom edge: `statLabel` `#4D5664`, 15 px.** Admin labels: `Today's Bookings`,
  `Cancelled`, `No Show`, `Active Rooms`. Employee labels: `Today's Meetings`, `Upcoming Meetings`,
  `Rooms Available`.

#### 7.2.6 Panel card (content cards)

- **Title** `heading` `#191E2B`, ~18 px bold (ink 14.5–15.5), top-left. Admin: `Today's Bookings`,
  `Room Usage`. Employee: `Today's Meetings`, `Quick Action`, `Upcoming Meetings`.
- **Sub-caption** immediately below (≈8 px gap): `muted` `#6B7180`, 14 px. `Meetings scheduled for today`,
  `Today's room booking statistics`, `Your meetings scheduled for today`, `Your upcoming room bookings`.
- **Empty state = ONE line of `muted` 14 px, horizontally centred in the card, ~46 px below the
  sub-caption.** No icon, no dashed placeholder box, no illustration, no "clear filters" button. Copy in the
  references: `No bookings for today.`, `No room usage data available.`, `No meetings for today.`,
  `No upcoming meetings.` — always a full sentence with a period.
  This is the same one-line pattern §7.1 expects from `EmptyState`, so **restyle `components/common/EmptyState.tsx`
  to this** rather than writing a second empty state.

#### 7.2.7 Dashboard buttons

These are **not** §7.1's `h-11` form button — that height is for form submits. In the shell:

| Variant | Spec | Reference |
|---|---|---|
| Primary | `bg-navy`, **no border**, **40 px tall** (`h-10`), `rounded` (4 px), white 15 px label, ~20 px horizontal padding | `Find a Room` |
| Outline | `bg-white` + 1 px border, **40 px tall**, label `body` `#3B4352` 15 px | `View My Bookings` |
| Primary + icon | primary, with a leading 16 px inline-SVG icon (the `Book a Room` button leads with `+`) | `Book a Room` |

**Capitalisation differs from auth and that is intentional:** dashboard buttons are **Title Case**
(`Find a Room`), while §7.1's auth submit is UPPERCASE (`SIGN IN`). Do not uppercase dashboard buttons.
The two quick-action buttons in the employee shell are stacked and **centred**, not full-width.

#### 7.2.8 Type scale — extends §7.1's table

Sizes are measured ink heights mapped to the nearest Tailwind step. §7.1's 30 / 15 / 14 / 12 steps are all
**confirmed** by these references; only the panel-title step is new.

| Measured ink | Class | Use |
|---|---|---|
| 22.5 (cap) | `text-[30px] leading-[59px] font-bold` | page h1 — **§7.1's existing step** |
| 14.5–15.5 | `text-lg font-bold` (18 px) | **panel/card title — new step** |
| 11 (cap) | `text-[15px] font-semibold` | stat label, nav label, button label, top-bar user/logout — **§7.1's existing step** |
| 13 | `text-sm` (14 px) | sub-caption, empty state — **§7.1's existing step** |
| 8–9.5 (cap) | `text-xs uppercase tracking-[0.08em]` | `ADMIN MENU` eyebrow, role badge — **§7.1's existing step** |

#### 7.2.9 Copy rules

- Page greeting: **`Welcome Back, {firstName}`** in `heading` 30 px, with a one-line `muted` 14 px sub ~28 px
  below. Admin sub: `Here's what's happening today.` Employee sub:
  `Here is what's happening with your meetings today.`
  The two references differ in apostrophe style (curly vs straight) — **normalise to the straight `'`** used by
  §7.1's copy, same call as fixing the reference's `meeings` typo (§9.1).
- Nav labels are Title Case, except **`Wait-List`**, which is hyphenated in the reference — keep it verbatim.
- Role badge text is the role name in caps: `ADMIN` / `EMPLOYEE`.
- Brand wordmark and copyright are unchanged from §7.1 (`Room / Meeting Intelligence`, `© 2026 Room Meeting
  Intelligence`).

#### 7.2.10 Rollout — the first mechanical steps of Phase 14

1. Add the 12 §7.2 tokens to `frontend/tailwind.config.ts` (keep all 11 §7.1 tokens).
2. Build **one** `AppLayout` variant per role from the §7.2.3 geometry — the bar, the sidebar, the top nav —
   and have every authenticated route render inside it. `AppLayout`/`Navbar`/`Sidebar` already exist from
   Phase 1 as placeholder chrome; **restyle them, do not add a parallel layout.**
3. Extract the shared primitives so screens stay declarative: `AppCard` (§7.2.4), `StatCard` (§7.2.5),
   `PanelCard` + the one-line `EmptyState` (§7.2.6), and `Button` primary/outline/icon at 40 px (§7.2.7).
4. Then re-measure the rendered shell against these two references using §7.2's numbers before building any
   feature content on top of it.

#### 7.2.11 What these two images do NOT decide

No tables/lists, no data-table header or row styling, no forms inside the shell, no modals, no toasts, no
calendar grid, no charts, no room cards, no detail pages. Those inherit §7.1 (controls, type, colours) plus
the §7.2 card/button/empty-state primitives, and their per-screen layout is still to be designed — **ask the
user for those designs rather than improvising**, exactly as Phase 14 was going to ask for the room-directory
layout (§9 "Next").

> **Resolved for Phase 14 by user decision (2026-09-27, §9.3):** the user was shown this choice and chose to
> **improvise** the room-directory / room-details / admin-rooms layouts rather than supply designs, so those
> three screens are now built on the §7.1/§7.2 primitives without a pixel reference.
>
> **The list-row exclusion is now also closed (2026-09-27, §9.4).** The user authorised improvising list rows
> in this same vein, which produced the shared `components/common/ListRow.tsx` primitive. Every list built so
> far uses it: the four dashboard panels (`Today's Bookings`, `Room Usage`, `Today's Meetings`,
> `Upcoming Meetings`), both `EquipmentManager` sections, and the `/equipment` catalog. A populated panel
> therefore renders rows, not just a heading. New list screens should use `ListRow` too.
>
> **Still improvising without a pixel reference (per §9.4/§9.5/§9.6/§9.7, all user-authorised):** the equipment
> chips, the `RoomFilters` checkbox tiles, the `EquipmentManager` layout and the `/equipment` catalog page
> (Phase 15), plus the room selector cards, the participant chips, the confirmation panel and the whole
> Create Booking form layout (Phase 16), plus `BookingRow`, the details page's three-card composition, the
> cancel modal's bullet list and the My Bookings / My Meetings panel pairs (Phase 17), plus the recurrence
> section's cadence cards and live preview, `DatePicker`, `DetailRow`, the series panel, both participant
> modals and the confirmation panel's series list (Phase 18). No other exclusion in this section is live
> right now; the next un-designed surface is Phase 19's check-in button on the details page.

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
16. **Dev DB baseline (re-verified again at the Phase 18 session close, 2026-09-27 — same numbers):** the user keeps using the
    app, so the numbers drift between sessions — always re-read them with SQL before designing conflict
    tests. Seed leftovers (room `heaven` id 7, employee `rohan@gmail.com` id 7) are **real data — do not
    suggest deleting them**. Baseline at Phase 18 close: **42 bookings, 72 participants, 1 check_in,
    2 waitlist entries, 2 maintenance, 6 rooms, 7 equipment, 10 room_equipment, 6 employees** — unchanged
    across the Phase 15, 16, 17 and 18 closes, and both Phase 18 harnesses verified against exactly this
    (max real booking id 280, waitlist entries 1 and 28 intact). Note the
    `waitlist_entries` table name (§8.3's `waitlist` is the wrong name and errors).
    **Two seeded-data facts that shape test design here:** (a) only **6 employees** exist, so the smallest
    room (6 seats) can never be over-booked from the UI — 1 organiser + 5 colleagues = 6 = capacity
    exactly, so any capacity *boundary* test must temporarily lower a room's capacity through the admin
    `updateRoom` mutation (and restore it), **or insert throwaway employees with SQL** (Phase 18 used
    `p18-temp-*@example.com` rows to make the smallest *bookable* room, Vega 3.02 = 8 seats, genuinely
    full, and to fill its remaining 7 participant slots; there is no delete-employee API, so the cleanup
    script removes them with SQL); (b) the 6-seat room is `DISABLED`, so the smallest bookable room is
    **Vega 3.02 at 8 seats** and the over-capacity client guard is likewise unreachable with the data as
    shipped — it is verified by lowering capacity, not by a data-only test. Temporary rows were removed with
    raw SQL because the API deliberately has **no `deleteEquipment`** and Phase 16 needed no equipment, only
    bookings plus one
    temporary maintenance window (`deleteMaintenance` is admin-only — a cleanup script that runs it with
    an employee cookie silently fails).

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
22. **An invalid Tailwind class fails SILENTLY — the JSX can lie about the design.** The tab labels carried a
    stray `bold` (not a Tailwind utility; the weight class is `font-bold`). It emitted no CSS, so the labels
    rendered at `font-medium` — 0.66× the reference ink — while the code read as though it were bold. Class
    order is not a priority mechanism either: the submit button had both `lg:mt-6` and a conditional
    `lg:mt-3.5`, and which one applied was decided by Tailwind's *generated-CSS* order, not the string
    (removing the "override" moved the button 4px). **After any class-list edit, re-measure ink with the
    §7.1 workflow — do not trust reading the JSX.**
23. **Changing one margin in a vertically-centred form moves everything else (§7.1 step 5).** Two coupled
    effects bit during the auth build: a taller element pushes the whole column up by half its delta, and
    adjacent-sibling margins collapse (a mode-specific `mt-*` on a wrapper is silently swallowed by the
    child's larger `mt-8`). Put the offset on the outer column instead — that is why register mode's
    correction lives on the `max-w-[428px]` div, not on the panel.
24. **A design screenshot can be turned into a spec WITHOUT image vision — measure the PNG, OCR the text.**
    The 2026-09-27 session's model had no image input, and §7.2 was still produced exactly. The method (reuse
    it before concluding you cannot see an image):
    - **Colours:** `PIL` + `collections.Counter` over `img.getdata()` → the dominant hexes with their share.
      Everything in §7.2 came out of that: `shell #F5F5F5`, `navySoft #41487E`, `tintStrong #EEF0FE`,
      `roleBg/#FFFBEC`, `heading #191E2B`, `statLabel #4D5664`.
    - **Structure:** `itertools.groupby` over a row/column of `getpixel()` hex strings, with run lengths —
      that gives bar heights, sidebar width, card rects, grid gaps and borders exactly (e.g. the `gap-4` vs
      `gap-5` difference, and the 1 px `#000` card border). Draw a 64×32 label map first to see the layout
      before trusting any single scan.
    - **Text:** OCR gives both the copy and a per-string ink bbox. Ink height ÷ ~0.73 = font size, which is
      how the type scale in §7.2.8 was derived and how it confirmed §7.1's 30/15/14/12 steps.
    - **OCR venv:** `rapidocr_onnxruntime` is installed **only** in
      `/var/folders/lj/3mvgnr_55znbrs8jb3fqg30w0000gq/T/opencode/ocrvenv` (python 3.9, has numpy). It is not
      in the repo and not in any project venv — if that temp dir is gone, `pip install rapidocr_onnxruntime`
      into a scratch venv, or fall back to colour/geometry only and say so in the doc.
    - **What this method cannot do:** judge visual hierarchy, alignment intent, or anything about how a
      screen *feels*. It gave §7.2 real numbers, not a judgement. Anything it inferred (18 px titles, the
      `text-lg` mapping, the meaning of the tint tile) is flagged as measured-but-inferred in §7.2 and should
      be confirmed against a render.
25. **A `null` GraphQL argument is NOT the same as an omitted one — a default parameter will not save you
    (found 2026-09-27 in `RoomService.search`, FIXED the same day with the user's approval).** The signature
    `search(user, filter: RoomFilter = {})` only got the default for `undefined`. A client that sent
    `rooms(filter: null)` made TypeGraphQL pass `null` straight through, so `filter.startTime` threw and the
    whole query returned `INTERNAL_SERVER_ERROR` (`backend/src/modules/rooms/services/room-service.ts:113`).
    Apollo omits the variable when it is `undefined`, which is why no frontend page ever hit it — but it was
    a live trap for any caller that builds the filter object conditionally, and it would have surfaced as a
    mystery 500. **The pattern to reuse whenever a service method defaults an input DTO:** keep the default
    for the omitted case, normalise the explicit case once, and read every field off the normalised local —
    `async search(user, filter: RoomFilter | null = {}) { … const criteria = filter ?? {}; … }`. Widening the
    resolver's arg type to `RoomFilterInput | null | undefined` matters as much: the old `| undefined` was a
    lie about runtime behaviour, and that lie is what hid the bug. **The same class of bug may exist in the
    other services that default an input DTO — that sweep was not authorised and was not done** (Phase 15
    fixed only the one method it had actually broken). A sibling trap from the same phase that is **not** a
    bug: **`equipmentIds: []` is a VALIDATION error**, not "no filter", because `RoomFilterInput` carries
    `@ArrayMinSize(1)` — so an unselected multi-select must be omitted, never sent empty.
26. **`rooms(filter: { startTime, endTime })` answers a TIME question only — it does not filter room status
    (learned 2026-09-27 in Phase 16).** The time filter drops rooms that overlap a `CONFIRMED` booking or
    fall in a maintenance window, but a `DISABLED`/`MAINTENANCE`-status room still comes back. So a client
    that treats "in the filtered result" as "bookable" will offer a room the server will reject
    (*"Room "Polaris 0.03" is not available for booking (current status: DISABLED)"*). The Phase 16 page
    keeps the two concerns separate on purpose: the client labels availability by time, shows the room's own
    status label for non-`AVAILABLE` rooms, and lets the engine reject status. **If a later phase adds a
    "is this room bookable" helper, it must AND `RoomStatus.AVAILABLE` with the time result.**
27. **A filtered query that fails must not be rendered as "everything is taken" (Phase 16).** The first cut
    of `CreateBookingPage` derived `freeRoomIds` only from `availability.data`. On error that is `[]`, so
    every available room rendered "Unavailable" with no explanation — a **false** answer, which is worse
    than no answer. The fix is a derived `availabilityKnown = !loading && !error` gate plus an explicit
    "could not check" message and a retry. **Generalise: whenever a UI derives a negative fact ("not free",
    "no results", "invalid") from query data, handle the error branch explicitly** — an empty result set and
    a failed request look identical in `data`.
28. **Two independent `new Date()` reads can silently produce a wrong default form range (Phase 16).** The
    default slot was originally `useState(() => nextHalfHourInput())` plus
    `useState(() => addMinutesInput(nextHalfHourInput(), 60))` — two clock reads that can straddle a
    half-hour boundary and yield a 30- or 90-minute default. `defaultSlotInput()` now takes **one** reading
    and derives both ends from it. Same trap applies to any "now + offset" pair of initial state values.
29. **Computed-style audits catch tap-target and token drift that DOM-text checks cannot (Phase 16).** The
    participant chips measured 38 px against §7.1's 44 px control contract while every DOM assertion passed;
    a computed-style sweep (`getBoundingClientRect().height`, `borderTopLeftRadius`, `borderTopColor`,
    `boxShadow` after a real `Tab` key event) found it and two of my own bad assertions. Note that in
    headless Chrome **`:focus` styles only flush after a real key event** — a bare `el.focus()` can report
    `boxShadow: none` even when the ring works, which is §8.22's "the tooling can lie about the design"
    in a new form. Always assert the focus ring after dispatching a key, not after a programmatic focus.
30. **A whole-row link swallows the row's action slot (Phase 17).** `BookingRow` makes the entire row the
    link's hit area with an `after:absolute after:inset-0` overlay on a `relative` row, so anything in the
    `ListRow` action slot sits *under* that overlay and cannot be clicked on its own. That is deliberate
    (a booking row's only action is "open it"), but it means **never put a real button in a booking row's
    action slot** — if a row ever needs its own action, it has to stop being one whole link.
31. **Time-based panels and status-based engine rules do not agree at the edges (Phase 17).** The 10-minute
    no-show release (Phase 9) and the 30-minute cancellation window (Phase 7) both act while a booking's
    time range is still in the future, so "upcoming" and "still cancellable" are different sets for up to
    10 minutes. My Bookings splits on **time** (matching its own copy, "bookings that have not finished
    yet"), and gates the `In progress` note on `CONFIRMED` so a released booking is never described as
    running. When a new surface needs "what can I still act on", ask for that explicitly rather than
    inferring it from the time range. **Refinement from Phase 18:** the no-show release compares against the
    booking's **start** (`findNoShowCandidates(now - 10min)`), *not* its end — a 21:30–22:30 booking with
    nobody checked in is already `NO_SHOW` from 21:40, while it is still running. So an unreleased fixture
    must start **more than 10 minutes in the future**; the Create Booking form's default slot (the next half
    hour) is not a safe fixture, because a long UI run will be reading a released booking with no Cancel and
    no Add People. (The Phase 17 note in §5 said "10 minutes after it ends" — that was wrong.)
32. **`extensions.code` is typed `unknown` in Apollo v3 (Phase 17).** `error.graphQLErrors[0].extensions.code`
    is `unknown`, so `getGraphQLErrorCode` (`utils/errors.ts`, added in Phase 17) narrows with
    `typeof code === 'string'`. Returning it directly is a `tsc` error, not a runtime one.
33. **Two CDP facts that cost three harness re-runs (Phase 17).** (a) `StatusBadge` renders
    `<span><span aria-hidden>{glyph}</span>{label}</span>`, so a badge's `textContent` is `"✕Cancelled"`,
    not `"Cancelled"` — assert with a suffix match, not equality. (b) A crashed harness leaves its headless
    Chrome alive holding the `--remote-debugging-port` **and** the `--user-data-dir`; the next run then
    silently attaches to that stale browser and its clicks go nowhere. Give every run a unique port +
    profile, `spawn` Chrome with `stdio: 'ignore'`, and kill it from an `exit`/`uncaughtException` hook.
    Also give `Runtime.evaluate` a timeout — a CDP response dropped during navigation otherwise hangs the
    run forever.
34. **The client keeps a step-for-step mirror of the server's recurrence generator (Phase 18).**
    `frontend/src/utils/recurrence.ts` re-implements `generateOccurrences` (cadence, the 90-occurrence cap,
    the inclusive end date) so the form can block an invalid series before submitting and label the button
    `Create N Bookings`. There is no shared package, so **any change to the server's generator or cap must
    be made here in the same commit** or the form will accept a series the server rejects (or block one it
    would accept). The same reasoning is why `BookingConfirmedPanel` re-queries `recurringBookingGroup`
    instead of trusting the client's own count, and why a series has no whole-series cancel/remove action —
    every control acts on the one occurrence the user is looking at.
35. **GraphQL argument validation answers before the service does (Phase 18).** `@ArrayMinSize(1)` on
    `AddParticipantsInput.employeeIds` (a deliberately transient field, §8.20) means an empty list never
    reaches `addParticipants` — the client sees `BAD_USER_INPUT` (class-validator), not the service's
    `VALIDATION_ERROR`, and the modal must show that message verbatim like any other. The same applies to
    `RemoveParticipantInput.employeeId`, so the client never sends `0`. Expect the *narrower* error class
    whenever a mutation argument is declared non-empty.
36. **A UI run that leaves stale fixtures will be graded against them, not against your new one (Phase 18).**
    Two harness rules followed from this: (a) **clean the DB first** — `p18-ui-cleanup.mjs` deletes every
    `P18 %` booking and `p18-temp-%` employee and prints the table counts, so a failed run's leftovers can
    never be mistaken for a fresh fixture (a stale series' first occurrence was already `NO_SHOW` when the
    next run looked for it, and the run then died on a cascade — `Illegal invocation` from a `setter.call`
    on a `null` element); (b) **make fixtures unique per run** — the seed prints the IDs the harness needs
    (`P18_FULL`, `P18_IMMINENT`, `P18_CAP`) and the harness refuses to run without them, because booking ids
    from a previous run point at deleted rows. Also `process.exit()` at the end of a CDP run: the socket
    keeps the event loop alive, so a finished run otherwise hangs until the shell times out.
37. **`no-show-release` runs every minute, so a "window has closed" booking is gone almost immediately
    (Phase 19).** `backend/src/jobs/no-show-release.ts` is scheduled `* * * * *`. A CONFIRMED booking whose
    10-minute window has passed is therefore flipped to `NO_SHOW` **within 60 seconds**, and the Check In
    button is *correctly* gone the moment a page loads. Two consequences to carry forward: (a) a UI test of
    the closed-window path must **not** use a shifted-back booking — use one starting in the future, which no
    sweep will ever touch (`p19-ui-seed.mjs` adds `P19_FUTURE` for exactly this); (b) in production the
    `checkIn` "window closed" message is only reachable in the sub-minute gap between the window closing and
    the sweep, so the client should never *depend* on it — which is why the UI shows the window rather than
    hiding the button on a local timer. The API harness is the right place to cover the closed-window rule, by
    calling the mutation directly.
38. **Never read a `timestamptz` out of psql as a bare wall clock (Phase 19).**
    `select start_time at time zone 'UTC'` returns a *naive* timestamp — `2026-09-27 12:00:09.689`, no
    offset — and `new Date()` then parses that string as **local** time. On this machine (IST, +05:30) that
    silently shifts the instant by 5 h 30 m, which made a correct page look broken: the UI was printing the
    correct `23:00` while the harness computed `17:40` from the same value and reported a false failure. Take
    the instant from the **API**, whose ISO string carries an explicit `Z`, or re-attach the offset in SQL
    (`at time zone 'UTC' at time zone '+00'`). When a harness compares rendered times, also assert that the
    browser and the harness share a timezone, so the next mismatch is explained rather than mysterious.
39. **A count assertion of `>= 1` is only meaningful if the counter can actually see the request
    (Phase 19).** Three "refetch" checks reported `0 request(s)` and looked like product bugs until the CDP
    filter was fixed: the harness matched `Network.requestWillBeSent` on `request.url.startsWith(API)`, but
    the app posts to the Vite dev proxy, so the real URL is `/graphql` on the **frontend** origin. Match
    `endsWith('/graphql')`. A zero count is also a legitimately failing assertion here (not a vacuous pass),
    but it distinguishes "the feature is broken" from "the harness is blind" only once you know the counter
    works — so pair the mechanism check with a positive control (e.g. assert the *initial* page load is
    counted) before trusting a `0`.

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

**Next — Phase 16 — Core Booking (Frontend). Phases 14 (Rooms) and 15 (Equipment) are DONE:**
- **First, read §5 Phase 15 and §9.4.** They record what the user authorised in the last session and, more
  importantly, which surfaces are *improvised rather than pixel-referenced* (the chips, the `RoomFilters`
  checkbox tiles, the `EquipmentManager` layout, the `/equipment` page, and every `ListRow` list). The
  booking screens are the next un-designed surface, so expect another "improvise or design?" question.
- The §7.2 shell is **done and measured** — the tokens are in `tailwind.config.ts`, the two role shells are
  re-measured, and Phases 14/15 pages sit inside them. Do not redo the rollout; build inside it.
- **`ListRow` exists** (`components/common/ListRow.tsx`). Reuse it for any new list rather than inventing
  a second row style.
- **Backend for booking is already proven** (Phases 6–8): `createBooking` with the optional nested
  `recurrence` input (returns the **first occurrence**; the series comes from
  `recurringBookingGroup(recurrenceId)`), `bookingDetails`, `myBookings`, `myMeetings`, the
  **30-minute** cancellation/change window shared by `cancelBooking` / `addParticipants` /
  `removeParticipant` (`utils/booking-time-policy.ts`), `bookingTypeOptions(user)` and the
  `EXC_bookings_room_no_overlap` DB constraint. Treat anything new as `plan.md` §Phase 16's
  "Backend adjustments" step, not a new module.
- **Known gaps to carry into Phase 16, both already recorded:** (a) `MyMeetings` returns only *strictly
  future* bookings, so a meeting that already started today is missing from "Today's Meetings" — a proper
  fix needs a backend date-range query; (b) the `rooms(filter: null)` 500 is **fixed** (§8.25), but the same
  default-parameter pattern may exist in the other services that default an input DTO — that sweep was never
  authorised, so check it if a booking query ever 500s for no visible reason.
- **Socket client is Phase 23, not 16** — but note the Phase 13 handshake rule: connect only when
  authenticated, and re-connect on login/logout. Vite already proxies `/socket.io` with `ws: true`.
- Remember when sending dates: GraphQL `DateTimeISO` requires **full ISO-8601 with seconds**
  (`2026-09-26T18:00:00+05:30`; `…T18:00+05:30` is rejected) — see §8.12.

<details><summary>Superseded — the Phase 14 "Next" brief as written on 2026-09-27 (kept for history)</summary>

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
  `Input`, `Select`, `DateTimePicker`). **Only `/login` is a real page — it was rebuilt from the user's design
  images and established the app-wide UI baseline in §7.1; every other route still renders
  `PlaceholderPage`.** Build Phase 14's UI out of the §7.1 tokens and the `components/auth/` primitives, and
  diff it against the design the same way (§7.1 workflow) — and ask the user for the Rooms designs if they
  have them, since the login screens only define the shared language (navy/blue, 44px controls, 4px radii),
  not the room-directory layout.
- **Phase 14 now starts with the §7.2 shell, not with a page.** The 2026-09-27 dashboard references define
  the authenticated chrome every Phase 14–23 page sits inside, and the tokens they need are not in
  `tailwind.config.ts` yet. Do §7.2.10 "Rollout" steps 1–3 (tokens → role-aware `AppLayout` → `AppCard` /
  `StatCard` / `PanelCard` / `EmptyState` / 40 px `Button` variants) **first**, re-measure the shell against
  both references, and only then build the Room Directory / Room Details / Admin Rooms pages inside it.
  `plan.md` §Phase 14's "Backend adjustments" step is unchanged and still unnecessary.
- **Socket client is Phase 23, not 14** — but note the Phase 13 handshake rule: connect only when
  authenticated, and re-connect on login/logout. Vite already proxies `/socket.io` with `ws: true`.
- Remember when sending dates: GraphQL `DateTimeISO` requires **full ISO-8601 with seconds**
  (`2026-09-26T18:00:00+05:30`; `…T18:00+05:30` is rejected) — see §8.12.

</details>

### 9.1 Decided 2026-09-26 — UI design system (user instruction: "the whole application should follow the same design as the images")

- **The two supplied screenshots are the app-wide UI source of truth**, binding on every frontend phase
  (14–23), not a one-screen brief. They were given as the product's visual standard, and per-page
  improvisation is exactly what the token set exists to prevent. Spec: §7.1.
- **Tokens live in `frontend/tailwind.config.ts`** (the 11 measured colours). Components reference tokens
  only; a screen that needs a new value extends the config and §7.1 rather than hardcoding.
- **The `components/auth/` primitives are the reference implementations** to copy for new screens — they are
  deliberately auth-named but nothing about them is auth-specific except their names.
- **The shared `Button` / `Input` / `Select` were left untouched.** They back every placeholder route, so
  restyling them now is a wide, invisible change; consolidate them into §7.1 once a second real page exists.
- **No icon library and no webfont were added** — the project depends on neither, and two icons plus one
  screen do not justify either. Inline SVG with `currentColor` + Tailwind's system stack.
- **"Forgot password?" is UI-only**: it sets the inline notice *"Password reset is not available yet. Please
  contact your administrator."*, consistent with the FR-6/FR-7 out-of-scope decision above. No link, no route.
- **The reference's typo was corrected** ("meeings" → "meetings"). The images are the design intent, not a
  byte-exact artifact to reproduce defects from — same logic as fixing spacing that fights the layout.
- **Register's confirm-password is client-side only.** `SignUpInput` still takes exactly
  `firstName`/`lastName`/`email`/`password`; no backend change was made or needed.
- **Fidelity is measured, not eyeballed** (§7.1 workflow). The model used for this session had no image
  vision, which is why every value here is a pixel measurement — and why that method is written down for the
  next screen.

### 9.2 Decided 2026-09-27 — app shell & dashboard theme (user instruction: "access the theme … so that it will follow the theme of the admin … and employee panel")

- **The two dashboard screenshots are the app-wide UI source of truth for every AUTHENTICATED page**, exactly
  as the login pair is for the auth screen. They are the second half of the design contract, not a
  dashboard-only brief. Spec: **§7.2**. This is the user's fourth and fifth design reference; the set is now
  login + register + admin dashboard + employee dashboard.
- **Two shells, chosen by role, never mixed:** admin gets the 299 px left sidebar, employee gets the centred
  horizontal top nav. They share every colour, card, button and empty-state rule, so the two must read as one
  product. `/login` and bare form screens stay §7.1.
- **12 new tokens** were measured (`navySoft`, `navyLabel`, `shell`, `heading`, `body`, `statLabel`, `faint`,
  `rule`, `tintStrong`, `roleBg`, `roleRule`, `roleInk`) and are recorded in §7.2.2. **They are NOT yet in
  `frontend/tailwind.config.ts`** — this session changed documentation only, on purpose, so no half-applied
  theme lands in the tree. Adding them is step 1 of §7.2.10 "Rollout", i.e. the first thing Phase 14 does.
- **`heading` (`#191E2B`) is a new, darker ink than §7.1's `ink` (`#232324`)**, and both are kept:
  `heading` for page/card titles, `ink` for form field text (where §7.1 measured `#232324`). They are close
  enough that swapping them is easy and wrong — do not "simplify" by deleting one.
- **`tintStrong` (`#EEF0FE`) sits alongside §7.1's `tint` (`#F4F5FE`)** rather than replacing it: the stat
  tile needs the stronger value, the auth role card was measured against the weaker one.
- **Cards use a 1 px `#000000` border plus a barely-there shadow** — the same "black hairline, not a grey
  token" decision §7.1 already made for text fields, now generalised. `shadow-sm` at most.
- **Dashboard buttons are 40 px, Title Case, and are not §7.1's 44 px UPPERCASE form button.** The auth
  submit and the dashboard primary are deliberately different components; do not unify them, and do not
  uppercase a dashboard button.
- **The one-line centred muted empty state replaces the old `EmptyState` look.** `components/common/
  EmptyState.tsx` (Phase 1) should be restyled to §7.2.6 rather than a second empty state being written —
  same reasoning as the §7.1 decision to leave `Button`/`Input` alone, except this one now has a real
  reference to match and every dashboard needs it.
- **The `gap-4` (stat rows) vs `gap-5` (two-wide panel row) difference is recorded as measured, not
  harmonised.** It is reproducible in both images, so it is intentional; if a later screen needs one gap
  everywhere, that is a design change to raise with the user, not a cleanup.
- **`Wait-List` keeps its hyphen** and the greeting is `Welcome Back, {firstName}` — both taken verbatim from
  the references. The two references disagree on apostrophe style; the straight `'` (already used by §7.1's
  copy) wins, the same call as correcting the `meeings` typo in §9.1.
- **This session's model had no image vision**, so §7.2 was produced by measuring the PNGs and OCR-ing the
  text (§8.24). Consequences, stated plainly: the numbers are measurements, but the *interpretation* (that
  the 40×39 tint tile holds the stat numeral, that panel titles are 18 px, that the layout is
  tile-top/label-bottom) is inference from geometry, and the shell must be re-measured against a real render
  before feature content is built on it. What the images do **not** decide — tables, forms, modals, calendar,
  charts, room cards — is listed in §7.2.11 and should be asked for, not invented.

## 10. Verification Checklist Before Starting New Work

- [ ] Backend: `npm run typecheck` passes (both workspaces)
- [ ] DB reachable; `npm run migrate -w backend` says "No migrations to run"
- [ ] `npm run seed -w backend` idempotent (logs "Seed skipped" if run before)
- [ ] `npm run dev` → `/health` returns `{"status":"ok"}`
- [ ] `npm run socket:verify -w backend` → 27/27 checks passed (only needed when touching `realtime/`,
      `notifications`, or the session/cookie plumbing; takes ~2.5 min because it waits for a real
      check-in window)
- [ ] Frontend: `npm run typecheck` passes and `npm run build -w frontend` is clean (no test runner or lint
      exists — §8.7)
- [ ] Frontend UI: any new/changed screen is diffed against its design per §7.1 (ink blocks within ~2px at
      1783×895 @2x, plus a 390×844 mobile check) and uses §7.1 tokens — no new hex/size literals
- [ ] Frontend shell: the admin and employee shells match §7.2.3 (bar 54/58 px, sidebar 299 px, nav pitch)
      and use the §7.2.2 tokens. **These tokens are now in `tailwind.config.ts` and the shell is
      re-measured against both references (§5)** — if a shell measurement drifts again, re-run the §8.24
      measurement rather than eyeballing it
- [ ] Frontend primitives: any new card/stat/panel/empty state comes from §7.2.4–7.2.7, and dashboard
      buttons are 40 px Title Case (not §7.1's 44 px UPPERCASE form button)
- [ ] Frontend list rows: **use the improvised `components/common/ListRow.tsx`** (user-authorised 2026-09-27,
      §9.4) — §7.2.11's exclusion is closed for lists. A new list surface should still improvise on the same
      primitives (and say so in this file) rather than copy an unrelated page's markup
- [ ] Frontend: an improvised surface (no user design) is recorded in §5 + §9.4 so the next session knows
      which screens are not pixel-referenced
- [ ] Frontend: a **transient** filter input is omitted rather than sent empty (`equipmentIds: []` fails
      `RoomFilterInput`'s `@ArrayMinSize(1)`) — check this whenever a new optional filter arg is added
- [ ] Frontend: a UI that derives a **negative** fact from query data ("not free", "no results") handles the
      error branch explicitly — an errored query returns no `data` and would otherwise render as
      "everything is taken" (§8.27)
- [ ] Frontend: **icons come from `react-icons/lu`** (§9.3), not hand-rolled `<svg>`; and paired
      "now + offset" default form values are derived from **one** clock read (§8.28)
- [ ] Frontend: booking lists use the shared `components/common/BookingRow.tsx` (Phase 17, §9.6) so every
      booking row links to `/bookings/:id` — and its action slot stays a non-interactive badge, because the
      whole-row link overlay covers it (§8.30)
- [ ] Frontend: a panel that splits bookings by **time** must not derive a second fact ("in progress",
      "still cancellable") from the time range alone — the engine's status rules act inside the future
      (§8.31)
- [ ] Frontend: a series/recurrence feature has **one** generator, mirrored step for step
      (`utils/recurrence.ts` ↔ the server's), and the panel/consent copy says occurrences are acted on
      **one at a time** — there is no whole-series cancel, and the confirmation re-reads the server's group
      instead of a client count (§8.34)
- [ ] Frontend: a participant-control surface (add/remove) shows the server's rejection **verbatim** where the
      user acted, states the rule in the modal instead of pre-computing it, and gates the control on
      organiser-or-admin rather than on a client-side time calculation (§9.6)
- [ ] Frontend: an empty value for a mutation arg declared `@ArrayMinSize(1)` is rejected by class-validator
      as **`BAD_USER_INPUT`**, not by the service — never assert the service's error class for it (§8.35)
- [ ] Frontend: a check-in / no-show surface **shows the server's window bounds rather than hard-coding the
      10 minutes**, keeps the control visible for a window it cannot trust its own clock against, gates it on
      `CONFIRMED && !checkedIn && (organiser || listed participant)` with **no admin exemption** (FR-38 is
      stricter than FR-28 — do not reuse the Add People `isOrganiser`), and shows refusals verbatim (§9.8)
- [ ] Frontend: after a mutation whose result depends on a **field resolver** (`hasCheckedIn`, `checkIn`),
      the page **refetches and awaits** the details query — the cache write from the mutation response cannot
      populate a field-resolver field, so the UI would otherwise show a stale "Not checked in" (§9.8)
- [ ] Frontend: a page whose data the server can change on its own (the no-show/completion crons emit no
      socket event) refetches on window focus via `useRefetchOnFocus`, rather than polling (§9.8, §8.17)
- [ ] Any live-stack verification against the dev DB: clean the previous run's fixtures **first**, make the
      new fixtures unique, and re-read the baseline counts with SQL afterwards (§8.16, §8.36)
- [ ] Any harness that compares a rendered time against a DB read: take the instant from the **API** (its ISO
      string carries an explicit `Z`), never from a bare `at time zone 'UTC'` psql projection, and assert the
      browser and harness share a timezone (§8.38)
- [ ] Any CDP harness counting network requests: the frontend talks to the **Vite dev proxy**, so match
      `endsWith('/graphql')` on the *frontend* origin, and confirm the counter sees the initial page load
      before trusting a `0` (§8.39)

Report a change/decision here when it affects how the app runs (tooling, schema, phases, conventions).

### 9.3 Decided 2026-09-27 — building the shell + full Phase 14 frontend

Authorisation: the user asked for the §7.2 theme to be *built and applied* (not just specified) and then
chose to do the **full Phase 14** frontend in the same pass, including the room catalog.

- **Scope: frontend only.** No backend changes were made, and none turned out to be necessary — the existing
  `rooms`/`room` queries, `RoomFilterInput` and the room mutations already covered everything Phase 14 needs.
- **`react-icons@5.7.0` was added, reversing §9.1's "no icon library" decision.** The user chose it over
  hand-rolled SVGs. Nav icons come from it. `npm audit` reports no advisory for the package (the 7 open
  advisories in the tree are pre-existing). **If a later phase wants to go back to zero icon dependencies,
  this is the decision to revisit — the only consumers are `TopNav` and `Sidebar`.**
- **Navigation follows the reference labels verbatim** (`Dashboard`, `Calendar`, `Rooms`, `Equipment`,
  `Wait-List`, `Meetings`), and each label got a real route. `Calendar` and `Analytics` exist as
  placeholder pages because their phases (12) are backend-only so far.
- **Below `lg` the top nav falls back to a full-width horizontal strip**; at `lg+` the admin gets the
  299 px sidebar and the employee keeps the inline pill nav. The header wraps rather than overflowing.
- **`PageHeader` takes an explicit `topPad` prop** (admin `pt-8`, employee `pt-10`) because the two
  reference screenshots genuinely differ. This is measured, not a magic number — do not collapse it.
- **Dashboard definitions the user settled:**
  - **"Active Rooms" = `AVAILABLE` + `MAINTENANCE`.** Not just `AVAILABLE`.
  - **Employee "Today's Meetings" is `myMeetings` filtered client-side to the browser-local day.** Caveat
    worth remembering: the backend only returns *strictly future* confirmed meetings, so a meeting that
    already started today is **missing** from that panel. Fixing it properly needs a backend date-range
    query — out of scope for a frontend-only phase.
  - **"Today" is the browser's local day**, serialised to ISO with seconds. The docs specify no timezone
    handling, so none was invented.
- **Equipment filter/display was left out of Phase 14** — it belongs to the Phase 15 equipment phase, so
  `RoomForm` and the filters have no equipment fields.
- **Open item needing the user: CLOSED in Phase 15** — the row design for the admin dashboard's
  `Today's Bookings` and `Room Usage` panels. The user authorised improvising rows in Phase 15 (§9.4);
  `components/common/ListRow.tsx` now backs all four dashboard panels. See §7.2.11 and §5.
- **Equipment filter/display: DONE in Phase 15** — it is now on the directory cards, the admin cards, room
  details and `RoomFilters`. (`RoomForm` still has no equipment fields, by design: assignment lives in the
  separate `EquipmentManager` modal.)
- **Cosmetic, pre-existing, not from this work:** the app 404s on `/favicon.ico` in the browser console
  because `frontend/index.html` has no favicon link and there is no `frontend/public/` directory. §7.1
  forbids adding image assets without permission, so it was left alone. One line to fix if wanted.

### 9.4 Decided 2026-09-27 — Phase 15 Equipment (frontend), incl. the list-row improvisation

The user authorised Phase 15 and, when asked for the §7.2.11 surfaces it does not decide, answered five
questions up front:

- **Improvise the list rows** from the existing §7.1/§7.2 primitives rather than pausing for designs.
  → `components/common/ListRow.tsx`; used by the four dashboard panels, `EquipmentManager` and the
  `/equipment` catalog. This also closed the last Phase 14 open gap (§9.3) and, by extension, the
  employee twin of the same problem.
- **Also build the `/equipment` catalog page** (the route the admin nav has always linked to, previously
  a `PlaceholderPage`): **create + rename**. **No delete**, because the backend still has no
  `deleteEquipment` mutation — §7.1/§7.2 forbid inventing UI, and a delete button that errors is worse
  than none.
- **Equipment search filter = multi-select checkboxes with AND semantics**, matching
  `RoomService.search`'s `every()` over `filter.equipmentIds` and the "must have all selected" reading of
  the filter. Sent **only when ≥ 1 box is ticked**, because `RoomFilterInput.equipmentIds` is
  `@ArrayMinSize(1)` — an empty array is a VALIDATION error, not "no filter".
- **Equipment names are chips** (user used the word "chips"), and they must **wrap** rather than truncate
  or overflow. Cards show the first 4 plus a `+N more` affordance; **room details show all of them**,
  because a details page that hides equipment defeats the purpose of FR-10. Empty state is a muted
  "No equipment".
- **The four dashboard panels** (`Today's Bookings`, `Room Usage`, `Today's Meetings`, `Upcoming
  Meetings`) all needed rows, not just the two admin ones that were visibly empty — a populated panel
  rendered as heading + caption is a bug regardless of which panel it is.

Scope/verification notes are recorded in §5 (Phase 15). Two follow-ups, one resolved and one still open:

- **The `rooms(filter: null)` 500 — FIXED after asking.** The session's standing rule is not to touch
  anything the user has not authorised, so the bug was reported with the fix proposal rather than patched
  silently; the user chose "fix it now". `RoomService.search` now takes `RoomFilter | null = {}` and
  normalises with `filter ?? {}`, the resolver arg type was widened to `RoomFilterInput | null |
  undefined`, and the API script asserts the case (**28/28 pass**). This is the **only** backend change in
  Phase 15. The wider sweep of other defaulted-input services was offered and declined.
- **The improvise-not-referenced surfaces**: the chips, the `RoomFilters` checkbox tiles, the
  `EquipmentManager` layout and the `/equipment` page. If the user supplies designs for any of these
  later, they are the ones to revisit.

### 9.5 Decided 2026-09-27 — Phase 16 Core Booking (frontend)

The user authorised Phase 16 and, when the plan's open questions were put to them, answered five
questions up front (the same pattern as §9.3/§9.4 — ask, then build):

- **Add an `employees` query, or leave the ParticipantPicker without a directory?** → **Add it.** It is
  `@Authorized()` for every signed-in user and returns the whole directory **including the admin
  account**, ordered by `lastName`, `firstName`, `id`. The **UI**, not the API, is responsible for hiding
  the signed-in user — the backend already rejects the organiser as their own participant, so hiding is a
  convenience and keeping the list whole keeps the query reusable.
- **Add a dedicated "is this slot free" query for live form feedback?** → **No — reuse
  `rooms(filter: { startTime, endTime })`.** It already encodes the booking + maintenance overlap rules, so
  a new query would have duplicated the engine. The page runs the unfiltered and the time-filtered query
  and diffs them. Consequence to remember: that filter is **time-only** (§8.26).
- **No booking design was supplied.** → **Improvise on the existing §7.1/§7.2 primitives** (room selector
  cards, participant chips, a confirmation panel). Recorded as not pixel-referenced, like §9.4's surfaces.
- **Recurrence in this phase?** → **No — Phase 18.** So the mutation sends no `recurrenceId` and the form
  has no recurrence controls.
- **Where does the user land after a successful booking?** → **Stay on Create Booking with a confirmation
  panel**, offering "Book another room" and a "View My Bookings" link. The link is allowed to point at
  Phase 17's placeholder; the user did not ask to defer the confirmation until My Bookings exists.

Two follow-ups, both now closed and recorded in §5/§8 rather than left open:

- **The failed-availability false negative** (every room read "Unavailable" when the check errored) and
  the **two-clock-reads default slot** were found during verification and fixed in the same session, plus
  the participant chips' 38 px tap target (§8.29) and the hand-rolled SVGs, which contradicted §9.3's
  `react-icons` decision and are now `LuCheck`/`LuPlus`.
- **The `employees` query is the phase's only backend change**, and it was raised with the user *before*
  any code was written, per the standing rule. The wider "does any other phase need a directory query?"
  sweep was not proposed and not done.

### 9.6 Decided 2026-09-27 — Phase 17 Manage Bookings & Cancellation (frontend)

The user authorised Phase 17 and answered six questions up front (the §9.3/§9.4/§9.5 pattern — ask, then
build). No design was supplied for any of the three screens.

- **No design references were given for My Bookings, Booking Details or the cancel modal.** → **Improvise
  on the existing §7.1/§7.2 primitives** (`AppCard`, `PanelCard`, `ListRow`, `StatusBadge`, `Modal`, the
  existing `Button` variants, `PageHeader topPad="pt-10"`), exactly as §9.4/§9.5 did. Recorded as not
  pixel-referenced (§5).
- **`/meetings` (My Meetings) was listed as a later phase. Build it in Phase 17?** → **Yes.** It is one
  page over the existing `myMeetings` query, and the employee dashboard's two meeting panels were going to
  need the same shared row anyway. The nav link already existed.
- **How should My Bookings be split?** → **Two panels, Upcoming and Past**, with **Past capped at 10 rows**
  and a `Show all` / `Show less` control. Upcoming is soonest first, Past most recent first, and a booking
  that is under way right now stays in Upcoming (marked `In progress`) rather than jumping lists.
- **Should the Cancel button be hidden or disabled once the 30-minute window has passed?** → **No — keep
  it available on confirmed bookings, explain the 30-minute rule in the modal, and show the server's
  authoritative error.** So the client never does time maths to gate the action; the two real rejections
  ("Bookings can only be cancelled until 30 minutes before they start." and "You are not allowed to perform
  this action.") appear verbatim, in the modal, where the user acted. A consequence, recorded so it is not
  mistaken for an oversight: **the Cancel action is shown to any viewer of a confirmed booking, including a
  participant who can never use it** — hiding it per-role was not chosen, because the server is the
  authority for ownership and the button doubles as the honest way to surface that.
- **What should Booking Details show beyond the booking itself?** → **The read-only check-in state and the
  recurring-series information.** Both are plain selections on the existing `BookingType`. Participant
  add/remove is explicitly **not** in this phase (Phase 18+), and the check-in **button** is Phase 19 — this
  phase only reports what already happened.
- **Should every booking row across the app link to `/bookings/:id`?** → **Yes** — My Bookings, My
  Meetings, and both employee-dashboard meeting panels. Hence the shared `BookingRow` primitive (and the
  §8.30 consequence that its action slot cannot hold a real button).

Two follow-ups, both closed in the same session and recorded in §5/§8 rather than left open:

- **A released booking was described as "In progress".** The 10-minute no-show release flips a booking to
  `NO_SHOW` while its time range is still in the future, so the first cut printed `In progress` on a meeting
  that had already been given up on. The note is now gated on `CONFIRMED` (§8.31).
- **`getGraphQLErrorCode` was needed by the details page and did not exist** — `utils/errors.ts` only had
  the message helper. Added, with the `typeof` narrowing Apollo's `unknown` `extensions.code` requires
  (§8.32). `DetailRow.value` also had to become `ReactNode`, because the room cell is a `<Link>`.

### 9.7 Decided 2026-09-27 — Phase 18: recurring meetings + the participant controls the user pulled in

Authorisation: the user asked to continue with the Phase 18 checklist, and (a) chose to **pull the
participant add/remove UI into this phase** rather than leave it for a later one, and (b) approved
running the verification fresh — API, headless-Chrome UI, then the DB baseline.

- **How should a series behave in the UI?** → **One occurrence at a time, everywhere.** The details page
  has a `RecurringSeriesPanel` that lists the series (capped at 10 with Show all), each row linking to its
  own booking; cancelling, adding and removing all act on the single occurrence the user is on, and the
  panel and both modals **say so**. There is deliberately **no whole-series cancel** — that would need a
  different backend operation and a different confirmation, so it is out of scope until asked for.
- **Should the client pre-compute the 30-minute participant window?** → **No**, same decision as Phase 17's
  cancel modal (§9.6): the modal states the rule ("Only the organiser of this booking — or an admin — can
  add or remove people, and only until 30 minutes before it starts"), and the server's rejection is shown
  **verbatim, where the user acted**, with the modal staying open. Consequence recorded so it is not read as
  a bug: a user *can* open the picker at 29 minutes and be refused.
- **Should the add/remove controls be hidden per role in the client?** → **One `Add People` control,
  shown to the organiser or an admin only** (the server remains the authority — an unrelated user gets
  `NOT_ALLOWED`). A participant gets `Leave` on **their own** row only, titled **"Leave this meeting"**; the
  organiser/admin gets the remove confirm. The user was shown the wording and kept it. The title/button
  split matches `CancelBookingModal` ("Cancel Booking" / "Cancel <title>?"): the **title** is
  *"Leave this meeting"* and the confirming **button** is *"Leave meeting"*.
- **Should the confirmation page report a client-side occurrence count?** → **No.** `BookingConfirmedPanel`
  re-queries `recurringBookingGroup` and shows the server's own list (first 5 + "and n more"), so the
  confirmation cannot disagree with the series.
- **Should the row note be a stored pattern?** → **No — it is derived.** `bookingRowNote` infers
  "Repeats every week / every day" from the **gaps between the occurrences on screen**, so a series that
  was edited occurrence-by-occurrence still describes what is actually on the calendar. My Bookings shows it
  as a subtle second-line note next to the existing context, never as the row title.
- **Verification fixture decisions (user's calls):** a **full-room fixture needs real extra employees**, so
  the seed inserts two throwaway `p18-temp-*@example.com` rows with SQL (there is no delete-employee API)
  and the cleanup script removes them; the UI harness asserts the modal's **title**
  (`Leave this meeting`) rather than its button label (`Leave meeting`) — the assertion was wrong, the
  wording was right; and both the API and UI passes were re-run from a clean DB, with the baseline counts
  re-read at the end. §8.36 records what that fixture discipline is protecting against.
- **Not decided / not built here:** whole-series cancel or edit, a recurrence "skip this occurrence"
  affordance beyond cancelling it, editing a series' cadence after creation, and any server-side
  recurrence object beyond the `recurrenceId` that already exists. Raise these with the user before
  building them.

### 9.8 Decided 2026-09-27 — Phase 19: Check-in & No-show (frontend)

All six were asked at kickoff and the user took every recommendation. The plan's own Phase 19 checklist
(`doc/plan.md`) left these open, so they are recorded here rather than inferred.

- **Publish the window on `BookingType` rather than hard-code 10 minutes in the client.** → **Yes — two
  plain mapped scalars**, `checkInWindowOpensAt` / `checkInWindowClosesAt`, from `checkInWindowEnd`. The 10
  minutes is a server policy that Phase 9 owns; a second literal in the frontend would be a rule that can
  drift. Rejected field resolvers for the bounds because they would put per-row work in every list request
  and break the field-resolver-free list guarantee (§8.19).
- **When to show the Check In button?** → **Always, for a `CONFIRMED` booking the user organises or is a
  participant in, that has not been checked in** — the client does **not** compare the window to the clock.
  Hiding it early or late would be a second, silently-wrong copy of the server's rule, and the user would get
  a button that does nothing instead of an explanation. The server's message is shown verbatim (§9.6).
- **Confirm before checking in?** → **No, one click, no modal.** Check-in is idempotent in effect (a second
  attempt is refused server-side), takes one click, and a confirm dialog for it would be pure friction. The
  destructive/irreversible actions in this app (`CancelBookingModal`, `RemoveParticipantModal`) still confirm.
- **Should a booking row show that you checked in?** → **No, leave `BookingRowFields` alone.** The earlier
  framing of this option ("a `checkIn` note on the row") was *wrong* and was corrected mid-decision: My
  Bookings selects a deliberately lean fragment, so the row has no check-in data to render and adding the
  field would grow every list request for a fact the user rarely needs. Status changes are picked up by the
  refetch below instead.
- **How does a list learn about a status the server changed on its own?** → **Refetch on window focus, plus
  an explicit Refresh control on My Bookings.** The no-show release and completion sweep emit no socket event
  (Phase 13 shipped no `NO_SHOW_RELEASED` type on purpose), so something has to re-read. Polling was
  considered and **rejected** — it is recurring traffic for a page that is usually open all morning, and
  focus is exactly when a user looks again. Wired into **My Bookings and Booking Details** (the two pages
  that show a booking's live state); the dashboard and My Meetings were left alone, as that is the exact
  scope the user approved.
- **No design was supplied for Phase 19**, so the surfaces are improvised from the existing primitives under
  §7.2.11 — the header action group's existing `Button`, `DetailRow`, and plain text. Not pixel-referenced.
- **Fixture/testing consequence the user did not choose but must know:** because the no-show sweep runs every
  minute (§8.37), the closed-window error is verified through the **API** harness, and the UI refusal test
  uses a future booking.

**Not decided / not built here:** a `NO_SHOW_RELEASED` socket event or any push-based status update,
per-participant check-in (a booking is checked in once, by whoever arrives first), and editing or withdrawing
a check-in. Raise these with the user before building them.
