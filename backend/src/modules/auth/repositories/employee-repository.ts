import { In } from 'typeorm';
import { AppDataSource } from '../../../config/data-source';
import { Employee } from '../entities/employee';

type NewEmployee = Pick<
  Employee,
  'firstName' | 'lastName' | 'email' | 'password' | 'role'
>;

export class EmployeeRepository {
  private readonly repository = AppDataSource.getRepository(Employee);

  async findByEmail(email: string): Promise<Employee | null> {
    return this.repository.findOne({ where: { email } });
  }

  async findById(id: number): Promise<Employee | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByIds(ids: number[]): Promise<Employee[]> {
    if (ids.length === 0) {
      return [];
    }
    return this.repository.find({ where: { id: In(ids) } });
  }

  async create(data: NewEmployee): Promise<Employee> {
    const employee = this.repository.create(data);
    return this.repository.save(employee);
  }
}
