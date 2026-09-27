import { gql } from '@apollo/client';
import type { Room, RoomStatus } from '../../types';

export interface RoomsData {
  rooms: Room[];
}

export interface RoomsVars {
  filter?: {
    status?: RoomStatus;
    minCapacity?: number;
    floor?: number;
    equipmentIds?: number[];
    startTime?: string;
    endTime?: string;
  };
}

export const ROOMS_QUERY = gql`
  query Rooms($filter: RoomFilterInput) {
    rooms(filter: $filter) {
      id
      name
      capacity
      floor
      location
      status
      occupantCount
      remainingCapacity
      equipment {
        id
        name
      }
    }
  }
`;

export interface RoomDetailsData {
  room: Room;
}

export interface RoomDetailsVars {
  id: number;
}

export const ROOM_DETAILS_QUERY = gql`
  query RoomDetails($id: Int!) {
    room(id: $id) {
      id
      name
      capacity
      floor
      location
      status
      occupantCount
      remainingCapacity
      equipment {
        id
        name
      }
    }
  }
`;
