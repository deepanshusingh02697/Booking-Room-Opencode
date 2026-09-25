export const UserRole = {
  EMPLOYEE: 'EMPLOYEE',
  ADMIN: 'ADMIN',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
}
