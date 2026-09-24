# Meeting Room Intelligence — Implementation Plan

**Project type:** Full-stack meeting-room booking system
**Source of truth:** doc/requirement.md
**Status:** Planning document — no code has been written yet.

## Scope Note

Testing, Husky, and extra tooling are intentionally left out for now. They can be added after the core booking flow works.

---

## 1. Tech Stack

| Area                | Technology                                            |
| ------------------- | ------------------------------------------------------ |
| Frontend            | React, TypeScript, Tailwind CSS, Apollo Client (GraphQL client) |
| Backend             | Node.js, Express, TypeGraphQL, TypeScript              |
| Database & ORM      | PostgreSQL, TypeORM                                    |
| Real Time           | Socket.io                                              |
| Automation & Security | JWT, bcrypt, class-validator, node-cron (scheduler)   |

### Supporting packages required by the stack

These are not new technology choices. They are the minimum packages the stack above needs in order to run.

| Package                  | Why it is needed                                              |
| ------------------------ | -------------------------------------------------------------- |
| @apollo/server + graphql | Hosts the TypeGraphQL schema on Express                        |
| reflect-metadata         | Required by TypeGraphQL, TypeORM and class-validator decorators |
| pg                       | PostgreSQL driver for TypeORM                                  |
| cors, cookie-parser      | Cross-origin requests and reading the JWT from an httpOnly cookie |
| dotenv                   | Loading environment variables                                  |
| tsx                      | Running TypeScript in development                               |
| Vite                     | Build tool and dev server for the React app                     |

---

## 2. Architecture

### 2.1 Approach

Module-first, with the same layers repeated inside every module.

Each feature (rooms, bookings, waitlist, and so on) lives in its own module folder. Inside each module the code is split into layers, so UI code, API handling, business logic and database access stay separate.

### 2.2 Layers and responsibilities

| Layer            | Folder         | Responsibility                                              |
| ---------------- | -------------- | ----------------------------------------------------------- |
| Contract         | dto/           | Input and output types, validation with class-validator     |
| Presentation     | resolvers/     | GraphQL queries and mutations, request handling              |
| Application      | services/      | Business rules and use cases                                |
| Data access      | repositories/  | Database queries and persistence                            |
| Database         | entities/      | TypeORM entities and relationships                          |
| Supporting       | utils/         | Module-specific helper functions                            |
| Module boundary  | index.ts       | Public exports of the module                                |

### 2.3 Dependency direction

```
Client (React + Apollo Client)
        │
        ▼
Resolver      → GraphQL transport, auth guards
        │
        ▼
Service       → business rules
        │
        ▼
Repository    → queries and transactions
        │
        ▼
Entity        → TypeORM model
        │
        ▼
PostgreSQL
```

**Rules**

- A resolver never talks to a repository, entity or database directly.
- A service never talks to the database directly. It always goes through a repository.
- The frontend only talks to the backend through GraphQL.

**Example:** `createBooking` mutation → BookingResolver → BookingService → BookingRepository → Booking entity → PostgreSQL.

### 2.4 Modules

| Module        | Responsibility                                              |
| ------------- | ------------------------------------------------------------ |
| auth          | Login, logout, current user, JWT session, roles              |
| rooms         | Room management, search, availability                        |
| equipment     | Equipment management and room assignments                    |
| bookings      | Booking lifecycle, recurrence, cancellation                  |
| participants  | People invited to a booking                                  |
| checkin       | Check-in window and no-show state                            |
| waitlist      | Waiting list and automatic conversion                        |
| maintenance   | Maintenance windows for rooms                                |
| analytics     | Admin calendar and usage information                         |
| notifications | Real-time notifications via Socket.io                        |

---

## 3. Folder Structure

### 3.1 Project root

```
meeting-room-intelligence/
│
├── doc/
│   ├── requirement.md
│   └── plan.md
│
├── backend/
├── frontend/
│
├── .gitignore
├── package.json          (workspaces: backend, frontend)
├── tsconfig.base.json
└── README.md
```

### 3.2 Backend

```
backend/
│
├── src/
│   │
│   ├── config/
│   │   ├── env.ts                 typed environment variables
│   │   └── data-source.ts         TypeORM DataSource (synchronize disabled)
│   │
│   ├── common/
│   │   ├── context.ts             builds GraphQL context (user from JWT cookie)
│   │   ├── auth-checker.ts        TypeGraphQL @Authorized role check
│   │   ├── errors/
│   │   │   ├── application-error.ts
│   │   │   ├── error-codes.ts
│   │   │   └── index.ts
│   │   └── logger.ts
│   │
│   ├── modules/
│   │   │
│   │   ├── auth/
│   │   │   ├── dto/
│   │   │   ├── entities/          employee.ts
│   │   │   ├── repositories/
│   │   │   ├── resolvers/
│   │   │   ├── services/
│   │   │   ├── utils/             jwt.ts, password.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── rooms/
│   │   │   ├── dto/
│   │   │   ├── entities/          room.ts
│   │   │   ├── repositories/
│   │   │   ├── resolvers/
│   │   │   ├── services/
│   │   │   ├── utils/
│   │   │   └── index.ts
│   │   │
│   │   ├── equipment/
│   │   │   ├── dto/
│   │   │   ├── entities/          equipment.ts, room-equipment.ts
│   │   │   ├── repositories/
│   │   │   ├── resolvers/
│   │   │   ├── services/
│   │   │   ├── utils/
│   │   │   └── index.ts
│   │   │
│   │   ├── bookings/
│   │   │   ├── dto/
│   │   │   ├── entities/          booking.ts
│   │   │   ├── repositories/
│   │   │   ├── resolvers/
│   │   │   ├── services/
│   │   │   ├── utils/             recurrence.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── participants/
│   │   │   ├── dto/
│   │   │   ├── entities/          participant.ts
│   │   │   ├── repositories/
│   │   │   ├── resolvers/
│   │   │   ├── services/
│   │   │   ├── utils/
│   │   │   └── index.ts
│   │   │
│   │   ├── checkin/
│   │   │   ├── dto/
│   │   │   ├── entities/          check-in.ts
│   │   │   ├── repositories/
│   │   │   ├── resolvers/
│   │   │   ├── services/
│   │   │   ├── utils/
│   │   │   └── index.ts
│   │   │
│   │   ├── waitlist/
│   │   │   ├── dto/
│   │   │   ├── entities/          waitlist-entry.ts
│   │   │   ├── repositories/
│   │   │   ├── resolvers/
│   │   │   ├── services/
│   │   │   ├── utils/
│   │   │   └── index.ts
│   │   │
│   │   ├── maintenance/
│   │   │   ├── dto/
│   │   │   ├── entities/          maintenance.ts
│   │   │   ├── repositories/
│   │   │   ├── resolvers/
│   │   │   ├── services/
│   │   │   ├── utils/
│   │   │   └── index.ts
│   │   │
│   │   ├── analytics/
│   │   │   ├── dto/
│   │   │   ├── repositories/      read-only aggregate queries
│   │   │   ├── resolvers/
│   │   │   ├── services/
│   │   │   ├── utils/
│   │   │   └── index.ts
│   │   │
│   │   └── notifications/         real-time only via Socket.io
│   │       ├── dto/               notification payload types
│   │       ├── services/          decides who is notified and emits the event
│   │       ├── utils/             payload builders
│   │       └── index.ts
│   │
│   ├── realtime/
│   │   ├── socket.ts              Socket.IO server, cookie handshake auth, room joins
│   │   └── events.ts              event names and payload types
│   │
│   ├── jobs/
│   │   ├── registry.ts            starts and stops all node-cron jobs
│   │   ├── no-show-release.ts     runs every minute
│   │   └── booking-completion.ts  marks finished bookings as completed
│   │
│   ├── migrations/                numbered TypeORM migrations
│   ├── seed/
│   │   └── seed.ts                demo admin, employees, rooms, equipment, bookings
│   │
│   ├── schema.ts                  buildSchema() with all resolvers
│   └── server.ts                  Express + Apollo + Socket.IO + cron start
│
├── .env.example
├── package.json
└── tsconfig.json
```

### 3.3 Frontend

```
frontend/
│
├── src/
│   │
│   ├── graphql/
│   │   ├── apollo-client.ts       HttpLink with credentials: include
│   │   ├── queries/               one file per feature (rooms, bookings, analytics …)
│   │   └── mutations/             one file per feature (auth, bookings, waitlist …)
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── NotificationBell.tsx   shows real-time notifications
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── LoadingState.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── ErrorState.tsx
│   │   │   └── StatusBadge.tsx    icon + text, not color only
│   │   └── forms/
│   │       ├── Input.tsx
│   │       ├── Select.tsx
│   │       └── DateTimePicker.tsx
│   │
│   ├── context/
│   │   └── AuthContext.tsx        current user, login, logout, role
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useDebounce.ts
│   │
│   ├── pages/
│   │   ├── login/
│   │   │   └── LoginPage.tsx
│   │   ├── dashboard/
│   │   │   └── DashboardPage.tsx
│   │   ├── room-directory/
│   │   │   ├── RoomDirectoryPage.tsx
│   │   │   └── RoomFilters.tsx
│   │   ├── room-details/
│   │   │   └── RoomDetailsPage.tsx
│   │   ├── create-booking/
│   │   │   ├── CreateBookingPage.tsx
│   │   │   └── ParticipantPicker.tsx
│   │   ├── my-bookings/
│   │   │   └── MyBookingsPage.tsx
│   │   ├── booking-details/
│   │   │   └── BookingDetailsPage.tsx
│   │   ├── admin-rooms/
│   │   │   ├── AdminRoomsPage.tsx
│   │   │   ├── RoomForm.tsx
│   │   │   └── EquipmentManager.tsx
│   │   ├── admin-calendar/
│   │   │   └── AdminCalendarPage.tsx
│   │   └── analytics/
│   │       └── AnalyticsPage.tsx
│   │
│   ├── realtime/
│   │   ├── socket.ts              Socket.IO client (withCredentials)
│   │   ├── events.ts              event names and payload types
│   │   └── useNotifications.ts    listens to events, shows notifications, refetches queries
│   │
│   ├── routes/
│   │   ├── index.tsx              route table
│   │   ├── ProtectedRoute.tsx     redirects anonymous users to login
│   │   └── AdminRoute.tsx         admin-only routes
│   │
│   ├── theme/
│   │   └── index.ts               design tokens: status labels, icons and Tailwind color classes
│   │
│   ├── types/
│   │   └── index.ts               shared TypeScript types and enums
│   │
│   ├── utils/
│   │   ├── date.ts
│   │   └── format.ts
│   │
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css                  Tailwind directives
│
├── index.html
├── tailwind.config.ts
├── vite.config.ts
├── package.json
└── tsconfig.json
```

---

## 4. Feature-Wise Phases

The project is built feature by feature. Every phase delivers one feature **end-to-end** (backend + frontend together), so the work can be verified as it ships.

### Phase 1 — Project Foundation

**What we build:** An empty but working full-stack skeleton.

**Backend tasks:**
- Set up the workspace (backend + frontend workspaces).
- Typed environment variables, error classes and error codes.
- Express server with cors and cookie-parser.
- Mount Apollo Server + TypeGraphQL schema (empty) at /graphql.
- Add /health endpoint.
- Build GraphQL context that reads the JWT cookie and returns a nullable user.
- Cron registry (start/stop with the server).

**Frontend tasks:**
- Configure Vite, Tailwind and Apollo Client (credentials: include).
- Routing skeleton + layout (navbar, sidebar).
- Shared components: Button, Modal, LoadingState, EmptyState, ErrorState, StatusBadge (icon + text).

**Deliverable:** Frontend and backend run together.
**Done when:** `/health` returns 200 and the frontend opens against the backend.

### Phase 2 — Database Design

**What we build:** The full data model.

**Backend tasks:**
- TypeORM DataSource with synchronize disabled.
- Entities: Employee, Room, Equipment, RoomEquipment, Booking, Participant, CheckIn, WaitlistEntry, Maintenance.
- Migrations with constraints — unique (employee email, room name, equipment name, one check-in per booking, one participant per person per booking), check (capacity > 0, start before end).
- Indexes — booking by room/time, booking by organizer/start, booking by recurrence, waitlist by room/start, maintenance by room/start.
- Seed data: admin, employees, rooms, equipment, sample bookings including edge cases.

**Frontend tasks:** None (waits for the API).

**Deliverable:** Schema + demo data.
**Done when:** Migrations run/revert cleanly and the seed loads.

### Phase 3 — Authentication & Roles

**What we build:** Login/logout, session and role-based authorization.

**Backend tasks:**
- SignUp, LogIn, AdminLogin, Logout, CurrUser.
- bcrypt hashing, JWT in httpOnly cookie.
- TypeGraphQL auth checker + @Authorized on every protected resolver.
- Ownership/role checks repeated inside services (so direct GraphQL calls follow the same rules).
- class-validator on every input.

**Frontend tasks:**
- Login/Register page (loading/error/success states).
- AuthContext (current user, login, logout, role).
- ProtectedRoute and AdminRoute.

**Deliverable:** Secure API + login UI.
**Done when:** Anonymous calls return UNAUTHENTICATED; an employee cannot call admin-only operations.

### Phase 4 — Rooms

**What we build:** Room search, filters, availability and admin room management.

**Backend tasks:**
- Room CRUD: create/update/disable/reenable/list/details (reject duplicate names).
- Room search: filter by status, capacity, floor, equipment.
- Availability: exclude rooms with overlapping CONFIRMED bookings or maintenance windows.

**Frontend tasks:**
- Room Directory page + RoomFilters.
- Room Details page.
- Admin Rooms page + RoomForm.

**Deliverable:** Browsable, searchable room catalog.
**Done when:** You can filter rooms and see which are free for a selected slot.

### Phase 5 — Equipment (Integrated with Rooms)

**What we build:** Equipment records and their assignment to rooms.

**Backend tasks:**
- Equipment create/edit/list (reject colliding names).
- Assign/remove equipment to a room (reject duplicates and no-op removals).
- Room field resolver returns equipment list on demand.

**Frontend tasks:**
- EquipmentManager in Admin Rooms.
- Equipment shown on Room Directory cards and Room Details.
- Equipment appear in search filters.

**Deliverable:** Rooms carry equipment end-to-end.
**Done when:** You can assign equipment to a room and it appears in search results when filtered by it.

### Phase 6 — Core Booking (The Heart)

**What we build:** Single booking creation with every rule enforced.

**Backend tasks:**
- createBooking with rules: start before end, not in the past, capacity enough, room AVAILABLE, no overlap with CONFIRMED bookings or maintenance.
- **Double-booking prevention:** run create inside a Serializable transaction with a bounded retry so two simultaneous requests cannot both succeed (database-level guarantee).
- Emit notification to participants on creation.

**Frontend tasks:**
- Create Booking page: room selector, date/time picker, title/description, ParticipantPicker.
- Capacity and availability feedback before submit.

**Deliverable:** The rule engine works.
**Done when:** createBooking rejects overlap/past/capacity/maintenance, and the concurrent double-booking test passes.

### Phase 7 — Manage Bookings & Cancellation

**What we build:** Viewing and cancelling bookings.

**Backend tasks:**
- MyBookings (organized by user, most recent first).
- MyMeetings (upcoming CONFIRMED where user is organizer or participant).
- BookingDetails (restricted to organizer, participant or admin).
- cancelBooking (owner or admin, enforcing the cancellation window); waitlist conversion triggered on cancel.

**Frontend tasks:**
- My Bookings page (upcoming + past).
- Booking Details page.
- Cancel confirmation modal.

**Deliverable:** Full booking management.
**Done when:** You can view and cancel your own bookings; cancelling someone else's is rejected.

### Phase 8 — Recurring Meetings

**What we build:** Recurring booking series.

**Backend tasks:**
- Create recurring series (DAILY or WEEKLY) up to an end date.
- Validate no generated occurrence overlaps another, and no occurrence conflicts with existing bookings/maintenance, inside one transaction.
- RecurringBookingGroup query (organizer, participant, or admin).

**Frontend tasks:**
- Recurrence option in Create Booking.
- Recurrence group view in Booking Details.

**Deliverable:** Recurring bookings with atomic validation.
**Done when:** A recurring series saves all occurrences together and conflicts across occurrences are rejected.

### Phase 9 — Check-in & No-show

**What we build:** Check-in window and automatic room release.

**Backend tasks:**
- checkIn: only organizer or listed participant, only within the allowed window, only once.
- CheckIn entity records who checked in and when.
- `no-show-release` cron (every minute): release rooms with no check-in 10 minutes after start.
- `booking-completion` cron: mark finished bookings as completed.

**Frontend tasks:**
- Check-in button shown only inside the window on Booking Details.
- Status updates on My Bookings.

**Deliverable:** Check-in flow + release job.
**Done when:** No check-in within 10 minutes releases the room (verified via the scheduler).

### Phase 10 — Waiting List

**What we build:** Waitlist join/leave and automatic conversion.

**Backend tasks:**
- Join waitlist only when the slot is genuinely unavailable (overlapping confirmed booking) and not maintenance-blocked.
- Reject duplicates; user can remove only their own entry.
- MyWaitlist query (order joined).
- FIFO auto-conversion when a booking cancels or a room is released as no-show.

**Frontend tasks:**
- Join/leave buttons when a slot is taken.
- Waitlist indicator on Room Details and My Bookings.

**Deliverable:** Working waitlist chain.
**Done when:** Cancelling a booking automatically books the first waiting user.

### Phase 11 — Maintenance Management

**What we build:** Maintenance windows for rooms (admin).

**Backend tasks:**
- Create maintenance window (reject overlap with confirmed bookings or other maintenance).
- Delete maintenance record.
- RoomMaintenance query (chronological order).

**Frontend tasks:**
- Maintenance section in Admin Rooms.
- Maintenance shown as unavailable in Room Details/Search.

**Deliverable:** Maintenance blocks availability.
**Done when:** A room under maintenance is excluded from search and cannot be booked.

### Phase 12 — Admin Calendar & Analytics

**What we build:** Office-wide visibility and usage information (admin).

**Backend tasks:**
- AdminCalendar query (all bookings overlapping a date range across every room).
- UsageAnalytics query (total bookings, cancellations, no-shows per room for a date range).

**Frontend tasks:**
- Admin Calendar page.
- Analytics page with basic stats.

**Deliverable:** Admin oversight.
**Done when:** Admin sees office-wide bookings and per-room usage stats.

### Phase 13 — Real-time Notifications

**What we build:** Live notifications via Socket.io.

**Backend tasks:**
- Socket.io server with cookie handshake auth and per-user room joins.
- Emit events on booking creation, participant add/remove, check-in and waitlist conversion.

**Frontend tasks:**
- Socket.io client with credentials.
- NotificationBell + useNotifications hook.
- Refetch queries on relevant events.

**Deliverable:** Live notifications.
**Done when:** Adding a participant triggers their notification in real time.

### Phase 14 — Hardening & Tests

**What we build:** Tests for the critical rules, plus a security/performance pass.

**Backend tasks:**
- Tests: overlapping booking rejected, concurrent double-book blocked, past booking rejected, invalid time range rejected, capacity rejected, maintenance/disabled room rejected, cannot cancel another user's booking, unauthorized GraphQL rejected, no-show release rule, waitlist conversion, recurring conflicts.
- Security: bcrypt cost, JWT expiry, httpOnly/Secure/SameSite cookie, CORS origin, no secret leaks, no internal errors leaked.
- Performance: DataLoaders to remove N+1, confirm indexes, paginate lists.

**Frontend tasks:**
- Confirm every backend error shows a proper message; all screens have correct loading/empty/error/success states.

**Deliverable:** Trustworthy, fast app.
**Done when:** All tests pass and the security/performance checklist is closed.

### Phase 15 — Documentation & Delivery

**What we build:** Runnable from a fresh clone.

**Backend tasks:**
- `.env.example`, migration flow docs (run/revert).
- Production build with tsc.

**Frontend tasks:**
- Production build with Vite.

**Both:**
- README: setup and run instructions, architecture explanation, how double booking is prevented, demo credentials, known limitations and future improvements.
- Screenshots or a short demo video.

**Deliverable:** Final submission.
**Done when:** A fresh clone runs with demo data by following the README.



### Key milestone checkpoints

- **1 end:** createBooking rejects overlapping, past, over-capacity and maintenance-blocked books — the rule engine is proven and the concurrent double-book test passes.
- **2 end:** no-show scheduler releases a room and the waitlist auto-converts on cancellation.
- **3 end:** full demo walks through search → book → check in → cancel → waitlist.

---

## 6. Risks & Mitigations

| Risk                                              | Mitigation                                |
| ------------------------------------------------- | ----------------------------------------- |
| Concurrent double-booking slipping through         | Serializable transaction + bounded retry, database-level constraint, automated test |
| Recurring booking generating conflicting occurrences | Pre-validate all occurrences in one transaction |
| No-show job timing gaps                           | node-cron every minute, idempotent release rules |
| Notifications missing users                       | Emit via Socket.io to per-user room-joined sockets, refetch queries |
| N+1 queries slowing room lists                    | DataLoaders and eager relations           |
| Scope creep before core flow works                | Follow phase order; optional features only after Phase 13 |

---

## 7. Milestones & Timeline

| Milestone              | Phases                     | Deliverable                                  |
| ---------------------- | -------------------------- | -------------------------------------------- |
| M1 Project foundation  | 1–2                        | Empty server + client + data model           |
| M2 Auth + rooms        | 3–4                        | Login/logout and room browsing               |
| M3 Core booking        | 5–6                        | create/search/cancel booking with all rules  |
| M4 Meetings + check-in | 7–10                       | Recurring, check-in, no-show, waitlist       |
| M5 Admin + analytics   | 11–13                      | Admin screens + usage info + real-time       |
| M6 Final wrap          | 14–15                      | README, tests, screenshots, demo             |