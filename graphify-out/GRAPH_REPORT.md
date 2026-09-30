# Graph Report - Book-MeetingRoom (2026-09-30)

## Corpus Check

- 257 files · ~109,996 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 1, .example 1, .css 1)

## Summary

- 1754 nodes · 5359 edges · 72 communities (64 shown, 8 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 77 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)

- Auth Guards & Service Authorization
- DataSource Bootstrap, Migrations & Loaders
- GraphQL Resolver Decorators
- Frontend Pages & Shared Cards
- Button & List Row Primitives
- Form Input Controls
- Entity DTO Field Validation
- List Resolvers & DataLoaders
- Date Range & Analytics Queries
- Check-In Resolver
- Waitlist Page & Rows
- UI Primitive Kit
- Equipment Mutations
- Service Test Suites
- Booking Entity
- Dependency Package Declarations
- Apollo Client & Maintenance Ops
- Auth Screen Components
- Booking Input DTOs
- Root Tooling Config
- Agent Project Rules
- Equipment Entity
- Waitlist Input DTO
- Create Booking Input DTO
- Booking Conflict Mapping
- Health & Participant Resolvers
- Notification Events & Provider
- Notification Payload Types
- Participant Input DTOs
- Socket Context & Jobs Wiring
- Date Pickers & Admin Calendar
- App Shell Layout
- Auth Context & Login
- Backend Package Manifest
- Socket Verification Harness
- Maintenance Type & Resolver
- Cron Jobs & Check-In Rules
- Date Range Input & Analytics Type
- Room Resolver
- Backend Dependencies
- Maintenance & Room Filter Inputs
- Requirement Architecture & FRs
- Logger & Scheduled Jobs
- Plan: Modules & UI Structure
- Waitlist Entity & Repository
- UI Conventions & Verification Harness
- Base TypeScript Config
- Backend Dev Dependencies
- Cookie & JWT Auth Plumbing
- Admin Calendar & Analytics Reqs
- Turbo Pipeline Config
- Backend TypeScript Config
- Frontend TypeScript Config
- Backend NPM Scripts
- Booking & Maintenance Rules
- Phase Plan & Milestones
- Project State & Tooling
- Calendar Day Grid Builder
- Booking Relation Resolvers
- Room Occupancy Resolvers
- Vitest & Plugin Config
- Recurrence Rules & Mirrors
- Health Query
- Migration: Initial Schema
- Migration: Waitlist Unique Constraint
- Migration: Overlap Exclusion Constraint
- Migration: Drop booking hasCheckedIn
- Build TypeScript Config
- Opencode Plugin Config
- Git Workflow Rule

## God Nodes (most connected - your core abstractions)

1. `Booking` - 82 edges
2. `AppContext` - 71 edges
3. `AuthUser` - 66 edges
4. `Room` - 60 edges
5. `Button()` - 56 edges
6. `react` - 52 edges
7. `type-graphql` - 49 edges
8. `@apollo/client` - 48 edges
9. `LoadingState()` - 44 edges
10. `Employee` - 42 edges

## Surprising Connections (you probably didn't know these)

- `Setup and Run Instructions` --semantically_similar_to--> `How to Run (§4)` [INFERRED] [semantically similar]
  README.md → doc/project-state.md
- `Phase 25 — Documentation & Delivery` --references--> `README — Meeting Room Intelligence` [EXTRACTED]
  doc/plan.md → README.md
- `Socket.IO Verification Script (npm run socket:verify)` --references--> `Five Socket.IO Notification Events` [INFERRED]
  README.md → doc/plan.md
- `Phase Status Summary` --shares_data_with--> `Phase Plan 1–25` [INFERRED]
  README.md → doc/plan.md
- `README — Meeting Room Intelligence` --cites--> `Implementation Plan` [EXTRACTED]
  README.md → doc/plan.md

## Import Cycles

- None detected.

## Hyperedges (group relationships)

- **The Layered Architecture Contract, Stated in Four Documents** — doc_plan_layered_dependency_direction, doc_plan_layer_responsibilities, doc_requirement_clean_architecture, doc_project_state_architecture_conventions, readme_architecture_summary [EXTRACTED 1.00]
- **Real-Time Notification Flow: backend transport to frontend owner** — doc_requirement_realtime_notification, doc_plan_socketio_events, doc_project_state_realtime_layer, doc_project_state_notification_provider, readme_socket_verify, doc_project_state_socket_delivery_ambiguous [EXTRACTED 1.00]
- **The Booking Conflict Rule Set (one availability answer, many writers)** — doc_requirement_booking_creation_rules, doc_requirement_double_booking_prevention, doc_requirement_maintenance, doc_requirement_cancellation, doc_requirement_participant_management, doc_requirement_waiting_list, doc_requirement_checkin, doc_plan_serializable_double_booking, doc_project_state_exclusion_constraint, doc_project_state_cancellation_window_30min, doc_project_state_checkin_window_10min [EXTRACTED 1.00]
- **Concurrency Safety: Exclusion Constraint, Serializable Transactions, Overlap and Maintenance Rules** — agents_overlap_prevention, agents_serializable_transaction_protection, agents_maintenance_create_refusal, agents_waitlist_validity [EXTRACTED 1.00]
- **Backend DB Test Lifecycle: Colocation, Destructive Suites, Fixtures, Migrations Glob** — agents_test_colocation, agents_destructive_db_tests, agents_test_fixtures, agents_migrations_glob_trap, agents_late_repository_binding [INFERRED 0.85]
- **Service-Layer Ownership: Layering, Service-Side Authorization, Per-Request Context, Late Repository Binding** — agents_backend_layering, agents_authorization_in_service, agents_appcontext_loaders, agents_late_repository_binding [EXTRACTED 1.00]

## Communities (72 total, 8 thin omitted)

### Community 0 - "Auth Guards & Service Authorization"

Cohesion: 0.08
Nodes (22): authChecker(), AuthUser, ApplicationError, ConflictError, ForbiddenError, InvalidGraphQLRequestError, NotFoundError, ValidationError (+14 more)

### Community 1 - "DataSource Bootstrap, Migrations & Loaders"

Cohesion: 0.08
Nodes (35): createLoaders(), groupBy(), logger, AppDataSource, RoomUsageRow, NewEmployee, BookingStatus, CANCELLED (+27 more)

### Community 2 - "GraphQL Resolver Decorators"

Cohesion: 0.07
Nodes (44): AppContext, AdminLoginInput, Field, InputType, IsEmail, IsNotEmpty, EmployeeType, toEmployeeType() (+36 more)

### Community 3 - "Frontend Pages & Shared Cards"

Cohesion: 0.09
Nodes (40): AppCard(), AppCardProps, EmptyStateProps, EquipmentChips(), EquipmentChipsProps, ErrorStateProps, PanelCardProps, StatCard() (+32 more)

### Community 4 - "Button & List Row Primitives"

Cohesion: 0.07
Nodes (48): ButtonProps, Size, sizeClasses, Variant, variantClasses, DetailRow(), DetailRowProps, ModalProps (+40 more)

### Community 5 - "Form Input Controls"

Cohesion: 0.08
Nodes (51): DateTimePicker(), DateTimePickerProps, Input(), InputProps, Option, Select(), SelectProps, CreateBookingVars (+43 more)

### Community 6 - "Entity DTO Field Validation"

Cohesion: 0.08
Nodes (37): CreateEquipmentInput, Field, InputType, IsNotEmpty, MaxLength, EquipmentType, toEquipmentType(), Field (+29 more)

### Community 7 - "List Resolvers & DataLoaders"

Cohesion: 0.07
Nodes (23): Loaders, UnauthenticatedError, Employee, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn (+15 more)

### Community 8 - "Date Range & Analytics Queries"

Cohesion: 0.07
Nodes (21): assertValidDateRange(), DateRange, AnalyticsRepository, RoomUsage, AnalyticsDateRange, AnalyticsService, Maintenance, Column (+13 more)

### Community 9 - "Check-In Resolver"

Cohesion: 0.10
Nodes (30): BookingType, toBookingType(), Field, ObjectType, BookingResolver, Arg, Authorized, Ctx (+22 more)

### Community 10 - "Waitlist Page & Rows"

Cohesion: 0.12
Nodes (33): BookingRow(), BookingRowProps, ListRowProps, LoadingStateProps, JOIN_WAITLIST_MUTATION, JoinWaitlistData, JoinWaitlistVars, LEAVE_WAITLIST_MUTATION (+25 more)

### Community 11 - "UI Primitive Kit"

Cohesion: 0.20
Nodes (40): Button(), EmptyState(), ErrorState(), ListRow(), LoadingState(), Modal(), PageHeader(), PanelCard() (+32 more)

### Community 12 - "Equipment Mutations"

Cohesion: 0.09
Nodes (37): ASSIGN_EQUIPMENT_MUTATION, AssignEquipmentData, AssignEquipmentVars, CREATE_EQUIPMENT_MUTATION, CreateEquipmentData, CreateEquipmentVars, REMOVE_EQUIPMENT_MUTATION, RemoveEquipmentData (+29 more)

### Community 13 - "Service Test Suites"

Cohesion: 0.16
Nodes (31): logger, queries, UserRole, ADMIN, EMPLOYEE, RoomStatus, AVAILABLE, DISABLED (+23 more)

### Community 14 - "Booking Entity"

Cohesion: 0.09
Nodes (13): Booking, Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn (+5 more)

### Community 15 - "Dependency Package Declarations"

Cohesion: 0.05
Nodes (37): dependencies, @apollo/client, graphql, react, react-dom, react-icons, react-router-dom, socket.io-client (+29 more)

### Community 16 - "Apollo Client & Maintenance Ops"

Cohesion: 0.11
Nodes (28): App(), AuthProvider(), apolloClient, httpLink, CREATE_MAINTENANCE_MUTATION, CreateMaintenanceData, CreateMaintenanceVars, DELETE_MAINTENANCE_MUTATION (+20 more)

### Community 17 - "Auth Screen Components"

Cohesion: 0.10
Nodes (28): AuthBrandPanel(), AuthField(), AuthFieldProps, EyeIcon(), EyeOffIcon(), AuthMode, AuthTabs(), AuthTabsProps (+20 more)

### Community 18 - "Booking Input DTOs"

Cohesion: 0.09
Nodes (21): CreateRoomInput, Field, InputType, IsInt, IsNotEmpty, MaxLength, Min, SetRoomStatusInput (+13 more)

### Community 19 - "Root Tooling Config"

Cohesion: 0.08
Nodes (27): devDependencies, eslint, @eslint/js, eslint-plugin-react-hooks, globals, turbo, typescript-eslint, name (+19 more)

### Community 20 - "Agent Project Rules"

Cohesion: 0.09
Nodes (27): AGENTS.md (AI agent project instructions), AppContext and Per-Request DataLoaders, Authorization Belongs in the Service, Backend Layering (Resolver → Service → Repository → Entity), Booking.recurrenceId Typed as string, 30-Minute Cancellation / Participant Window, Destructive DB Test Suites (RUN_DB_TESTS=1), Frontend Folder Structure and Design Tokens (+19 more)

### Community 21 - "Equipment Entity"

Cohesion: 0.11
Nodes (17): Equipment, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, RoomEquipment, Column, CreateDateColumn (+9 more)

### Community 22 - "Waitlist Input DTO"

Cohesion: 0.10
Nodes (22): JoinWaitlistInput, Field, InputType, IsInt, Min, toWaitlistEntryType(), Field, ObjectType (+14 more)

### Community 23 - "Create Booking Input DTO"

Cohesion: 0.09
Nodes (26): CreateBookingInput, Field, InputType, IsArray, IsInt, IsNotEmpty, IsOptional, IsString (+18 more)

### Community 24 - "Booking Conflict Mapping"

Cohesion: 0.15
Nodes (12): NewBookingData, isBookingOverlapViolation(), formatConflictTime(), formatConflictWindow(), UTC_TIME_FORMAT, Room, Column, CreateDateColumn (+4 more)

### Community 25 - "Health & Participant Resolvers"

Cohesion: 0.10
Nodes (20): HealthResolver, Resolver, MaintenanceRoomFieldResolver, Resolver, ParticipantType, toParticipantType(), Field, ObjectType (+12 more)

### Community 26 - "Notification Events & Provider"

Cohesion: 0.16
Nodes (22): MY_BOOKINGS_QUERY, NOTIFICATION_EVENTS, NotificationEventName, NotificationEventPayload, NotificationType, clearStorage(), composeMessage(), loadFromStorage() (+14 more)

### Community 27 - "Notification Payload Types"

Cohesion: 0.17
Nodes (14): BookingCheckedInNotification, BookingCreatedNotification, BookingNotification, NotificationPayload, ParticipantAddedNotification, ParticipantRemovedNotification, WaitlistConvertedNotification, NotificationService (+6 more)

### Community 28 - "Participant Input DTOs"

Cohesion: 0.12
Nodes (18): AddParticipantsInput, ArrayMinSize, Field, InputType, IsArray, IsInt, Min, RemoveParticipantInput (+10 more)

### Community 29 - "Socket Context & Jobs Wiring"

Cohesion: 0.14
Nodes (20): buildContext(), startJobs(), stopJobs(), NOTIFICATION_EVENTS, notificationEventName, NotificationEventPayload, NotificationType, toNotificationEventPayload() (+12 more)

### Community 30 - "Date Pickers & Admin Calendar"

Cohesion: 0.16
Nodes (20): DatePicker(), DatePickerProps, rangeError(), RangePicker(), RangePickerProps, AdminCalendarPage(), CalendarEntryRow(), daySummary() (+12 more)

### Community 31 - "App Shell Layout"

Cohesion: 0.23
Nodes (14): AppLayout(), Navbar(), NotificationBell(), Sidebar(), TopNav(), useAuth(), useNotifications(), copy (+6 more)

### Community 32 - "Auth Context & Login"

Cohesion: 0.17
Nodes (19): AuthContext, AuthContextValue, AuthProviderProps, SignUpInput, ADMIN_LOG_IN_MUTATION, AdminLogInData, CredentialsVars, LOG_IN_MUTATION (+11 more)

### Community 33 - "Backend Package Manifest"

Cohesion: 0.10
Nodes (20): graphql, socket.io-client, typescript, name, private, version, bcryptjs, cookie-parser (+12 more)

### Community 34 - "Socket Verification Harness"

Cohesion: 0.18
Nodes (19): check(), connect(), EMPLOYEES, expectInboxSize(), expectRejection(), GqlResponse, graphql(), iso() (+11 more)

### Community 35 - "Maintenance Type & Resolver"

Cohesion: 0.22
Nodes (11): MaintenanceType, toMaintenanceType(), Field, ObjectType, MaintenanceResolver, Arg, Authorized, Ctx (+3 more)

### Community 36 - "Cron Jobs & Check-In Rules"

Cohesion: 0.12
Nodes (20): booking-completion Cron Job, No Queue Size or Position Rendered Anywhere, no-show-release Cron Job (every minute), Check-In Window [startTime, startTime + 10min) (§9), check_ins Table Is the Single Source of Truth for Check-In (§9), A List With No Time Filter Hands the Now-Line to the Client (§8.41), A Conversion Books the Released Slot, Not the Queued Window (§8.43), Cron Jobs Are Live From Phase 9 (§8.14) (+12 more)

### Community 37 - "Date Range Input & Analytics Type"

Cohesion: 0.18
Nodes (13): DateRangeInput, Field, InputType, toUsageAnalyticsType(), Field, ObjectType, UsageAnalyticsType, AnalyticsResolver (+5 more)

### Community 38 - "Room Resolver"

Cohesion: 0.24
Nodes (12): Authorized, Ctx, FieldResolver, Root, toRoomType(), RoomResolver, Arg, Authorized (+4 more)

### Community 39 - "Backend Dependencies"

Cohesion: 0.12
Nodes (17): dependencies, @apollo/server, bcryptjs, class-validator, cookie-parser, cors, dataloader, dotenv (+9 more)

### Community 40 - "Maintenance & Room Filter Inputs"

Cohesion: 0.11
Nodes (17): CreateMaintenanceInput, Field, InputType, IsInt, IsOptional, IsString, MaxLength, Min (+9 more)

### Community 41 - "Requirement Architecture & FRs"

Cohesion: 0.16
Nodes (17): Architecture Conventions (§7), Pending Decisions / Next Steps (§9), Modules & Data Model (§6), Never Let Two Services new Each Other (§8.17), Admin Role Responsibilities, Authentication System (FR-1…FR-5), Clean Architecture Pattern with strict layer separation, Core Features List (+9 more)

### Community 42 - "Logger & Scheduled Jobs"

Cohesion: 0.18
Nodes (11): Level, log(), toTimestamp(), bookingCompletionJob, bookingService, checkInService, noShowReleaseJob, Job (+3 more)

### Community 43 - "Plan: Modules & UI Structure"

Cohesion: 0.17
Nodes (16): Backend Module Inventory (10 modules), Frontend Folder Structure, Layer Responsibilities: dto / resolvers / services / repositories / entities, Layered Dependency Direction Diagram, Module-First Architecture, App Shell & Dashboard Theme (§7.2), User Design Screenshots as the App-Wide Visual Contract, Design Tokens: navy, shell, heading, tintStrong, roleInk (+8 more)

### Community 44 - "Waitlist Entity & Repository"

Cohesion: 0.17
Nodes (9): Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, WaitlistEntry (+1 more)

### Community 45 - "UI Conventions & Verification Harness"

Cohesion: 0.21
Nodes (15): BookingRow Primitive, react-icons/lu as the Icon Source, ListRow Primitive, No Client-Side Time Gates on Action Controls, rangeValid Guard on Every Refetch Trigger, Live Verification Harnesses: API scripts + headless Chrome, Implementation Plan, Dev DB Baseline Discipline After Verification Runs (+7 more)

### Community 46 - "Base TypeScript Config"

Cohesion: 0.13
Nodes (14): compilerOptions, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, forceConsistentCasingInFileNames, lib, module (+6 more)

### Community 47 - "Backend Dev Dependencies"

Cohesion: 0.14
Nodes (14): devDependencies, socket.io-client, ts-node, @types/bcryptjs, @types/cookie-parser, @types/cors, @types/express, @types/jsonwebtoken (+6 more)

### Community 48 - "Cookie & JWT Auth Plumbing"

Cohesion: 0.16
Nodes (11): userFromCookieHeader(), userFromCookies(), CookieMap, parseCookieHeader(), readCookie(), env, JwtPayload, UNIT_MS (+3 more)

### Community 49 - "Admin Calendar & Analytics Reqs"

Cohesion: 0.15
Nodes (14): employees Query Added for ParticipantPicker, officeMaintenance Query (admin-only range read), RangePicker Shared Date-Range Control, @ArrayMinSize(1) Rejects as BAD_USER_INPUT, Not the Service (§8.35), null GraphQL Argument Is Not an Omitted One (§8.25), common/date-range.ts assertValidDateRange Shared by Analytics and Maintenance, One Clock Read for Paired Default Values (§8.28), Aggregate Without ORDER BY Hands the UI an Arbitrary Row Order (§8.46) (+6 more)

### Community 50 - "Turbo Pipeline Config"

Cohesion: 0.14
Nodes (13): dependsOn, outputs, cache, persistent, $schema, tasks, build, dev (+5 more)

### Community 51 - "Backend TypeScript Config"

Cohesion: 0.15
Nodes (12): compilerOptions, baseUrl, module, moduleResolution, outDir, paths, removeComments, rootDir (+4 more)

### Community 52 - "Frontend TypeScript Config"

Cohesion: 0.15
Nodes (12): compilerOptions, allowImportingTsExtensions, jsx, lib, module, moduleResolution, noEmit, target (+4 more)

### Community 53 - "Backend NPM Scripts"

Cohesion: 0.18
Nodes (11): scripts, build, dev, migrate, migrate:revert, seed, socket:verify, start (+3 more)

### Community 54 - "Booking & Maintenance Rules"

Cohesion: 0.22
Nodes (11): Always-Closed Maintenance Window Blocks Booking, formatConflictTime / formatConflictWindow Human UTC Errors, Five Socket.IO Notification Events, 30-Minute Cancellation and Participant Window (§9), NotificationProvider Owns the Socket Lifecycle, realtime/ as Shared Transport Layer, Room-Based Socket Delivery Makes "No Event" Ambiguous (§8.20), Booking Creation Rules (FR-18…FR-23) (+3 more)

### Community 55 - "Phase Plan & Milestones"

Cohesion: 0.24
Nodes (11): Backend Track (Phases 4–13), DataLoader Batching to Remove N+1, Phase 25 — Documentation & Delivery, Frontend Track (Phases 14–23), Phase 24 — Hardening & Tests, Milestones & Timeline (M1–M5), Phase Plan 1–25, Risks and Mitigations (+3 more)

### Community 56 - "Project State & Tooling"

Cohesion: 0.27
Nodes (11): Custom migrate/revert Scripts Instead of TypeORM CLI (§8.2), Key Gotchas / Team Memory (§8), How to Run (§4), backend/scripts Outside the tsc Program (§8.19), Tech Stack & Tooling (§3), ts-node Backend Runtime, Not tsx (§8.1), Project State — Persistent AI Handoff Document, Phase Status Summary (+3 more)

### Community 57 - "Calendar Day Grid Builder"

Cohesion: 0.38
Nodes (10): buildCalendarDays(), CalendarDay, CalendarEntry, dayKey(), eachDay(), MaintenanceSegment, segmentOnDay(), addDays() (+2 more)

### Community 58 - "Booking Relation Resolvers"

Cohesion: 0.39
Nodes (6): BookingRelationsFieldResolver, Authorized, Ctx, FieldResolver, Resolver, Root

### Community 59 - "Room Occupancy Resolvers"

Cohesion: 0.39
Nodes (6): RoomOccupancyFieldResolver, Authorized, Ctx, FieldResolver, Resolver, Root

### Community 60 - "Vitest & Plugin Config"

Cohesion: 0.29
Nodes (4): IMPORTANT: keep the reminder string free of backticks and $(...) constructs., ref_fs, ref_path, unplugin-swc

### Community 61 - "Recurrence Rules & Mirrors"

Cohesion: 0.33
Nodes (7): Client Mirror of the Recurrence Generator, Occurrence Cap of 90 per Series, GraphQL Date Inputs Need Full ISO-8601 With Seconds (§8.12), One Generator, Mirrored Step for Step (§8.34), Never Read a timestamptz as a Bare Wall Clock (§8.38), new Date('YYYY-MM-DD') Is UTC Midnight (§8.45), Recurring Meetings (FR-22)

### Community 62 - "Health Query"

Cohesion: 0.33
Nodes (4): Health, Field, ObjectType, Query

### Community 67 - "Build TypeScript Config"

Cohesion: 0.50
Nodes (3): exclude, extends, ./tsconfig.json

## Knowledge Gaps

- **302 isolated node(s):** `$schema`, `plugin`, `name`, `version`, `private` (+297 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 578 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions

_Questions this graph is uniquely positioned to answer:_

- **Why does `@apollo/client` connect `Apollo Client & Maintenance Ops` to `Auth Context & Login`, `Frontend Pages & Shared Cards`, `Button & List Row Primitives`, `Form Input Controls`, `Waitlist Page & Rows`, `UI Primitive Kit`, `Equipment Mutations`, `Dependency Package Declarations`, `Notification Events & Provider`, `Date Pickers & Admin Calendar`?**
  _High betweenness centrality (0.114) - this node is a cross-community bridge._
- **Why does `react` connect `Waitlist Page & Rows` to `Auth Context & Login`, `Frontend Pages & Shared Cards`, `Button & List Row Primitives`, `Form Input Controls`, `UI Primitive Kit`, `Equipment Mutations`, `Dependency Package Declarations`, `Apollo Client & Maintenance Ops`, `Auth Screen Components`, `Notification Events & Provider`, `Date Pickers & Admin Calendar`, `App Shell Layout`?**
  _High betweenness centrality (0.112) - this node is a cross-community bridge._
- **Why does `AppContext` connect `GraphQL Resolver Decorators` to `Auth Guards & Service Authorization`, `Maintenance Type & Resolver`, `Date Range Input & Analytics Type`, `Entity DTO Field Validation`, `List Resolvers & DataLoaders`, `Room Resolver`, `Check-In Resolver`, `Booking Input DTOs`, `Waitlist Input DTO`, `Health & Participant Resolvers`, `Booking Relation Resolvers`, `Room Occupancy Resolvers`, `Participant Input DTOs`, `Socket Context & Jobs Wiring`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **What connects `$schema`, `plugin`, `name` to the rest of the system?**
  _302 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Auth Guards & Service Authorization` be split into smaller, more focused modules?**
  _Cohesion score 0.0762739370334307 - nodes in this community are weakly interconnected._
- **Should `DataSource Bootstrap, Migrations & Loaders` be split into smaller, more focused modules?**
  _Cohesion score 0.0841046277665996 - nodes in this community are weakly interconnected._
- **Should `GraphQL Resolver Decorators` be split into smaller, more focused modules?**
  _Cohesion score 0.06634615384615385 - nodes in this community are weakly interconnected._
