import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1766120531632 implements MigrationInterface {
    name = 'Migration1766120531632'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`reset_token\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`reset_token_expires_at\` timestamp NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`reset_token_expires_at\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`reset_token\``);
    }

}
