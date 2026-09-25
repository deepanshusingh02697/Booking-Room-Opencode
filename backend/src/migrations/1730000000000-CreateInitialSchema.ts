import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInitialSchema1730000000000 implements MigrationInterface {
  name = 'CreateInitialSchema1730000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "employees_role_enum" AS ENUM ('EMPLOYEE', 'ADMIN')`);
    await queryRunner.query(`
      CREATE TABLE "employees" (
        "id" SERIAL NOT NULL,
        "first_name" character varying NOT NULL,
        "last_name" character varying NOT NULL,
        "email" character varying NOT NULL,
        "password" character varying NOT NULL,
        "role" "employees_role_enum" NOT NULL DEFAULT 'EMPLOYEE',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_employees_email" UNIQUE ("email"),
        CONSTRAINT "PK_employees_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`CREATE TYPE "rooms_status_enum" AS ENUM ('AVAILABLE', 'MAINTENANCE', 'DISABLED')`);
    await queryRunner.query(`
      CREATE TABLE "rooms" (
        "id" SERIAL NOT NULL,
        "name" character varying NOT NULL,
        "capacity" integer NOT NULL,
        "floor" integer NOT NULL,
        "location" character varying NOT NULL,
        "status" "rooms_status_enum" NOT NULL DEFAULT 'AVAILABLE',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_rooms_name" UNIQUE ("name"),
        CONSTRAINT "CHK_rooms_capacity_positive" CHECK ("capacity" > 0),
        CONSTRAINT "PK_rooms_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "equipment" (
        "id" SERIAL NOT NULL,
        "name" character varying NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_equipment_name" UNIQUE ("name"),
        CONSTRAINT "PK_equipment_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "room_equipment" (
        "id" SERIAL NOT NULL,
        "room_id" integer NOT NULL,
        "equipment_id" integer NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_room_equipment_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_room_equipment_room_equipment" UNIQUE ("room_id", "equipment_id"),
        CONSTRAINT "FK_room_equipment_room" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_room_equipment_equipment" FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`CREATE TYPE "bookings_status_enum" AS ENUM ('CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW')`);
    await queryRunner.query(`
      CREATE TABLE "bookings" (
        "id" SERIAL NOT NULL,
        "room_id" integer NOT NULL,
        "organizer_id" integer NOT NULL,
        "title" character varying NOT NULL,
        "description" text,
        "status" "bookings_status_enum" NOT NULL DEFAULT 'CONFIRMED',
        "start_time" TIMESTAMP WITH TIME ZONE NOT NULL,
        "end_time" TIMESTAMP WITH TIME ZONE NOT NULL,
        "recurrence_id" character varying,
        "has_checked_in" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "CHK_bookings_start_before_end" CHECK ("start_time" < "end_time"),
        CONSTRAINT "PK_bookings_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_bookings_room" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_bookings_organizer" FOREIGN KEY ("organizer_id") REFERENCES "employees"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_bookings_room_time" ON "bookings" ("room_id", "start_time", "end_time")`);
    await queryRunner.query(`CREATE INDEX "IDX_bookings_organizer_start" ON "bookings" ("organizer_id", "start_time")`);
    await queryRunner.query(`CREATE INDEX "IDX_bookings_recurrence" ON "bookings" ("recurrence_id")`);

    await queryRunner.query(`
      CREATE TABLE "participants" (
        "id" SERIAL NOT NULL,
        "booking_id" integer NOT NULL,
        "employee_id" integer NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_participants_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_participants_booking_employee" UNIQUE ("booking_id", "employee_id"),
        CONSTRAINT "FK_participants_booking" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_participants_employee" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "check_ins" (
        "id" SERIAL NOT NULL,
        "booking_id" integer NOT NULL,
        "checked_in_by" integer NOT NULL,
        "checked_in_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_check_ins_booking" UNIQUE ("booking_id"),
        CONSTRAINT "PK_check_ins_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_check_ins_booking" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_check_ins_employee" FOREIGN KEY ("checked_in_by") REFERENCES "employees"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "waitlist_entries" (
        "id" SERIAL NOT NULL,
        "room_id" integer NOT NULL,
        "employee_id" integer NOT NULL,
        "start_time" TIMESTAMP WITH TIME ZONE NOT NULL,
        "end_time" TIMESTAMP WITH TIME ZONE NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "CHK_waitlist_start_before_end" CHECK ("start_time" < "end_time"),
        CONSTRAINT "PK_waitlist_entries_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_waitlist_entries_room" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_waitlist_entries_employee" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_waitlist_room_time" ON "waitlist_entries" ("room_id", "start_time")`);

    await queryRunner.query(`
      CREATE TABLE "maintenance" (
        "id" SERIAL NOT NULL,
        "room_id" integer NOT NULL,
        "start_time" TIMESTAMP WITH TIME ZONE NOT NULL,
        "end_time" TIMESTAMP WITH TIME ZONE NOT NULL,
        "reason" text,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "CHK_maintenance_start_before_end" CHECK ("start_time" < "end_time"),
        CONSTRAINT "PK_maintenance_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_maintenance_room" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_maintenance_room_time" ON "maintenance" ("room_id", "start_time")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_maintenance_room_time"`);
    await queryRunner.query(`DROP TABLE "maintenance"`);
    await queryRunner.query(`DROP INDEX "IDX_waitlist_room_time"`);
    await queryRunner.query(`DROP TABLE "waitlist_entries"`);
    await queryRunner.query(`DROP TABLE "check_ins"`);
    await queryRunner.query(`DROP TABLE "participants"`);
    await queryRunner.query(`DROP INDEX "IDX_bookings_recurrence"`);
    await queryRunner.query(`DROP INDEX "IDX_bookings_organizer_start"`);
    await queryRunner.query(`DROP INDEX "IDX_bookings_room_time"`);
    await queryRunner.query(`DROP TABLE "bookings"`);
    await queryRunner.query(`DROP TYPE "bookings_status_enum"`);
    await queryRunner.query(`DROP TABLE "room_equipment"`);
    await queryRunner.query(`DROP TABLE "equipment"`);
    await queryRunner.query(`DROP TABLE "rooms"`);
    await queryRunner.query(`DROP TYPE "rooms_status_enum"`);
    await queryRunner.query(`DROP TABLE "employees"`);
    await queryRunner.query(`DROP TYPE "employees_role_enum"`);
  }
}