import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropBookingHasCheckedIn1730000000003 implements MigrationInterface {
  name = 'DropBookingHasCheckedIn1730000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP COLUMN "has_checked_in"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD "has_checked_in" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `UPDATE "bookings" SET "has_checked_in" = TRUE WHERE EXISTS (SELECT 1 FROM "check_ins" WHERE "check_ins"."booking_id" = "bookings"."id")`,
    );
  }
}
