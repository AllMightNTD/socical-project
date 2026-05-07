import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'http';
import { Socket } from 'socket.io';

/**Setup domain and public CORS */
@WebSocketGateway(parseInt(process.env.APP_SOCKET_PORT, 10), {
  cors: {
    origin: '*',
  },
})
export class ChatGateWay implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('ChatGateway');

  afterInit(server: Socket) {
    this.logger.log(`WebSocket Server Initialized: ${server}`);
  }
  handleConnection(client: Socket) {
    /** Send notification all user ignore user main */
    client.broadcast.emit('user-joined', {
      message: `New user joined in the chat ${client.id}`,
    });
  }

  handleDisconnect(client: any) {
    this.server.emit('user-left', {
      message: `User left the chat ${client.id}`,
    });
  }

  /**Register Event */
  @SubscribeMessage('new-message')
  handleNewMessage(client: Socket, message: string) {
    /**connect in event */
    this.server.emit('message', message);
  }
}
