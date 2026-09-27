import { gql } from '@apollo/client';
import type { Booking } from '../../types';

/**
 * The list-row selection shared by `myBookings` and `myMeetings`. It is
 * deliberately lean: every field on BookingType that needs a resolver (`room`,
 * `participants`, `hasCheckedIn`, `checkIn`) costs one query per row, and a
 * list can hold dozens of rows. The details page asks for the rest.
 */
const bookingRowFields = gql`
  fragment BookingRowFields on BookingType {
    id
    roomId
    organizerId
    title
    description
    status
    startTime
    endTime
    recurrenceId
    room {
      id
      name
      capacity
      floor
      location
      status
    }
  }
`;

export interface MyBookingsData {
  myBookings: Booking[];
}

export const MY_BOOKINGS_QUERY = gql`
  ${bookingRowFields}
  query MyBookings {
    myBookings {
      ...BookingRowFields
    }
  }
`;

export interface MyMeetingsData {
  myMeetings: Booking[];
}

export const MY_MEETINGS_QUERY = gql`
  ${bookingRowFields}
  query MyMeetings {
    myMeetings {
      ...BookingRowFields
    }
  }
`;

export interface BookingDetailsData {
  bookingDetails: Booking;
}

export interface RecurringBookingGroupData {
  recurringBookingGroup: Booking[];
}

export interface RecurringBookingGroupVars {
  recurrenceId: string;
}

/**
 * The occurrence list of a series, deliberately lean for the same reason
 * `BookingRowFields` is: every field on BookingType that needs a field resolver
 * (`room`, `organizer`, `participants`, `hasCheckedIn`, `checkIn`) costs one
 * query per row, and a series can hold 90 of them. The room and organiser are
 * identical on every occurrence by construction, and the details page already
 * has them, so this stays a single round trip with no N+1.
 */
export const RECURRING_BOOKING_GROUP_QUERY = gql`
  query RecurringBookingGroup($recurrenceId: String!) {
    recurringBookingGroup(recurrenceId: $recurrenceId) {
      id
      roomId
      organizerId
      title
      status
      startTime
      endTime
      recurrenceId
    }
  }
`;
export interface BookingDetailsVars {
  id: number;
}

export const BOOKING_DETAILS_QUERY = gql`
  query BookingDetails($id: Int!) {
    bookingDetails(id: $id) {
      id
      roomId
      organizerId
      title
      description
      status
      startTime
      endTime
      recurrenceId
      hasCheckedIn
      checkInWindowOpensAt
      checkInWindowClosesAt
      createdAt
      updatedAt
      room {
        id
        name
        capacity
        floor
        location
        status
      }
      organizer {
        id
        firstName
        lastName
        email
      }
      participants {
        id
        employeeId
        employee {
          id
          firstName
          lastName
          email
        }
      }
      checkIn {
        id
        checkedInBy
        checkedInAt
        employee {
          id
          firstName
          lastName
        }
      }
    }
  }
`;
