import { ConflictError, UnauthenticatedError } from '../../../common/errors';
import { Employee, UserRole } from '../entities/employee';
import { EmployeeRepository } from '../repositories/employee-repository';
import { hashPassword, verifyPassword } from '../utils/password';

export interface SignUpData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

const INVALID_CREDENTIALS = 'Invalid email or password.';

export class AuthService {
  private readonly employeeRepository = new EmployeeRepository();

  async signUp(data: SignUpData): Promise<Employee> {
    const email = data.email.trim().toLowerCase();
    const existing = await this.employeeRepository.findByEmail(email);
    if (existing) {
      throw new ConflictError('An account with this email already exists.');
    }
    return this.employeeRepository.create({
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      email,
      password: await hashPassword(data.password),
      role: UserRole.EMPLOYEE,
    });
  }

  async logIn(email: string, password: string): Promise<Employee> {
    const employee = await this.authenticate(email, password);
    if (employee.role !== UserRole.EMPLOYEE) {
      throw new UnauthenticatedError(INVALID_CREDENTIALS);
    }
    return employee;
  }

  async adminLogIn(email: string, password: string): Promise<Employee> {
    const employee = await this.authenticate(email, password);
    if (employee.role !== UserRole.ADMIN) {
      throw new UnauthenticatedError(INVALID_CREDENTIALS);
    }
    return employee;
  }

  async currentUser(userId: number | null): Promise<Employee> {
    if (userId === null) {
      throw new UnauthenticatedError();
    }
    const employee = await this.employeeRepository.findById(userId);
    if (!employee) {
      throw new UnauthenticatedError();
    }
    return employee;
  }

  private async authenticate(email: string, password: string): Promise<Employee> {
    const employee = await this.employeeRepository.findByEmail(
      email.trim().toLowerCase(),
    );
    const passwordMatches = employee
      ? await verifyPassword(password, employee.password)
      : false;
    if (!employee || !passwordMatches) {
      throw new UnauthenticatedError(INVALID_CREDENTIALS);
    }
    return employee;
  }
}
