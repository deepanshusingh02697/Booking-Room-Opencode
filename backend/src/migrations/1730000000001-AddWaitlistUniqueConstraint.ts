import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWaitlistUniqueConstraint1730000000001 implements MigrationInterface {
  name = 'AddWaitlistUniqueConstraint1730000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_waitlist_room_employee_start" ON "waitlist_entries" ("room_id", "employee_id", "start_time")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "UQ_waitlist_room_employee_start"`);
  }
}