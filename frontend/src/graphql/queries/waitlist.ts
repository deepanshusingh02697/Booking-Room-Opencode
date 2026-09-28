import { gql } from '@apollo/client';
import type { WaitlistEntry } from '../../types';

export interface MyWaitlistData {
  myWaitlist: WaitlistEntry[];
}

/**
 * The server returns every entry the signed-in user holds, ordered by
 * `createdAt ASC, id ASC` (FIFO) and without a time filter, so the Waiting and
 * Passed panels sort and split the result themselves — see utils/waitlist.ts.
 */
export const MY_WAITLIST_QUERY = gql`
  query MyWaitlist {
    myWaitlist {
      id
      roomId
      employeeId
      startTime
      endTime
      createdAt
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
