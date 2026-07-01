import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1782814516311 implements MigrationInterface {
    name = 'Migration1782814516311'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Skip queries because they were already applied by synchronize
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`hand_actions\` DROP FOREIGN KEY \`FK_3422386f0f59957df8ca89461af\``);
        await queryRunner.query(`ALTER TABLE \`hand_actions\` DROP FOREIGN KEY \`FK_2ca69e0182d96d9dac86a269bea\``);
        await queryRunner.query(`ALTER TABLE \`hand_positions\` DROP FOREIGN KEY \`FK_3acbd5923aabfae0e972ee37d1f\``);
        await queryRunner.query(`ALTER TABLE \`hand_positions\` DROP FOREIGN KEY \`FK_8c439424774c7dbe0573abd627c\``);
        await queryRunner.query(`ALTER TABLE \`room_admin_logs\` DROP FOREIGN KEY \`FK_40348039134899fe7ae5c26564a\``);
        await queryRunner.query(`ALTER TABLE \`room_admin_logs\` DROP FOREIGN KEY \`FK_368a6f64407a5dec6b871f98a12\``);
        await queryRunner.query(`ALTER TABLE \`room_admin_logs\` DROP FOREIGN KEY \`FK_0ac4c532a124aeca6bb3ca7e0c1\``);
        await queryRunner.query(`ALTER TABLE \`system_revenue\` DROP FOREIGN KEY \`FK_80f409d74f89015db235ec17567\``);
        await queryRunner.query(`ALTER TABLE \`system_revenue\` DROP FOREIGN KEY \`FK_aeb0ebc516ceff28f100f0ce083\``);
        await queryRunner.query(`ALTER TABLE \`game_hands\` DROP COLUMN \`community_cards\``);
        await queryRunner.query(`ALTER TABLE \`game_hands\` ADD \`community_cards\` varchar(20) NULL`);
        await queryRunner.query(`ALTER TABLE \`tables\` CHANGE \`owner_id\` \`owner_id\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`hand_players\` DROP COLUMN \`initial_stack\``);
        await queryRunner.query(`ALTER TABLE \`hand_players\` DROP COLUMN \`seat_number\``);
        await queryRunner.query(`CREATE INDEX \`FK_hand_positions_user_id\` ON \`hand_positions\` (\`user_id\`)`);
        await queryRunner.query(`CREATE INDEX \`FK_room_admin_logs_target_id\` ON \`room_admin_logs\` (\`target_id\`)`);
        await queryRunner.query(`CREATE INDEX \`FK_room_admin_logs_actor_id\` ON \`room_admin_logs\` (\`actor_id\`)`);
        await queryRunner.query(`CREATE INDEX \`FK_system_revenue_hand_id\` ON \`system_revenue\` (\`hand_id\`)`);
    }

}
