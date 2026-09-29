# Graph Report - Book-MeetingRoom  (2026-09-29)

## Corpus Check
- 255 files · ~109,626 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 1, .example 1, .css 1)

## Summary
- 1729 nodes · 5347 edges · 80 communities (72 shown, 8 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 80 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Booking UI Forms & Mutations
- Auth, Check-In & Field Resolvers
- Dashboard, Analytics & List Primitives
- Shared UI Primitives & Admin Queries
- Backend Repositories & DataSource Bootstrap
- Booking, Equipment & Health Resolvers
- API Verification Harness & Realtime Events
- Date Pickers & Calendar Builders
- AppContext & Auth Input DTOs
- Equipment Service & Room Status
- App Shell Layout & Form Primitives
- Waitlist Types & Field Resolvers
- Room & Waitlist Mutations, RoomForm
- Backend Test Suites & Fixtures
- Maintenance Mutations & Admin Calendar Page
- Booking Resolver Surface & Participant Input
- Booking Entity & Repository
- Equipment Resolver & Room Inputs
- Equipment Mutations & Button Primitive
- Login Page & Auth Form Language
- Analytics & Maintenance Services
- Notification Payloads & Service
- Create Booking Page & Recurrence Utils
- Root Monorepo Manifest & Scripts
- Waitlist Entity, Repository & Conversion
- Error Codes, Auth Checker & Auth Service
- Booking Input DTO & Recurrence Generator
- Maintenance Resolver & Types
- Backend Package Manifest & Vitest Config
- Booking Service Business Rules
- Participant Entity, Repository & Service
- Feature Requirement Groups (FR-ids)
- Frontend Primitives, Decisions & Time Traps
- Auth Context & Auth Mutations
- Repo Docs: Workflow, Gates, Gotchas
- Repo Docs: Architecture & Design System
- Analytics Resolver & Date Range Input
- Cron Jobs, Check-In & Waitlist Rules
- HTTP Server Bootstrap & Socket.IO
- Backend Runtime Dependencies
- Serializable Retry & Conflict Messages
- Frontend Package Manifest & Vite Config
- Requirement Doc: Architecture & Data Model
- Maintenance Entity & Repository
- Shared TypeScript Compiler Options
- Backend Dev Dependencies
- Room Entity & Repository
- Turbo Task Pipeline Config
- Backend tsconfig
- Frontend tsconfig
- Cron Job Registry & Lifecycle
- Employee Entity & Repository
- CheckIn Entity & Repository
- Backend npm Scripts
- Booking Change Window Policy
- Equipment Repository
- Phase Plan & DataLoader Batching
- Room Filter Input DTO
- Frontend Dev Dependencies
- React App Entry & Apollo Client
- Booking Overlap & Cancellation Invariants
- Cookie Header Parsing & JWT Verify
- Booking Relations Field Resolver
- Room Occupancy Field Resolver
- Create Maintenance Input DTO
- Update Room Input DTO
- Frontend Runtime Dependencies
- Env Config & Logger
- Check-In Resolver
- Update Equipment Input DTO
- Health Query
- Frontend npm Scripts
- Migration: Initial Schema
- Migration: Waitlist Unique Constraint
- Migration: Booking Overlap Exclusion
- Migration: Drop Booking HasCheckedIn
- Backend Build tsconfig
- Employees Query

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
- `Setup and Run Instructions` --semantically_similar_to--> `How to Run (§4)`  [INFERRED] [semantically similar]
  README.md → doc/project-state.md
- `Layer Ownership: Resolver → Service → Repository → Entity` --references--> `Layered Dependency Direction Diagram`  [INFERRED]
  AGENTS.md → doc/plan.md
- `Destructive DB Test Suites behind RUN_DB_TESTS=1` --conceptually_related_to--> `no-show-release Every Minute Breaks Time-Window Tests (§8.37)`  [INFERRED]
  AGENTS.md → doc/project-state.md
- `Booking Invariants That Break Silently` --references--> `Check-In Window [startTime, startTime + 10min) (§9)`  [INFERRED]
  AGENTS.md → doc/project-state.md
- `Phase 25 — Documentation & Delivery` --references--> `README — Meeting Room Intelligence`  [EXTRACTED]
  doc/plan.md → README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **The Booking Conflict Rule Set (one availability answer, many writers)** — doc_requirement_booking_creation_rules, doc_requirement_double_booking_prevention, doc_requirement_maintenance, doc_requirement_cancellation, doc_requirement_participant_management, doc_requirement_waiting_list, doc_requirement_checkin, doc_plan_serializable_double_booking, doc_project_state_exclusion_constraint, doc_project_state_cancellation_window_30min, doc_project_state_checkin_window_10min [EXTRACTED 1.00]
- **The Layered Architecture Contract, Stated in Four Documents** — agents_layer_ownership, doc_plan_layered_dependency_direction, doc_plan_layer_responsibilities, doc_requirement_clean_architecture, doc_project_state_architecture_conventions, readme_architecture_summary [EXTRACTED 1.00]
- **Real-Time Notification Flow: backend transport to frontend owner** — doc_requirement_realtime_notification, doc_plan_socketio_events, doc_project_state_realtime_layer, doc_project_state_notification_provider, readme_socket_verify, doc_project_state_socket_delivery_ambiguous [EXTRACTED 1.00]

## Communities (80 total, 8 thin omitted)

### Community 0 - "Booking UI Forms & Mutations"
Cohesion: 0.09
Nodes (55): Button(), DetailRow(), DetailRowProps, Modal(), Input(), ADD_PARTICIPANTS_MUTATION, AddParticipantsData, AddParticipantsVars (+47 more)

### Community 1 - "Auth, Check-In & Field Resolvers"
Cohesion: 0.06
Nodes (42): EmployeeType, Field, ObjectType, AuthService, BookingType, Field, ObjectType, CheckInType (+34 more)

### Community 2 - "Dashboard, Analytics & List Primitives"
Cohesion: 0.15
Nodes (40): BookingRow(), BookingRowProps, EmptyState(), ErrorState(), ListRow(), ListRowProps, LoadingState(), LoadingStateProps (+32 more)

### Community 3 - "Shared UI Primitives & Admin Queries"
Cohesion: 0.10
Nodes (36): AppCard(), EmptyStateProps, EquipmentChips(), EquipmentChipsProps, ErrorStateProps, PageHeaderProps, StatCard(), StatCardProps (+28 more)

### Community 4 - "Backend Repositories & DataSource Bootstrap"
Cohesion: 0.11
Nodes (27): createLoaders(), groupBy(), AppDataSource, RoomUsageRow, NewEmployee, BookingStatus, CANCELLED, COMPLETED (+19 more)

### Community 5 - "Booking, Equipment & Health Resolvers"
Cohesion: 0.10
Nodes (23): HealthResolver, Resolver, CreateEquipmentInput, Field, InputType, IsNotEmpty, MaxLength, EquipmentType (+15 more)

### Community 6 - "API Verification Harness & Realtime Events"
Cohesion: 0.09
Nodes (40): check(), connect(), EMPLOYEES, expectInboxSize(), expectRejection(), GqlResponse, graphql(), iso() (+32 more)

### Community 7 - "Date Pickers & Calendar Builders"
Cohesion: 0.09
Nodes (39): DatePicker(), DatePickerProps, rangeError(), RangePicker(), RangePickerProps, buildCalendarDays(), CalendarDay, CalendarEntry (+31 more)

### Community 8 - "AppContext & Auth Input DTOs"
Cohesion: 0.09
Nodes (30): AppContext, AdminLoginInput, Field, InputType, IsEmail, IsNotEmpty, toEmployeeType(), LogInInput (+22 more)

### Community 9 - "Equipment Service & Room Status"
Cohesion: 0.11
Nodes (16): AuthUser, NotFoundError, EquipmentUpdateData, EquipmentCreateData, EquipmentService, RoomStatus, AVAILABLE, DISABLED (+8 more)

### Community 10 - "App Shell Layout & Form Primitives"
Cohesion: 0.12
Nodes (27): AppCardProps, ModalProps, sizeClasses, PanelCardProps, DateTimePickerProps, InputProps, Option, SelectProps (+19 more)

### Community 11 - "Waitlist Types & Field Resolvers"
Cohesion: 0.08
Nodes (31): RoomType, Field, ObjectType, JoinWaitlistInput, Field, InputType, IsInt, Min (+23 more)

### Community 12 - "Room & Waitlist Mutations, RoomForm"
Cohesion: 0.10
Nodes (33): CREATE_ROOM_MUTATION, CreateRoomData, CreateRoomVars, roomFields, SET_ROOM_STATUS_MUTATION, SetRoomStatusData, UPDATE_ROOM_MUTATION, UpdateRoomData (+25 more)

### Community 13 - "Backend Test Suites & Fixtures"
Cohesion: 0.18
Nodes (28): logger, queries, UserRole, ADMIN, EMPLOYEE, JwtPayload, DB_TESTS_ENABLED, testDataSource (+20 more)

### Community 14 - "Maintenance Mutations & Admin Calendar Page"
Cohesion: 0.12
Nodes (32): CREATE_MAINTENANCE_MUTATION, CreateMaintenanceData, CreateMaintenanceVars, DELETE_MAINTENANCE_MUTATION, DeleteMaintenanceData, DeleteMaintenanceVars, OFFICE_MAINTENANCE_QUERY, OfficeMaintenanceData (+24 more)

### Community 15 - "Booking Resolver Surface & Participant Input"
Cohesion: 0.10
Nodes (26): toBookingType(), BookingResolver, Arg, Authorized, Ctx, Mutation, Query, Resolver (+18 more)

### Community 16 - "Booking Entity & Repository"
Cohesion: 0.09
Nodes (12): Booking, Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn (+4 more)

### Community 17 - "Equipment Resolver & Room Inputs"
Cohesion: 0.11
Nodes (27): toEquipmentType(), RoomEquipmentInput, Field, InputType, IsInt, EquipmentResolver, Arg, Authorized (+19 more)

### Community 18 - "Equipment Mutations & Button Primitive"
Cohesion: 0.10
Nodes (29): ButtonProps, Size, sizeClasses, Variant, variantClasses, DateTimePicker(), Select(), ASSIGN_EQUIPMENT_MUTATION (+21 more)

### Community 19 - "Login Page & Auth Form Language"
Cohesion: 0.10
Nodes (28): AuthBrandPanel(), AuthField(), AuthFieldProps, EyeIcon(), EyeOffIcon(), AuthMode, AuthTabs(), AuthTabsProps (+20 more)

### Community 20 - "Analytics & Maintenance Services"
Cohesion: 0.11
Nodes (12): assertValidDateRange(), DateRange, AnalyticsRepository, RoomUsage, AnalyticsDateRange, AnalyticsService, NewMaintenanceData, CreateMaintenanceData (+4 more)

### Community 21 - "Notification Payloads & Service"
Cohesion: 0.15
Nodes (19): BookingCheckedInNotification, BookingCreatedNotification, BookingNotification, NotificationPayload, ParticipantAddedNotification, ParticipantRemovedNotification, WaitlistConvertedNotification, NotificationService (+11 more)

### Community 22 - "Create Booking Page & Recurrence Utils"
Cohesion: 0.13
Nodes (26): CreateBookingVars, CreateBookingPage(), parseLocal(), readSlotParams(), JoinWaitlistControl(), fullName(), ParticipantPicker(), ParticipantPickerProps (+18 more)

### Community 23 - "Root Monorepo Manifest & Scripts"
Cohesion: 0.08
Nodes (27): devDependencies, eslint, @eslint/js, eslint-plugin-react-hooks, globals, turbo, typescript-eslint, name (+19 more)

### Community 24 - "Waitlist Entity, Repository & Conversion"
Cohesion: 0.10
Nodes (15): logger, CreateBookingData, Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne (+7 more)

### Community 25 - "Error Codes, Auth Checker & Auth Service"
Cohesion: 0.14
Nodes (12): authChecker(), ApplicationError, InvalidGraphQLRequestError, UnauthenticatedError, ErrorCode, ErrorCodes, isApplicationError(), SignUpData (+4 more)

### Community 26 - "Booking Input DTO & Recurrence Generator"
Cohesion: 0.09
Nodes (26): CreateBookingInput, Field, InputType, IsArray, IsInt, IsNotEmpty, IsOptional, IsString (+18 more)

### Community 27 - "Maintenance Resolver & Types"
Cohesion: 0.14
Nodes (17): MaintenanceType, toMaintenanceType(), Field, ObjectType, MaintenanceResolver, Arg, Authorized, Ctx (+9 more)

### Community 28 - "Backend Package Manifest & Vitest Config"
Cohesion: 0.08
Nodes (22): graphql, socket.io-client, typescript, name, private, version, cookie-parser, dataloader (+14 more)

### Community 29 - "Booking Service Business Rules"
Cohesion: 0.21
Nodes (3): ForbiddenError, ValidationError, BookingService

### Community 30 - "Participant Entity, Repository & Service"
Cohesion: 0.12
Nodes (11): Loaders, Participant, Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne (+3 more)

### Community 31 - "Feature Requirement Groups (FR-ids)"
Cohesion: 0.11
Nodes (23): Always-Closed Maintenance Window Blocks Booking, formatConflictTime / formatConflictWindow Human UTC Errors, employees Query Added for ParticipantPicker, officeMaintenance Query (admin-only range read), RangePicker Shared Date-Range Control, Five Socket.IO Notification Events, @ArrayMinSize(1) Rejects as BAD_USER_INPUT, Not the Service (§8.35), NotificationProvider Owns the Socket Lifecycle (+15 more)

### Community 32 - "Frontend Primitives, Decisions & Time Traps"
Cohesion: 0.15
Nodes (20): BookingRow Primitive, Client Mirror of the Recurrence Generator, react-icons/lu as the Icon Source, ListRow Primitive, No Client-Side Time Gates on Action Controls, Occurrence Cap of 90 per Series, rangeValid Guard on Every Refetch Trigger, Live Verification Harnesses: API scripts + headless Chrome (+12 more)

### Community 33 - "Auth Context & Auth Mutations"
Cohesion: 0.20
Nodes (17): AuthContext, AuthContextValue, AuthProviderProps, SignUpInput, ADMIN_LOG_IN_MUTATION, AdminLogInData, CredentialsVars, LOG_IN_MUTATION (+9 more)

### Community 34 - "Repo Docs: Workflow, Gates, Gotchas"
Cohesion: 0.16
Nodes (19): Destructive DB Test Suites behind RUN_DB_TESTS=1, Repository Gates: typecheck, lint, build, test, test:db, Traps Already Paid For, Workflow Rules: user commits, no uninvited deps or docs, AGENTS.md — AI Agent Rules for This Repository, Custom migrate/revert Scripts Instead of TypeORM CLI (§8.2), Dev DB Baseline Discipline After Verification Runs, Key Gotchas / Team Memory (§8) (+11 more)

### Community 35 - "Repo Docs: Architecture & Design System"
Cohesion: 0.14
Nodes (19): Frontend Folder Conventions (pages, components, theme tokens), Backend Module Inventory (10 modules), Frontend Folder Structure, Layer Responsibilities: dto / resolvers / services / repositories / entities, Layered Dependency Direction Diagram, Module-First Architecture, App Shell & Dashboard Theme (§7.2), User Design Screenshots as the App-Wide Visual Contract (+11 more)

### Community 36 - "Analytics Resolver & Date Range Input"
Cohesion: 0.18
Nodes (13): DateRangeInput, Field, InputType, toUsageAnalyticsType(), Field, ObjectType, UsageAnalyticsType, AnalyticsResolver (+5 more)

### Community 37 - "Cron Jobs, Check-In & Waitlist Rules"
Cohesion: 0.13
Nodes (19): booking-completion Cron Job, No Queue Size or Position Rendered Anywhere, no-show-release Cron Job (every minute), Risks and Mitigations, Check-In Window [startTime, startTime + 10min) (§9), check_ins Table Is the Single Source of Truth for Check-In (§9), A List With No Time Filter Hands the Now-Line to the Client (§8.41), A Conversion Books the Released Slot, Not the Queued Window (§8.43) (+11 more)

### Community 38 - "HTTP Server Bootstrap & Socket.IO"
Cohesion: 0.19
Nodes (16): buildContext(), startJobs(), stopJobs(), AuthenticatedSocket, closeSocketServer(), emitToUser(), initSocketServer(), userRoom() (+8 more)

### Community 39 - "Backend Runtime Dependencies"
Cohesion: 0.12
Nodes (17): dependencies, @apollo/server, bcryptjs, class-validator, cookie-parser, cors, dataloader, dotenv (+9 more)

### Community 40 - "Serializable Retry & Conflict Messages"
Cohesion: 0.25
Nodes (6): ConflictError, NewBookingData, isBookingOverlapViolation(), formatConflictTime(), formatConflictWindow(), UTC_TIME_FORMAT

### Community 41 - "Frontend Package Manifest & Vite Config"
Cohesion: 0.12
Nodes (14): graphql, socket.io-client, typescript, name, private, type, version, autoprefixer (+6 more)

### Community 42 - "Requirement Doc: Architecture & Data Model"
Cohesion: 0.18
Nodes (16): Layer Ownership: Resolver → Service → Repository → Entity, Architecture Conventions (§7), Pending Decisions / Next Steps (§9), Admin Role Responsibilities, Authentication System (FR-1…FR-5), Clean Architecture Pattern with strict layer separation, Core Features List, Data Model (10 entities) (+8 more)

### Community 43 - "Maintenance Entity & Repository"
Cohesion: 0.16
Nodes (9): Maintenance, Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn (+1 more)

### Community 44 - "Shared TypeScript Compiler Options"
Cohesion: 0.13
Nodes (14): compilerOptions, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, forceConsistentCasingInFileNames, lib, module (+6 more)

### Community 45 - "Backend Dev Dependencies"
Cohesion: 0.14
Nodes (14): devDependencies, socket.io-client, ts-node, @types/bcryptjs, @types/cookie-parser, @types/cors, @types/express, @types/jsonwebtoken (+6 more)

### Community 46 - "Room Entity & Repository"
Cohesion: 0.23
Nodes (7): Room, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn, RoomRepository

### Community 47 - "Turbo Task Pipeline Config"
Cohesion: 0.14
Nodes (13): dependsOn, outputs, cache, persistent, $schema, tasks, build, dev (+5 more)

### Community 48 - "Backend tsconfig"
Cohesion: 0.15
Nodes (12): compilerOptions, baseUrl, module, moduleResolution, outDir, paths, removeComments, rootDir (+4 more)

### Community 49 - "Frontend tsconfig"
Cohesion: 0.15
Nodes (12): compilerOptions, allowImportingTsExtensions, jsx, lib, module, moduleResolution, noEmit, target (+4 more)

### Community 50 - "Cron Job Registry & Lifecycle"
Cohesion: 0.23
Nodes (8): bookingCompletionJob, bookingService, checkInService, noShowReleaseJob, Job, jobRegistry, scheduledJobs, node-cron

### Community 51 - "Employee Entity & Repository"
Cohesion: 0.23
Nodes (7): Employee, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn, EmployeeRepository

### Community 52 - "CheckIn Entity & Repository"
Cohesion: 0.20
Nodes (9): CheckIn, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, CheckInRepository (+1 more)

### Community 53 - "Backend npm Scripts"
Cohesion: 0.18
Nodes (11): scripts, build, dev, migrate, migrate:revert, seed, socket:verify, start (+3 more)

### Community 54 - "Booking Change Window Policy"
Cohesion: 0.27
Nodes (8): AddBookingParticipantsData, isRetryableTransactionError(), RemoveBookingParticipantData, RETRYABLE_PG_CODES, RoomOccupancy, BOOKING_CHANGE_WINDOW_MINUTES, getBookingChangeCutoff(), isBookingChangeWindowOpen()

### Community 56 - "Phase Plan & DataLoader Batching"
Cohesion: 0.31
Nodes (9): Per-Request DataLoaders on AppContext, Backend Track (Phases 4–13), DataLoader Batching to Remove N+1, Phase 25 — Documentation & Delivery, Frontend Track (Phases 14–23), Phase 24 — Hardening & Tests, Milestones & Timeline (M1–M5), Phase Plan 1–25 (+1 more)

### Community 57 - "Room Filter Input DTO"
Cohesion: 0.22
Nodes (9): RoomFilterInput, ArrayMinSize, Field, InputType, IsArray, IsEnum, IsInt, IsOptional (+1 more)

### Community 58 - "Frontend Dev Dependencies"
Cohesion: 0.22
Nodes (9): devDependencies, autoprefixer, postcss, tailwindcss, @types/react, @types/react-dom, typescript, vite (+1 more)

### Community 59 - "React App Entry & Apollo Client"
Cohesion: 0.31
Nodes (6): App(), AuthProvider(), apolloClient, httpLink, frontend_src_index, react-dom

### Community 60 - "Booking Overlap & Cancellation Invariants"
Cohesion: 0.29
Nodes (8): Booking Invariants That Break Silently, Serializable Transaction + Retry for Racy Writes, Serializable Transaction for Double-Booking Prevention, 30-Minute Cancellation and Participant Window (§9), EXC_bookings_room_no_overlap Constraint (§8.15), Booking List & Details (FR-24…FR-27), Cancellation Rules (FR-31, FR-33), Double Booking Prevention, database-level guarantee

### Community 61 - "Cookie Header Parsing & JWT Verify"
Cohesion: 0.46
Nodes (6): userFromCookieHeader(), userFromCookies(), CookieMap, parseCookieHeader(), readCookie(), verifyToken()

### Community 62 - "Booking Relations Field Resolver"
Cohesion: 0.39
Nodes (6): BookingRelationsFieldResolver, Authorized, Ctx, FieldResolver, Resolver, Root

### Community 63 - "Room Occupancy Field Resolver"
Cohesion: 0.39
Nodes (6): RoomOccupancyFieldResolver, Authorized, Ctx, FieldResolver, Resolver, Root

### Community 64 - "Create Maintenance Input DTO"
Cohesion: 0.25
Nodes (8): CreateMaintenanceInput, Field, InputType, IsInt, IsOptional, IsString, MaxLength, Min

### Community 65 - "Update Room Input DTO"
Cohesion: 0.25
Nodes (8): Field, InputType, IsInt, IsNotEmpty, IsOptional, MaxLength, Min, UpdateRoomInput

### Community 66 - "Frontend Runtime Dependencies"
Cohesion: 0.25
Nodes (8): dependencies, @apollo/client, graphql, react, react-dom, react-icons, react-router-dom, socket.io-client

### Community 67 - "Env Config & Logger"
Cohesion: 0.38
Nodes (5): Level, log(), toTimestamp(), env, dotenv

### Community 68 - "Check-In Resolver"
Cohesion: 0.29
Nodes (6): CheckInResolver, Arg, Authorized, Ctx, Mutation, Resolver

### Community 69 - "Update Equipment Input DTO"
Cohesion: 0.29
Nodes (7): Field, InputType, IsInt, IsNotEmpty, IsOptional, MaxLength, UpdateEquipmentInput

### Community 70 - "Health Query"
Cohesion: 0.33
Nodes (4): Health, Field, ObjectType, Query

### Community 71 - "Frontend npm Scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, preview, typecheck

### Community 76 - "Backend Build tsconfig"
Cohesion: 0.50
Nodes (3): exclude, extends, ./tsconfig.json

## Knowledge Gaps
- **298 isolated node(s):** `name`, `version`, `private`, `dev`, `build` (+293 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 566 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `App Shell Layout & Form Primitives` to `Booking UI Forms & Mutations`, `Auth Context & Auth Mutations`, `Dashboard, Analytics & List Primitives`, `Shared UI Primitives & Admin Queries`, `API Verification Harness & Realtime Events`, `Date Pickers & Calendar Builders`, `Frontend Package Manifest & Vite Config`, `Room & Waitlist Mutations, RoomForm`, `Maintenance Mutations & Admin Calendar Page`, `Equipment Mutations & Button Primitive`, `Login Page & Auth Form Language`, `Create Booking Page & Recurrence Utils`, `React App Entry & Apollo Client`?**
  _High betweenness centrality (0.130) - this node is a cross-community bridge._
- **Why does `@apollo/client` connect `Room & Waitlist Mutations, RoomForm` to `Booking UI Forms & Mutations`, `Auth Context & Auth Mutations`, `Dashboard, Analytics & List Primitives`, `Shared UI Primitives & Admin Queries`, `API Verification Harness & Realtime Events`, `Frontend Package Manifest & Vite Config`, `Employees Query`, `Maintenance Mutations & Admin Calendar Page`, `Equipment Mutations & Button Primitive`, `Create Booking Page & Recurrence Utils`, `React App Entry & Apollo Client`?**
  _High betweenness centrality (0.122) - this node is a cross-community bridge._
- **Why does `AppContext` connect `AppContext & Auth Input DTOs` to `Auth, Check-In & Field Resolvers`, `Analytics Resolver & Date Range Input`, `Booking, Equipment & Health Resolvers`, `Check-In Resolver`, `HTTP Server Bootstrap & Socket.IO`, `Waitlist Types & Field Resolvers`, `Booking Resolver Surface & Participant Input`, `Equipment Resolver & Room Inputs`, `Booking Relations Field Resolver`, `Error Codes, Auth Checker & Auth Service`, `Maintenance Resolver & Types`, `Cookie Header Parsing & JWT Verify`, `Participant Entity, Repository & Service`, `Room Occupancy Field Resolver`?**
  _High betweenness centrality (0.077) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _298 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Booking UI Forms & Mutations` be split into smaller, more focused modules?**
  _Cohesion score 0.09011776753712238 - nodes in this community are weakly interconnected._
- **Should `Auth, Check-In & Field Resolvers` be split into smaller, more focused modules?**
  _Cohesion score 0.06487434248977206 - nodes in this community are weakly interconnected._
- **Should `Shared UI Primitives & Admin Queries` be split into smaller, more focused modules?**
  _Cohesion score 0.09643605870020965 - nodes in this community are weakly interconnected._