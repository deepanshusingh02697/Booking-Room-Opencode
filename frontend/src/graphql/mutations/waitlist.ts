import { gql } from '@apollo/client';
import type { WaitlistEntry } from '../../types';

export interface JoinWaitlistData {
  joinWaitlist: WaitlistEntry;
}

export interface JoinWaitlistVars {
  input: { roomId: number; startTime: string; endTime: string };
}

export const JOIN_WAITLIST_MUTATION = gql`
  mutation JoinWaitlist($input: JoinWaitlistInput!) {
    joinWaitlist(input: $input) {
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

export interface LeaveWaitlistData {
  leaveWaitlist: boolean;
}

export interface LeaveWaitlistVars {
  entryId: number;
}

/**
 * `leaveWaitlist` returns a bare Boolean rather than the removed entry, so the
 * Apollo cache holds nothing to update: every caller refetches `myWaitlist`
 * explicitly instead of relying on a cache write.
 */
export const LEAVE_WAITLIST_MUTATION = gql`
  mutation LeaveWaitlist($entryId: Int!) {
    leaveWaitlist(entryId: $entryId)
  }
`;
