import { gql } from '@apollo/client';
import type { Employee } from '../../types';

export interface EmployeesData {
  employees: Employee[];
}

export const EMPLOYEES_QUERY = gql`
  query Employees {
    employees {
      id
      firstName
      lastName
      email
      role
    }
  }
`;
