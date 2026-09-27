import { gql } from '@apollo/client';
import type { Booking, RecurrenceFrequency } from '../../types';

const bookingFields = gql`
  fragment BookingFields on BookingType {
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
  }
`;

export interface CreateBookingData {
  createBooking: Booking;
}

export interface CreateBookingVars {
  input: {
    roomId: number;
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    participantIds?: number[];
    /**
     * Omitted entirely for a one-off booking — a `null` here is a different
     * request, not the same one (doc/project-state.md §8.25).
     */
    recurrence?: {
      frequency: RecurrenceFrequency;
      endDate: string;
    };
  };
}

export const CREATE_BOOKING_MUTATION = gql`
  ${bookingFields}
  mutation CreateBooking($input: CreateBookingInput!) {
    createBooking(input: $input) {
      ...BookingFields
    }
  }
`;

export interface CancelBookingData {
  cancelBooking: Booking;
}

export interface CancelBookingVars {
  id: number;
}

/**
 * The same fragment as `createBooking`, so the cancelled booking is written
 * into the cache under its own id and every list row and details panel that
 * already has it re-renders as CANCELLED without a refetch.
 */
export const CANCEL_BOOKING_MUTATION = gql`
  ${bookingFields}
  mutation CancelBooking($id: Int!) {
    cancelBooking(id: $id) {
      ...BookingFields
    }
  }
`;

export interface AddParticipantsData {
  addParticipants: Booking;
}

export interface AddParticipantsVars {
  input: {
    bookingId: number;
    employeeIds: number[];
  };
}

/**
 * The whole selected group goes in one mutation, because the server takes a
 * batch and writes it in a single transaction (Phase 7: one mutation, not one
 * round trip per person).
 */
export const ADD_PARTICIPANTS_MUTATION = gql`
  mutation AddParticipants($input: AddParticipantsInput!) {
    addParticipants(input: $input) {
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

export interface RemoveParticipantData {
  removeParticipant: Booking;
}

export interface RemoveParticipantVars {
  input: {
    bookingId: number;
    employeeId: number;
  };
}

export const REMOVE_PARTICIPANT_MUTATION = gql`
  mutation RemoveParticipant($input: RemoveParticipantInput!) {
    removeParticipant(input: $input) {
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
