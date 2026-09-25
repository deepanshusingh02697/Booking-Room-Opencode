import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Booking } from '../../bookings/entities/booking';
import { Employee } from '../../auth/entities/employee';

@Entity('participants')
@Index(['bookingId', 'employeeId'], { unique: true })
export class Participant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'booking_id' })
  bookingId: number;

  @Column({ name: 'employee_id' })
  employeeId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Booking, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;
}