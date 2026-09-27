import { gql } from '@apollo/client';
import type { Booking } from '../../types';

export interface MyMeetingsData {
  myMeetings: Booking[];
}

export const MY_MEETINGS_QUERY = gql`
  query MyMeetings {
    myMeetings {
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
  }
`;
