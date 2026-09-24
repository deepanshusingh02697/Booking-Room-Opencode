# Requirement Document — Meeting Room Booking Intelligence

**Project:** Meeting Room Intelligence
**Stack:** React · TypeScript · Node · GraphQL · PostgreSQL · Tailwind CSS

---

## 1. Project Overview

The Meeting Room Intelligence is a full stack application designed to streamline workplace room booking system. The system handles room booking, check availability, manage recurring bookings, automatically release bookings, check-ins, no-shows and waiting list while giving administrators full control over room and equipment management along with basic usage analytics with maintain advanced backend optimization and modular frontend.

## 2. Core Features

- **Role-Based Access Control:** Provide distinct capabilities for admin and employees with authorization for desired data by using GraphQL API calls.
- **Forgot Password:** Enable forgot password via email and send the mail for changing password by using node-mailer.
- **Room Search & Availability:** Enables filtering rooms by date, time, capacity, floor, equipment, and status, returning rooms according to request data.
- **Advanced Booking Engine:** Enforce business constraints including time-overlap prevention, room capacity checks, room status checks and past-date rejection.
- **Double Booking Prevention:** Guards against concurrent bookings when two employees attempt to book the same room and slot simultaneously, ensuring only one booking at database level.
- **Recurring Meetings:** Allow a meeting to repeat until a selected end date by avoiding the conflict of booking across all occurrences.
- **Check-in & No-show Handling:** Allow participants to check in within allowed time, otherwise automatically release the room if no one checks in within 10 minutes of the start time.
- **Waiting List Management:** Lets employees join a waiting list for an unavailable room/slot, with handling when booking is cancelled and confirm the booking from the waiting list if no employee joins or no-show room.
- **Admin Room & Equipment Management:** Allow administrators to create, edit, disable rooms and manage associated equipment and maintenance periods.
- **Admin Calendar & Audit Visibility:** Provides administrators a booking view inside the calendar dates and admin also can inspect the bookings details.
- **Analytical Report:** Basic room-usage information such as utilization count, cancelled booking counts and no-show statistics.
- **Notification:** Booking invitation notification delivered to relevant users.
- **Performance Optimization:** Implement data loaders by batching to eliminate N+1 query problem.

## 3. Functional Requirements

### 3.1 Authentication System

- **FR-1:** System shall allow an employee to sign-up with first name, last name, email and password; email is validated for uniqueness and the password is stored only as a bcrypt hash.
- **FR-2:** System shall allow an employee to log in with email and password, verifying the bcrypt hash and confirming the account role is EMPLOYEE before issuing a signed JWT in an httpOnly cookie.
- **FR-3:** System shall provide a separate AdminLogin mutation that verifies the account role is ADMIN before issuing a session cookie, rejecting the credentials otherwise.
- **FR-4:** System shall allow a user to log out, clearing the session cookie.
- **FR-5:** System shall expose a CurrentUser query returning the authenticated user's profile from the session.
- **FR-6:** System shall allow a user to request a password reset by email; a random token is generated, hashed with SHA-256, remain with a 10-minute expiry, and emailed via a reset link, without revealing whether the email exists.
- **FR-7:** System shall allow a user to complete a password reset using a valid, unused, unexpired token, updating the password hash and marking the token as used within a single transaction.

### 3.2 Room Search & Availability

- **FR-8:** System shall allow an authenticated user to search rooms by status, minimum capacity, floor and required equipment.
- **FR-9:** System shall exclude from search results any room with a CONFIRMED booking or a maintenance window overlapping the requested time range.
- **FR-10:** System shall allow listing all rooms with their assigned equipment, and fetching a single room's details by id.

### 3.3 Room Management (Admin)

- **FR-11:** System shall allow an administrator to create a room with name, capacity, floor and location, rejecting duplicate room names.
- **FR-12:** System shall allow an administrator to update a room's name, capacity, floor and location.
- **FR-13:** System shall allow an administrator to disable or re-enable a room via its status field.

### 3.4 Equipment Management (Admin)

- **FR-14:** System shall allow an administrator to create an equipment record by name.
- **FR-15:** System shall allow an administrator to edit an equipment record's name, rejecting a name that collides with a different existing equipment record.
- **FR-16:** System shall allow an administrator to assign equipment to a room and to remove it, rejecting duplicate assignments and no-op removals.
- **FR-17:** System shall list all equipment records.

### 3.5 Booking Creation

- **FR-18:** System shall allow an authenticated employee to create a booking specifying room, title, optional description, start time, end time and optional participants.
- **FR-19:** System shall reject a booking for a room that is not AVAILABLE.
- **FR-20:** System shall reject a booking whose total attendee count (organizer plus participants) exceeds the room's capacity.
- **FR-21:** System shall reject a booking that overlaps an existing CONFIRMED booking or a maintenance window for the same room, checked and written inside a single Serializable database transaction so concurrent requests for the same slot cannot both succeed.
- **FR-22:** System shall allow a booking to be created as a recurring series (DAILY or WEEKLY) up to a specified end date, validating that no two generated occurrences overlap each other and that no occurrence conflicts with an existing booking or maintenance window, before creating all occurrences under a shared recurrence id in one transaction.
- **FR-23:** System shall emit a real-time notification to each added participant when a booking (single or recurring) is created.

### 3.6 Booking List & Details

- **FR-24:** System shall provide a MyBookings query returning all bookings organized by the current user, most recent first.
- **FR-25:** System shall provide a MyMeetings query returning the current user's upcoming CONFIRMED meetings where they are organizer or participant.
- **FR-26:** System shall provide a BookingDetails query restricted to the organizer, a listed participant, or an admin, rejecting access for any other caller.
- **FR-27:** System shall provide a RecurringBookingGroup query returning every occurrence of a recurrence id, restricted to the organizer, a participant of any occurrence, or an admin.

### 3.7 Participant Management

- **FR-28:** System shall allow the organizer or an admin to add a participant to a CONFIRMED booking, rejecting duplicate participants and rejecting the add if total attendees would exceed room capacity.
- **FR-29:** System shall allow the organizer, an admin, or the participant themself to remove a participant from a CONFIRMED booking.
- **FR-30:** System shall emit a real-time notification to the affected user whenever they are added to or removed from a meeting.

### 3.8 Cancellation

- **FR-31:** System shall allow the organizer or an admin to cancel a CONFIRMED booking, enforcing a cancellation-window rule based on the booking's start time.
- **FR-33:** System shall automatically attempt to convert a matching waiting-list entry into a booking whenever a booking (single or recurring occurrence) is cancelled.

### 3.9 Waiting List

- **FR-34:** System shall allow an authenticated user to join the waiting list for a room and time window, but only when that window is genuinely unavailable (an overlapping confirmed booking exists) and not blocked by maintenance.
- **FR-35:** System shall reject a duplicate waitlist entry for the same room, user and time window.
- **FR-36:** System shall allow a user to remove only their own waiting-list entry.
- **FR-37:** System shall provide a MyWaitlist query listing the current user's waiting-list entries in the order joined.

### 3.10 Check-In

- **FR-38:** System shall allow the organizer or a listed participant to check in to a CONFIRMED booking.
- **FR-39:** System shall enforce that check-in is only accepted within an allowed time window relative to the booking's start time.
- **FR-40:** System shall reject a second check-in against a booking that has already been checked in.

### 3.11 Room Maintenance (Admin)

- **FR-41:** System shall allow an administrator to create a maintenance window for a room, rejecting it if a CONFIRMED booking or another maintenance window already overlaps that time.
- **FR-42:** System shall allow an administrator to delete a maintenance record.
- **FR-43:** System shall provide a RoomMaintenance query listing a room's maintenance windows in chronological order.

### 3.12 Admin Calendar & Analytics

- **FR-44:** System shall provide an AdminCalendar query, restricted to administrators, returning all bookings overlapping a specified date range across every room.
- **FR-45:** System shall provide a UsageAnalytics query, restricted to administrators, returning total bookings, cancellations and no-shows, broken down per room, for a specified date range.

### 3.13 Computed Room Fields

- **FR-46:** System shall resolve a room's assigned equipment list on demand via a Room field resolver.
- **FR-47:** System shall resolve a room's current occupant count and remaining available capacity on demand, based on whichever CONFIRMED booking is active at the current moment.

## 4. Tech Stack

| Layer                | Technology                                |
| -------------------- | ----------------------------------------- |
| Frontend             | React, TypeScript, Tailwind CSS, GraphQL Client (Apollo Client) |
| Backend              | Node, Express, TypeGraphQL, TypeScript    |
| Database & ORM       | PostgreSQL, TypeORM                       |
| Automation & Security| JWT, bcrypt, class-validator, node-cron (Scheduler) |

## 5. Data Model

| Entity               | Fields                                            |
| -------------------- | ------------------------------------------------- |
| Employee             | Id, firstName, lastName, email, password, role, createdAt, updatedAt |
| PasswordResetToken   | Id, userId, tokenHash, expiresAt, usedAt, createdAt |
| Room                 | Id, name, capacity, floor, location, status        |
| Equipment            | Id, name                                          |
| RoomEquipment        | Id, roomId, equipmentId, createdAt                 |
| Booking              | Id, roomId, organizerId, title, description, status, startTime, endTime, recurrenceId, checkIn, createdAt |
| Participants         | Id, bookingId, userId                             |
| CheckIn              | Id, bookingId, checkInBy, checkInAt               |
| WaitlistEntry        | Id, roomId, userId, startTime, endTime, createdAt |
| Maintenance          | Id, roomId, startTime, endTime, reason            |

## 6. Architecture and Workflow

The application follows a strict clean-architecture model separating concerns across layers.

### Architecture Pattern

- **Frontend Architecture:** Feature-based module organization encapsulating components, hooks, graphql and pages.
- **Backend Architecture:** Implemented layers-based architecture i.e. Resolver → Service → Repository → Database.

### Data Flow & Request Life Cycle

1. **Client Request:** React client initiates a GraphQL query or mutation via Apollo Client.
2. **Authentication and Authorization:** Middleware validates the incoming JWT token and checks the user's role-based permission via context, applied consistently to both UI and GraphQL requests.
3. **Execution and Validation:** Incoming inputs pass through class-validator rules and business rule checks (overlap, capacity, room status, past-date) before hitting GraphQL APIs.
4. **Database Interaction:** ORM queries and transactions process the data, using database level constraints to guarantee that concurrent booking attempts for the same room and slot can't both succeed.

## 7. Roles and Responsibilities

### Admin

- Manages rooms (create, update, disable and read rooms)
- Manages equipment associated with rooms
- Manages room maintenance periods and status
- Views office-wide bookings calendar and cancels any booking
- Views basic room-usage and analytics information

### Employee

- Searches rooms by date, time, capacity, floor, equipment and status
- Views room availability and details
- Creates new bookings, including recurring meetings
- Views and cancels own bookings
- Adds participants to a meeting
- Checks in to a meeting within the allowed window
- Joins the waiting list when a preferred slot is unavailable