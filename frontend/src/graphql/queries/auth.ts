import { gql } from '@apollo/client';
import type { Employee } from '../../types';

export interface CurrentUserData {
  currentUser: Employee | null;
}

export const CURRENT_USER_QUERY = gql`
  query CurrentUser {
    currentUser {
      id
      firstName
      lastName
      email
      role
    }
  }
`;
