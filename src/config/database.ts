// import { ConfigService } from '@nestjs/config';
// import { TypeOrmModuleOptions } from '@nestjs/typeorm';

// export function getTypeOrmConfig(
//   configService: ConfigService,
// ): TypeOrmModuleOptions {
//   return {
//     type: 'mysql',
//     host: configService.get<string>('DB_HOST'),
//     port: configService.get<number>('DB_PORT'),
//     username: configService.get<string>('DB_USERNAME'),
//     password: configService.get<string>('DB_PASSWORD'),
//     database: configService.get<string>('DB_DATABASE'),
//     autoLoadEntities: true,
//     synchronize: false,
//     retryAttempts: 5,
//     retryDelay: 3000,
//     entities: ['dist/**/*.entity{.ts,.js}'],
//     migrations: ['dist/migrations/*{.ts,.js}'],
//     logging: false,
//   };
// }

import { registerAs } from '@nestjs/config';
import * as dotenv from 'dotenv';
import * as process from 'node:process';
import { DataSource, DataSourceOptions, getMetadataArgsStorage } from 'typeorm';
import { ColumnMetadataArgs } from 'typeorm/metadata-args/ColumnMetadataArgs';

dotenv.config({ path: '.env' });
const config = {
  type: 'mysql',
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  autoLoadEntities: true,
  synchronize: false,
  retryAttempts: 5,
  retryDelay: 3000,
  entities: ['dist/v1/**/*.entity{.ts,.js}'],
  migrations: ['dist/migrations/*{.ts,.js}'],
  logging: false,
};

export default registerAs('database', () => config);
export const connectionSource = new DataSource(config as DataSourceOptions);

export function getEntityColumns<T>(entity): (keyof T)[] {
  const columns = getMetadataArgsStorage()
    .columns.filter((column: ColumnMetadataArgs) => column.target == entity)
    .map((d) => d.propertyName);
  return columns as (keyof T)[];
}
