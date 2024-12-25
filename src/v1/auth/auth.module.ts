import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthController } from './controllers';
import { AuthService } from './services/auth/auth.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
