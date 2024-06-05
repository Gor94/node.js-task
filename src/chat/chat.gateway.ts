import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { Socket } from 'socket.io';

import { UserService } from '../user/user.service';
import { AuthService } from '../auth/auth.service';
import { RoomService } from '../room/room.service';

import { AddMessageDto } from './dto/add-message.dto';
import { JoinRoomDto } from './dto/join-room.dto';
import { LeaveRoomDto } from './dto/leave-room.dto';
import { RemoveMessageDto } from './dto/remove-message.dto';

@WebSocketGateway()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server;

  connectedUsers: Map<string, string> = new Map();

  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly roomService: RoomService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    const token = client.handshake.query.token.toString();
    const payload = this.authService.verifyAccessToken(token);

    const user = payload && (await this.userService.findOne(payload.id));
    const room = user?.room;

    if (!user) {
      client.disconnect(true);

      return;
    }

    this.connectedUsers.set(client.id, user.id);

    if (room) {
      return this.onRoomJoin(client, { roomId: room.id });
    }
  }

  async handleDisconnect(client: Socket) {
    this.connectedUsers.delete(client.id);
  }

  @SubscribeMessage('message')
  async onMessage(client: Socket, addMessageDto: AddMessageDto) {
    const userId = this.connectedUsers.get(client.id);
    const user = await this.userService.findOne(userId);

    if (!user.room) {
      return;
    }

    addMessageDto.userId = userId;
    addMessageDto.roomId = user.room.id;

    await this.roomService.addMessage(addMessageDto);

    client.to(user.room.id).emit('message', addMessageDto.text);
  }

  @SubscribeMessage('remove-message')
  async onRemoveMessage(client: Socket, removeMessageDto: RemoveMessageDto) {
    const userId = this.connectedUsers.get(client.id);
    const user = await this.userService.findOne(userId);
    if (!user.room) {
      return;
    }
    removeMessageDto.userId = userId;
    removeMessageDto.roomId = user.room.id;

    await this.roomService.removeMessage(removeMessageDto);

    client.to(user.room.id).emit('message removed', removeMessageDto.messageId);
  }

  @SubscribeMessage('join')
  async onRoomJoin(client: Socket, joinRoomDto: JoinRoomDto) {
    const { roomId } = joinRoomDto;
    const limit = 1;

    const room = await this.roomService.findRoomWithRelations(roomId);

    if (!room) return;

    const userId = this.connectedUsers.get(client.id);
    const messages = room.messages.slice(limit * -1);

    await this.userService.updateUserRoom(userId, room);

    client.join(roomId);

    client.emit('message', messages);
  }

  @SubscribeMessage('leave')
  async onRoomLeave(client: Socket, leaveRoomDto: LeaveRoomDto) {
    const { roomId } = leaveRoomDto;
    const userId = this.connectedUsers.get(client.id);

    await this.userService.updateUserRoom(userId, null);

    client.leave(roomId);
  }
}
