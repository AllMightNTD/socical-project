import { Module } from '@nestjs/common';
import { ChatGateWay } from './chat-gateway';

@Module({
  imports: [],
  providers: [ChatGateWay],
  controllers: [],
  exports: [],
})
export class ChatModule {}
