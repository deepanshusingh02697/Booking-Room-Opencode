import { gql } from '@apollo/client';
import type { Booking } from '../../types';

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
