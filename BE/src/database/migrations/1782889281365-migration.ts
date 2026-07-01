import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1782889281365 implements MigrationInterface {
    name = 'Migration1782889281365'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_221970c565d084e2a5e9047ece\` ON \`categories\``);
        await queryRunner.query(`ALTER TABLE \`refresh_tokens\` DROP COLUMN \`updated_at\``);
        await queryRunner.query(`ALTER TABLE \`refresh_tokens\` DROP COLUMN \`ip_address\``);
        await queryRunner.query(`ALTER TABLE \`refresh_tokens\` ADD \`ip_address\` varchar(45) NULL`);
        await queryRunner.query(`ALTER TABLE \`refresh_tokens\` DROP COLUMN \`created_at\``);
        await queryRunner.query(`ALTER TABLE \`refresh_tokens\` ADD \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`refresh_tokens\` DROP COLUMN \`created_at\``);
        await queryRunner.query(`ALTER TABLE \`refresh_tokens\` ADD \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`refresh_tokens\` DROP COLUMN \`ip_address\``);
        await queryRunner.query(`ALTER TABLE \`refresh_tokens\` ADD \`ip_address\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`refresh_tokens\` ADD \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_221970c565d084e2a5e9047ece\` ON \`categories\` (\`seo_meta_id\`)`);
    }

}
