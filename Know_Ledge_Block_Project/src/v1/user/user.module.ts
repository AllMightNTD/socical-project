import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupMember } from '../entities/group_member.entity';
import { Profile } from '../entities/profile.entity';
import { RefreshToken } from '../entities/refresh_token.entity';
import { User } from '../entities/user.entity';
import { UserSettings } from '../entities/user_settings.entity';
import { UserStats } from '../entities/user_stats.entity';
import { Conversation } from '../entities/conversation.entity';
import { ConversationParticipant } from '../entities/conversation_participant.entity';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Profile,
      UserSettings,
      UserStats,
      RefreshToken,
      GroupMember,
      Conversation,
      ConversationParticipant,
    ]),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
