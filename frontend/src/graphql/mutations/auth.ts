import { gql } from '@apollo/client';
import type { Employee } from '../../types';

export interface LogInData {
  logIn: Employee;
}

export interface AdminLogInData {
  adminLogin: Employee;
}

export interface SignUpData {
  signUp: Employee;
}

export interface LogoutData {
  logout: boolean;
}

export interface CredentialsVars {
  input: { email: string; password: string };
}

export interface SignUpVars {
  input: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  };
}

const EMPLOYEE_FIELDS = `
  id
  firstName
  lastName
  email
  role
`;

export const LOG_IN_MUTATION = gql`
  mutation LogIn($input: LogInInput!) {
    logIn(input: $input) {
      ${EMPLOYEE_FIELDS}
    }
  }
`;

export const ADMIN_LOG_IN_MUTATION = gql`
  mutation AdminLogin($input: AdminLoginInput!) {
    adminLogin(input: $input) {
      ${EMPLOYEE_FIELDS}
    }
  }
`;

export const SIGN_UP_MUTATION = gql`
  mutation SignUp($input: SignUpInput!) {
    signUp(input: $input) {
      ${EMPLOYEE_FIELDS}
    }
  }
`;

export const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout
  }
`;
