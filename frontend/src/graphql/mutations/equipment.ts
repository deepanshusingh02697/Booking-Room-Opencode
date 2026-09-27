import { gql } from '@apollo/client';
import type { Equipment, Room } from '../../types';

const roomWithEquipment = gql`
  fragment RoomWithEquipment on RoomType {
    id
    name
    equipment {
      id
      name
    }
  }
`;

export interface CreateEquipmentData {
  createEquipment: Equipment;
}

export interface CreateEquipmentVars {
  input: { name: string };
}

export const CREATE_EQUIPMENT_MUTATION = gql`
  mutation CreateEquipment($input: CreateEquipmentInput!) {
    createEquipment(input: $input) {
      id
      name
    }
  }
`;

export interface UpdateEquipmentData {
  updateEquipment: Equipment;
}

export interface UpdateEquipmentVars {
  input: { id: number; name: string };
}

export const UPDATE_EQUIPMENT_MUTATION = gql`
  mutation UpdateEquipment($input: UpdateEquipmentInput!) {
    updateEquipment(input: $input) {
      id
      name
    }
  }
`;

export interface AssignEquipmentData {
  assignEquipmentToRoom: Room;
}

export interface AssignEquipmentVars {
  input: { roomId: number; equipmentId: number };
}

export const ASSIGN_EQUIPMENT_MUTATION = gql`
  ${roomWithEquipment}
  mutation AssignEquipmentToRoom($input: RoomEquipmentInput!) {
    assignEquipmentToRoom(input: $input) {
      ...RoomWithEquipment
    }
  }
`;

export interface RemoveEquipmentData {
  removeEquipmentFromRoom: Room;
}

export interface RemoveEquipmentVars {
  input: { roomId: number; equipmentId: number };
}

export const REMOVE_EQUIPMENT_MUTATION = gql`
  ${roomWithEquipment}
  mutation RemoveEquipmentFromRoom($input: RoomEquipmentInput!) {
    removeEquipmentFromRoom(input: $input) {
      ...RoomWithEquipment
    }
  }
`;
