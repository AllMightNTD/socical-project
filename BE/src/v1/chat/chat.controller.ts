import {
  Controller,
  Get,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../guards/auth.guard';
import { UserService } from '../user/user.service';
import { ChatService } from './chat.service';

@Controller('')
@UseGuards(AuthGuard)
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly userService: UserService,
  ) { }

  @Get('/conversation/:friendId')
  async getOrCreateConversation(@Request() req, @Param('friendId') friendId: string) {
    return this.userService.getOrCreateConversation(req.user.sub, friendId);
  }

  @Get('/messages/:conversationId')
  async getMessages(
    @Request() req,
    @Param('conversationId') conversationId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    // Kiểm tra xem user có trong conversation này không
    const isParticipant = await this.chatService.checkParticipant(req.user.sub, conversationId);
    if (!isParticipant) {
      return { data: [], total: 0 };
    }

    return this.chatService.getMessages(conversationId, page, limit);
  }
}
