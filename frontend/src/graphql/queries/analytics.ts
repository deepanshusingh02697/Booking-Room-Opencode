import { gql } from '@apollo/client';
import type { Booking, RoomUsage } from '../../types';

export interface AdminCalendarData {
  adminCalendar: Booking[];
}

export interface AdminCalendarVars {
  input: { startTime: string; endTime: string };
}

export const ADMIN_CALENDAR_QUERY = gql`
  query AdminCalendar($input: DateRangeInput!) {
    adminCalendar(input: $input) {
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

export interface UsageAnalyticsData {
  usageAnalytics: RoomUsage[];
}

export interface UsageAnalyticsVars {
  input: { startTime: string; endTime: string };
}

export const USAGE_ANALYTICS_QUERY = gql`
  query UsageAnalytics($input: DateRangeInput!) {
    usageAnalytics(input: $input) {
      roomId
      roomName
      totalBookings
      cancellations
      noShows
    }
  }
`;
