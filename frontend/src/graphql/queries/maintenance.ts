import { gql } from '@apollo/client';
import type { MaintenanceWindow } from '../../types';

export interface RoomMaintenanceData {
  roomMaintenance: MaintenanceWindow[];
}

export interface RoomMaintenanceVars {
  roomId: number;
}

export const ROOM_MAINTENANCE_QUERY = gql`
  query RoomMaintenance($roomId: Int!) {
    roomMaintenance(roomId: $roomId) {
      id
      roomId
      startTime
      endTime
      reason
      createdAt
    }
  }
`;

export interface OfficeMaintenanceData {
  officeMaintenance: MaintenanceWindow[];
}

export interface OfficeMaintenanceVars {
  input: { startTime: string; endTime: string };
}

/**
 * Every room's maintenance windows overlapping a range — the admin calendar's
 * companion to `adminCalendar`, which returns bookings only. Admin-only on the
 * server; employees keep the per-room `roomMaintenance` read.
 *
 * The `room { name }` selection resolves per row, so this is the only
 * field-resolver cost on the page and it is bounded by the number of windows in
 * the range.
 */
export const OFFICE_MAINTENANCE_QUERY = gql`
  query OfficeMaintenance($input: DateRangeInput!) {
    officeMaintenance(input: $input) {
      id
      roomId
      startTime
      endTime
      reason
      room {
        id
        name
      }
    }
  }
`;
