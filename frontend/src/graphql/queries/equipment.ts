import { gql } from '@apollo/client';
import type { Equipment } from '../../types';

export interface EquipmentData {
  equipment: Equipment[];
}

export const EQUIPMENT_QUERY = gql`
  query Equipment {
    equipment {
      id
      name
    }
  }
`;
