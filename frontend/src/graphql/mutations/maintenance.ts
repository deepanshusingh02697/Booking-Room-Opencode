import { gql } from '@apollo/client';
import type { MaintenanceWindow } from '../../types';

export interface CreateMaintenanceData {
  createMaintenance: MaintenanceWindow;
}

export interface CreateMaintenanceVars {
  input: {
    roomId: number;
    startTime: string;
    endTime: string;
    reason?: string;
  };
}

export const CREATE_MAINTENANCE_MUTATION = gql`
  mutation CreateMaintenance($input: CreateMaintenanceInput!) {
    createMaintenance(input: $input) {
      id
      roomId
      startTime
      endTime
      reason
      createdAt
    }
  }
`;

export interface DeleteMaintenanceData {
  deleteMaintenance: boolean;
}

export interface DeleteMaintenanceVars {
  id: number;
}

/**
 * `deleteMaintenance` returns a bare Boolean rather than the removed window, so
 * the Apollo cache holds nothing to update: every caller refetches
 * `roomMaintenance` explicitly instead of relying on a cache write (§8.40).
 */
export const DELETE_MAINTENANCE_MUTATION = gql`
  mutation DeleteMaintenance($id: Int!) {
    deleteMaintenance(id: $id)
  }
`;