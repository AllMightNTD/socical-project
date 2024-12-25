import { Module } from '@nestjs/common';
import { AppV1Route } from './app-v1.route';
import { AuthModule } from './auth/auth.module';
import { UsersController } from './users/controllers/users.controller';
import { UsersModule } from './users/users.module';

@Module({
  imports: [AppV1Route, AuthModule, UsersModule],
  controllers: [UsersController],
})
export class AppV1Module {
  // empty
}
