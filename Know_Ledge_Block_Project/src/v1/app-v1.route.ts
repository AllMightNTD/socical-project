import { Module } from '@nestjs/common';
import { RouterModule, Routes } from '@nestjs/core';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { FriendModule } from './friend/friend.module';
import { UserModule } from './user/user.module';

const routes: Routes = [
  {
    path: 'v1',
    children: [
      { path: 'auth', module: AuthModule },
      { path: 'user', module: UserModule },
      { path: 'admin', module: AdminModule },
      { path: 'friend', module: FriendModule },
      { path: 'chat', module: ChatModule },
    ],  
  },
];

@Module({
  imports: [RouterModule.register(routes)],
  exports: [RouterModule],
})
export class AppV1Route {}
