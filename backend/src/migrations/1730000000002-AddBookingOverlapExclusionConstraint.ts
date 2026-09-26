import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBookingOverlapExclusionConstraint1730000000002 implements MigrationInterface {
  name = 'AddBookingOverlapExclusionConstraint1730000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "btree_gist"`);
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD CONSTRAINT "EXC_bookings_room_no_overlap" EXCLUDE USING gist ("room_id" WITH =, tstzrange("start_time", "end_time") WITH &&) WHERE ("status" = 'CONFIRMED'::bookings_status_enum)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP CONSTRAINT "EXC_bookings_room_no_overlap"`,
    );
    await queryRunner.query(`DROP EXTENSION IF EXISTS "btree_gist"`);
  }
}
