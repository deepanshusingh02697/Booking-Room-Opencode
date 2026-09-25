import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Booking } from '../../bookings/entities/booking';
import { Employee } from '../../auth/entities/employee';

@Entity('check_ins')
export class CheckIn {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'booking_id', unique: true })
  bookingId: number;

  @Column({ name: 'checked_in_by' })
  checkedInBy: number;

  @Column({ name: 'checked_in_at', type: 'timestamptz' })
  checkedInAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToOne(() => Booking, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'checked_in_by' })
  checkedInByEmployee: Employee;
}