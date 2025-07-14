import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1752478428396 implements MigrationInterface {
  name = 'Migration1752478428396';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`profiles\` (\`id\` int NOT NULL AUTO_INCREMENT, \`full_name\` varchar(255) NULL, \`bio\` text NULL, \`avatar_url\` varchar(255) NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`user_id\` int NULL, UNIQUE INDEX \`REL_9e432b7df0d182f8d292902d1a\` (\`user_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`media_contents\` (\`id\` int NOT NULL AUTO_INCREMENT, \`media_url\` varchar(255) NOT NULL, \`media_type\` varchar(255) NOT NULL, \`album_id\` int NULL, \`post_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`tags\` (\`id\` int NOT NULL AUTO_INCREMENT, \`tag_text\` varchar(255) NOT NULL, \`post_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`reactions\` (\`id\` int NOT NULL AUTO_INCREMENT, \`reaction_type\` varchar(255) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`user_id\` int NULL, \`post_id\` int NULL, \`comment_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`comments\` (\`id\` int NOT NULL AUTO_INCREMENT, \`parent_comment_id\` int NULL, \`content\` text NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`post_id\` int NULL, \`user_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`posts\` (\`id\` int NOT NULL AUTO_INCREMENT, \`content\` text NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`user_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`user_settings\` (\`id\` int NOT NULL AUTO_INCREMENT, \`is_private\` tinyint NOT NULL DEFAULT 0, \`notifications_enabled\` tinyint NOT NULL DEFAULT 1, \`user_id\` int NULL, UNIQUE INDEX \`REL_4ed056b9344e6f7d8d46ec4b30\` (\`user_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`users\` (\`id\` int NOT NULL AUTO_INCREMENT, \`email\` varchar(255) NOT NULL, \`password\` varchar(255) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`user_relations\` (\`id\` int NOT NULL AUTO_INCREMENT, \`relation_type\` varchar(255) NOT NULL, \`user_id\` int NULL, \`target_user_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`block_list\` (\`id\` int NOT NULL AUTO_INCREMENT, \`user_id\` int NULL, \`blocked_user_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`albums\` (\`id\` int NOT NULL AUTO_INCREMENT, \`title\` varchar(255) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`user_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`profiles\` ADD CONSTRAINT \`FK_9e432b7df0d182f8d292902d1a2\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`media_contents\` ADD CONSTRAINT \`FK_8348047400490cefdb5b0153cd2\` FOREIGN KEY (\`post_id\`) REFERENCES \`posts\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`tags\` ADD CONSTRAINT \`FK_b20aaa37aa83f407ff31c82ded5\` FOREIGN KEY (\`post_id\`) REFERENCES \`posts\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`reactions\` ADD CONSTRAINT \`FK_dde6062145a93649adc5af3946e\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`reactions\` ADD CONSTRAINT \`FK_a1ac38351a456da43cd26d38be8\` FOREIGN KEY (\`post_id\`) REFERENCES \`posts\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`reactions\` ADD CONSTRAINT \`FK_bbea5deba8e9118ad08429c9104\` FOREIGN KEY (\`comment_id\`) REFERENCES \`comments\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`comments\` ADD CONSTRAINT \`FK_259bf9825d9d198608d1b46b0b5\` FOREIGN KEY (\`post_id\`) REFERENCES \`posts\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`comments\` ADD CONSTRAINT \`FK_4c675567d2a58f0b07cef09c13d\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`posts\` ADD CONSTRAINT \`FK_c4f9a7bd77b489e711277ee5986\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_settings\` ADD CONSTRAINT \`FK_4ed056b9344e6f7d8d46ec4b302\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_relations\` ADD CONSTRAINT \`FK_35bf123a05bcd64c39a35be6fe1\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_relations\` ADD CONSTRAINT \`FK_68d2566da4437b7f6dfb6d8d060\` FOREIGN KEY (\`target_user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`block_list\` ADD CONSTRAINT \`FK_4860dd94ad6f9cfbd562d726414\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`block_list\` ADD CONSTRAINT \`FK_5d670baf0a21e4bbdb79f13a20a\` FOREIGN KEY (\`blocked_user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`albums\` ADD CONSTRAINT \`FK_2c6a2dfb05cb87cc38e2a8b9dc1\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`albums\` DROP FOREIGN KEY \`FK_2c6a2dfb05cb87cc38e2a8b9dc1\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`block_list\` DROP FOREIGN KEY \`FK_5d670baf0a21e4bbdb79f13a20a\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`block_list\` DROP FOREIGN KEY \`FK_4860dd94ad6f9cfbd562d726414\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_relations\` DROP FOREIGN KEY \`FK_68d2566da4437b7f6dfb6d8d060\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_relations\` DROP FOREIGN KEY \`FK_35bf123a05bcd64c39a35be6fe1\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_settings\` DROP FOREIGN KEY \`FK_4ed056b9344e6f7d8d46ec4b302\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`posts\` DROP FOREIGN KEY \`FK_c4f9a7bd77b489e711277ee5986\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`comments\` DROP FOREIGN KEY \`FK_4c675567d2a58f0b07cef09c13d\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`comments\` DROP FOREIGN KEY \`FK_259bf9825d9d198608d1b46b0b5\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`reactions\` DROP FOREIGN KEY \`FK_bbea5deba8e9118ad08429c9104\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`reactions\` DROP FOREIGN KEY \`FK_a1ac38351a456da43cd26d38be8\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`reactions\` DROP FOREIGN KEY \`FK_dde6062145a93649adc5af3946e\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`tags\` DROP FOREIGN KEY \`FK_b20aaa37aa83f407ff31c82ded5\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`media_contents\` DROP FOREIGN KEY \`FK_8348047400490cefdb5b0153cd2\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`profiles\` DROP FOREIGN KEY \`FK_9e432b7df0d182f8d292902d1a2\``,
    );
    await queryRunner.query(`DROP TABLE \`albums\``);
    await queryRunner.query(`DROP TABLE \`block_list\``);
    await queryRunner.query(`DROP TABLE \`user_relations\``);
    await queryRunner.query(`DROP TABLE \`users\``);
    await queryRunner.query(
      `DROP INDEX \`REL_4ed056b9344e6f7d8d46ec4b30\` ON \`user_settings\``,
    );
    await queryRunner.query(`DROP TABLE \`user_settings\``);
    await queryRunner.query(`DROP TABLE \`posts\``);
    await queryRunner.query(`DROP TABLE \`comments\``);
    await queryRunner.query(`DROP TABLE \`reactions\``);
    await queryRunner.query(`DROP TABLE \`tags\``);
    await queryRunner.query(`DROP TABLE \`media_contents\``);
    await queryRunner.query(
      `DROP INDEX \`REL_9e432b7df0d182f8d292902d1a\` ON \`profiles\``,
    );
    await queryRunner.query(`DROP TABLE \`profiles\``);
  }
}
