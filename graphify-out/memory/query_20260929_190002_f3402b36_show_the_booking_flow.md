---
type: "query"
date: "2026-09-29T19:00:02.727081+00:00"
question: "show the booking flow"
contributor: "graphify"
outcome: "useful"
source_nodes: ["BookingService", ".create()", ".createWithConflictMapping()", ".createInTransaction()", ".createRecurringWithConflictMapping()", "withSerializableRetry()", "isBookingOverlapViolation()", ".buildBookingConflictMessage()", "formatConflictWindow()", "Booking"]
---

# Q: show the booking flow

## Answer

Expanded from original query via vocab: [booking, create, recurring, series, occurrence, transaction, conflict, overlap, exclusion, serializable, waitlist, maintenance]. Then traversed DFS from BookingService/.create(). Booking creation flow: BookingResolver -> BookingService.create (booking-service.ts L105) validates via requireRole(EMPLOYEE), trims title, rejects startTime>=endTime and past startTime, then routes to createWithConflictMapping (L779) or createRecurringWithConflictMapping (L663). Both wrap a SERIALIZABLE AppDataSource.transaction via withSerializableRetry (L807). createInTransaction (L557) pre-checks findConflictingBooking then findConflictingMaintenance and throws ConflictError with a human UTC window from formatConflictWindow (conflict-message-time.ts L27). On retry exhaustion isBookingOverlapViolation (L88) maps the raw PG exclusion-constraint violation back to a ConflictError naming the clashing booking. Recurring path expands occurrences first (backend generateOccurrences, utils/recurrence.ts L47) and stamps buildRecurrenceId (L96); frontend mirrors the generator (frontend/src/utils/recurrence.ts OccurrencePreview L29). Cancellation (.cancel L304) is gated by requireBookingChangeWindow (L849) / isBookingChangeWindowOpen (booking-time-policy.ts L9) and then waitlist-conversion-service onBookingCancelled (L24) / convertEntry (L69) books the released slot. The database exclusion constraint, not the pre-check, is the real guarantee (AGENTS.md lines 64-66; requirement.md 'Double Booking Prevention, database-level guarantee').

## Outcome

- Signal: useful

## Source Nodes

- BookingService
- .create()
- .createWithConflictMapping()
- .createInTransaction()
- .createRecurringWithConflictMapping()
- withSerializableRetry()
- isBookingOverlapViolation()
- .buildBookingConflictMessage()
- formatConflictWindow()
- Booking
- Room