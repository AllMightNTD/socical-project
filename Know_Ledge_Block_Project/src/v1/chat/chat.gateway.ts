import { Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000'],
    credentials: true,
  },
  transports: ['websocket'],
})
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
  }),
)
export class ChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger(ChatGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly chatService: ChatService,
  ) { }

  afterInit() {
    this.logger.log('WebSocket Server Initialized');
  }

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        throw new Error('No token');
      }

      const decoded = this.jwtService.verify(token);
      const userId = decoded.sub;

      client.data.user = {
        id: userId,
      };

      await this.chatService.handleConnection(
        userId,
        client.id,
      );

      client.join(`user_${userId}`);

      client.emit('connected', {
        message: 'Successfully connected',
      });

      this.logger.log(
        `Client connected: ${client.id} (User: ${userId})`,
      );
    } catch (error) {
      this.logger.error(`SOCKET AUTH ERROR: ${error.message}`);
      client.emit("error", {
        message: error.message,
      });
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    await this.chatService.handleDisconnect(client.id);
    this.logger.log(
      `Socket disconnected: ${client.id}`,
    );
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    client.emit('pong', {
      time: new Date(),
    });
  }

  @SubscribeMessage('joinConversation')
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversation_id: string },
  ) {
    const userId = client.data.user.id;
    const isParticipant = await this.chatService.checkParticipant(userId, data.conversation_id);

    if (isParticipant) {
      client.join(`conversation_${data.conversation_id}`);
      this.logger.log(`User ${userId} joined conversation ${data.conversation_id}`);
    } else {
      client.emit('error', { message: 'You are not a participant of this conversation' });
    }
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: SendMessageDto,
  ) {
    const userId = client.data.user.id;

    console.log("sendMessage", dto);

    // 1. Kiểm tra participant
    const isParticipant = await this.chatService.checkParticipant(userId, dto.conversation_id);
    if (!isParticipant) {
      client.emit('error', { message: 'Unauthorized' });
      return;
    }

    // 2. Lưu tin nhắn
    const savedMessage = await this.chatService.saveMessage(userId, dto);

    // 3. Broadcast cho tất cả trong room (bao gồm cả người gửi để confirm)
    this.server.to(`conversation_${dto.conversation_id}`).emit('newMessage', savedMessage);

    // 4. Có thể emit riêng messageSent cho người gửi nếu muốn
    client.emit('messageSent', savedMessage);
  }
}