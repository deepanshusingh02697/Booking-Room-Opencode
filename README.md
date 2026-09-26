# Meeting Room Intelligence

A full-stack meeting-room booking system. Employees can find rooms, check availability, book and manage meetings (including recurring meetings, check-in, no-show release and a waiting list). Admins manage rooms, equipment and maintenance, and can view office-wide bookings and usage analytics.

## Tech Stack

| Area                | Technology                                  |
| ------------------- | ------------------------------------------- |
| Frontend            | React, TypeScript, Tailwind CSS, Apollo Client |
| Backend             | Node.js, Express, TypeGraphQL, TypeScript   |
| Database & ORM      | PostgreSQL, TypeORM                         |
| Real Time           | Socket.io                                   |
| Security & Jobs     | JWT, bcrypt, class-validator, node-cron     |

## Setup

Prerequisites: Node.js, PostgreSQL.

1. Install dependencies from the root:

   ```bash
   npm install
   ```

2. Configure environment variables:

   ```bash
   cp backend/.env.example backend/.env
   ```

   Fill in the PostgreSQL connection details, JWT secret and frontend origin.

3. Run migrations and seed data from the backend:

   ```bash
   npm run migrate -w backend
   npm run seed -w backend
   ```

4. Start both applications from the root:

   ```bash
   npm run dev
   ```

   - Backend: http://localhost:4000/graphql
   - Frontend: http://localhost:5173

   Real-time notifications are served by Socket.IO on the same port
   (`http://localhost:4000/socket.io`). The handshake is authenticated with the same
   httpOnly session cookie as GraphQL, and Vite proxies `/socket.io` in development.
   To verify the event stream without any UI, run the bare Socket.IO client script
   against a running server:

   ```bash
   npm run socket:verify -w backend
   ```

## Architecture

Feature-based modules, each split into layers: Resolver → Service → Repository → Entity. See `doc/plan.md` for the full structure and phase plan.

## Documentation

- `doc/requirement.md` — full requirements and business rules
- `doc/plan.md` — implementation plan and folder structure

## Status

Backend track (Phases 1–13) is complete: project foundation, database design,
authentication, rooms, equipment, bookings, cancellation, recurring meetings,
check-in/no-show, waitlist, maintenance, admin calendar/analytics and real-time
notifications are all served by the API. The frontend track (Phases 14–23) is next.

- **Phase 13 done-when:** adding a participant delivers a `notification:PARTICIPANT_ADDED`
  event to that employee's connected Socket.IO client in real time — verified with
  `npm run socket:verify -w backend` (no UI involved).
