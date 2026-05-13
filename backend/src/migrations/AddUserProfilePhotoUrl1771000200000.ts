import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserProfilePhotoUrl1771000200000 implements MigrationInterface {
  name = 'AddUserProfilePhotoUrl1771000200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "profilePhotoUrl" character varying(500)'
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "users" DROP COLUMN IF EXISTS "profilePhotoUrl"');
  }
}
