import { Global, Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AdminModule } from './admin/admin.module';
import { AppV1Route } from './app-v1.route';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { JwtRefreshStrategy } from './strategy/jwt-refresh.strategy';
import { UserModule } from './user/user.module';

@Global()
@Module({
  imports: [AppV1Route, AuthModule, ChatModule, UserModule, AdminModule],

  providers: [JwtService, JwtRefreshStrategy],
  exports: [JwtService],
})
export class AppV1Module {
  // empty
}
