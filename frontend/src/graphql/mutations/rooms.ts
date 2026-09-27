import { gql } from '@apollo/client';
import type { Room, RoomStatus } from '../../types';

const roomFields = gql`
  fragment RoomFields on RoomType {
    id
    name
    capacity
    floor
    location
    status
  }
`;

export interface CreateRoomData {
  createRoom: Room;
}

export interface CreateRoomVars {
  input: {
    name: string;
    capacity: number;
    floor: number;
    location: string;
  };
}

export const CREATE_ROOM_MUTATION = gql`
  ${roomFields}
  mutation CreateRoom($input: CreateRoomInput!) {
    createRoom(input: $input) {
      ...RoomFields
    }
  }
`;

export interface UpdateRoomData {
  updateRoom: Room;
}

export interface UpdateRoomVars {
  input: {
    id: number;
    name?: string;
    capacity?: number;
    floor?: number;
    location?: string;
  };
}

export const UPDATE_ROOM_MUTATION = gql`
  ${roomFields}
  mutation UpdateRoom($input: UpdateRoomInput!) {
    updateRoom(input: $input) {
      ...RoomFields
    }
  }
`;

export interface SetRoomStatusData {
  setRoomStatus: Room;
}

export interface SetRoomStatusVars {
  input: { id: number; status: RoomStatus };
}

export const SET_ROOM_STATUS_MUTATION = gql`
  ${roomFields}
  mutation SetRoomStatus($input: SetRoomStatusInput!) {
    setRoomStatus(input: $input) {
      ...RoomFields
    }
  }
`;
