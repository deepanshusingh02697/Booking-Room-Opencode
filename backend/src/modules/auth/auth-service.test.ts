import 'reflect-metadata';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  createAuthUser,
  createTestEmployee,
  describeDb,
  testDataSource,
  truncateTables,
} from '../../test/test-utils';
import { AuthService } from './services/auth-service';
import { UserRole } from './entities/employee';
import { ConflictError, UnauthenticatedError } from '../../common/errors';
import { hashPassword } from './utils/password';

describeDb('AuthService - Critical Rules', () => {
  let authService: AuthService;

  beforeEach(async () => {
    await truncateTables(testDataSource);

    authService = new AuthService();
  });

  describe('signUp', () => {
    it('creates new employee', async () => {
      const employee = await authService.signUp({
        firstName: 'New',
        lastName: 'User',
        email: 'new@test.com',
        password: 'Password123',
      });

      expect(employee).toBeTruthy();
      expect(employee.email).toBe('new@test.com');
      expect(employee.role).toBe(UserRole.EMPLOYEE);
    });

    it('rejects duplicate email (CONFLICT)', async () => {
      await authService.signUp({
        firstName: 'Existing',
        lastName: 'User',
        email: 'existing@test.com',
        password: 'Password123',
      });

      await expect(
        authService.signUp({
          firstName: 'Another',
          lastName: 'User',
          email: 'existing@test.com',
          password: 'Password123',
        }),
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('logIn', () => {
    it('logs in employee with correct credentials', async () => {
      const password = 'Password123';
      await authService.signUp({
        firstName: 'Login',
        lastName: 'User',
        email: 'login@test.com',
        password,
      });

      const employee = await authService.logIn('login@test.com', password);
      expect(employee).toBeTruthy();
      expect(employee.email).toBe('login@test.com');
    });

    it('rejects wrong password', async () => {
      await authService.signUp({
        firstName: 'Wrong',
        lastName: 'Pass',
        email: 'wrong@test.com',
        password: 'Password123',
      });

      await expect(authService.logIn('wrong@test.com', 'WrongPass')).rejects.toThrow(UnauthenticatedError);
    });

    it('rejects admin email on employee login', async () => {
      await createTestEmployee({ email: 'admin@test.com', role: UserRole.ADMIN, password: await hashPassword('Admin123') });

      await expect(authService.logIn('admin@test.com', 'Admin123')).rejects.toThrow(UnauthenticatedError);
    });
  });

  describe('adminLogIn', () => {
    it('logs in admin with correct credentials', async () => {
      const password = 'Admin123';
      await createTestEmployee({ email: 'admin@test.com', role: UserRole.ADMIN, password: await hashPassword(password) });

      const employee = await authService.adminLogIn('admin@test.com', password);
      expect(employee).toBeTruthy();
      expect(employee.role).toBe(UserRole.ADMIN);
    });

    it('rejects employee email on admin login', async () => {
      await authService.signUp({
        firstName: 'Employee',
        lastName: 'User',
        email: 'employee@test.com',
        password: 'Password123',
      });

      await expect(authService.adminLogIn('employee@test.com', 'Password123')).rejects.toThrow(UnauthenticatedError);
    });
  });

  describe('currentUser', () => {
    it('returns user for valid id', async () => {
      const employee = await authService.signUp({
        firstName: 'Current',
        lastName: 'User',
        email: 'current@test.com',
        password: 'Password123',
      });

      const found = await authService.currentUser(employee.id);
      expect(found.id).toBe(employee.id);
    });

    it('throws for null id', async () => {
      await expect(authService.currentUser(null)).rejects.toThrow(UnauthenticatedError);
    });

    it('throws for unknown id', async () => {
      await expect(authService.currentUser(99999)).rejects.toThrow(UnauthenticatedError);
    });
  });

  describe('list', () => {
    it('returns all employees', async () => {
      await authService.signUp({ firstName: 'A', lastName: 'One', email: 'a@test.com', password: 'p' });
      await authService.signUp({ firstName: 'B', lastName: 'Two', email: 'b@test.com', password: 'p' });

      const list = await authService.list(createAuthUser(1));
      expect(list.length).toBeGreaterThanOrEqual(2);
    });

    it('throws for unauthenticated', async () => {
      await expect(authService.list(null)).rejects.toThrow(UnauthenticatedError);
    });
  });
});