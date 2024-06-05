import { Test, TestingModule } from '@nestjs/testing';
import { ChatGateway } from './chat.gateway';
import { UserService } from '../user/user.service';
import { AuthService } from '../auth/auth.service';
import { RoomService } from '../room/room.service';
import { Socket } from 'socket.io';
import { AddMessageDto } from './dto/add-message.dto';
import { JoinRoomDto } from './dto/join-room.dto';
import { LeaveRoomDto } from './dto/leave-room.dto';
import { RemoveMessageDto } from './dto/remove-message.dto';

describe('ChatGateway', () => {
  let chatGateway: ChatGateway;
  let userService: UserService;
  let authService: AuthService;
  let roomService: RoomService;
  let client: Socket;

  const mockUser = {
    id: 'testUserId',
    username: 'testUser',
    password: 'testPassword',
    room: {
      id: 'testRoomId',
      name: 'testRoom',
      users: [],
      messages: [],
    },
    messages: [],
  };

  const mockRoom = {
    id: 'testRoomId',
    name: 'testRoom',
    users: [],
    messages: [
      {
        id: 'testMessageId',
        text: 'testMessage',
        userId: 'testUserId',
        roomId: 'testRoomId',
        created_at: new Date(),
        user: mockUser,
        room: {
          id: 'testRoomId',
          name: 'testRoom',
          users: [],
          messages: [],
        },
      },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatGateway,
        {
          provide: UserService,
          useValue: {
            findOne: jest.fn(),
            updateUserRoom: jest.fn(),
          },
        },
        {
          provide: AuthService,
          useValue: {
            verifyAccessToken: jest.fn(),
          },
        },
        {
          provide: RoomService,
          useValue: {
            addMessage: jest.fn(),
            removeMessage: jest.fn(),
            findRoomWithRelations: jest.fn(),
          },
        },
      ],
    }).compile();

    chatGateway = module.get<ChatGateway>(ChatGateway);
    userService = module.get<UserService>(UserService);
    authService = module.get<AuthService>(AuthService);
    roomService = module.get<RoomService>(RoomService);
    client = {
      id: 'testClientId',
      handshake: { query: { token: 'testToken' } },
      disconnect: jest.fn(),
      join: jest.fn(),
      leave: jest.fn(),
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    } as any;
  });

  it('should be defined', () => {
    expect(chatGateway).toBeDefined();
  });

  describe('handleConnection', () => {
    it('should disconnect client if user is not found', async () => {
      jest.spyOn(authService, 'verifyAccessToken').mockReturnValue(null);
      await chatGateway.handleConnection(client);
      expect(client.disconnect).toHaveBeenCalledWith(true);
    });

    it('should set connected user and join room if user exists', async () => {
      jest
        .spyOn(authService, 'verifyAccessToken')
        .mockReturnValue({ id: 'testUserId' });
      jest.spyOn(userService, 'findOne').mockResolvedValue(mockUser);
      const spyOnRoomJoin = jest
        .spyOn(chatGateway, 'onRoomJoin')
        .mockResolvedValue(null);

      await chatGateway.handleConnection(client);
      expect(chatGateway.connectedUsers.get(client.id)).toBe(mockUser.id);
      expect(spyOnRoomJoin).toHaveBeenCalledWith(client, {
        roomId: mockUser.room.id,
      });
    });
  });

  describe('handleDisconnect', () => {
    it('should delete connected user on disconnect', () => {
      chatGateway.connectedUsers.set(client.id, 'testUserId');
      chatGateway.handleDisconnect(client);
      expect(chatGateway.connectedUsers.get(client.id)).toBeUndefined();
    });
  });

  describe('onMessage', () => {
    it('should emit message if user is in room', async () => {
      const addMessageDto: AddMessageDto = { text: 'testMessage' };
      chatGateway.connectedUsers.set(client.id, 'testUserId');
      jest.spyOn(userService, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(roomService, 'addMessage').mockResolvedValue(null);

      await chatGateway.onMessage(client, addMessageDto);
      expect(roomService.addMessage).toHaveBeenCalledWith({
        ...addMessageDto,
        userId: mockUser.id,
        roomId: mockUser.room.id,
      });
      expect(client.to(mockUser.room.id).emit).toHaveBeenCalledWith(
        'message',
        addMessageDto.text,
      );
    });
  });

  describe('onRemoveMessage', () => {
    it('should emit message removed if user is in room', async () => {
      const removeMessageDto: RemoveMessageDto = { messageId: 'testMessageId' };
      chatGateway.connectedUsers.set(client.id, 'testUserId');
      jest.spyOn(userService, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(roomService, 'removeMessage').mockResolvedValue(null);

      await chatGateway.onRemoveMessage(client, removeMessageDto);
      expect(roomService.removeMessage).toHaveBeenCalledWith({
        ...removeMessageDto,
        userId: mockUser.id,
        roomId: mockUser.room.id,
      });
      expect(client.to(mockUser.room.id).emit).toHaveBeenCalledWith(
        'message removed',
        removeMessageDto.messageId,
      );
    });
  });

  describe('onRoomJoin', () => {
    it('should join client to room and emit messages', async () => {
      const joinRoomDto: JoinRoomDto = { roomId: 'testRoomId' };
      chatGateway.connectedUsers.set(client.id, 'testUserId');
      jest
        .spyOn(roomService, 'findRoomWithRelations')
        .mockResolvedValue(mockRoom);

      await chatGateway.onRoomJoin(client, joinRoomDto);
      expect(client.join).toHaveBeenCalledWith(joinRoomDto.roomId);
      expect(client.emit).toHaveBeenCalledWith('message', [
        mockRoom.messages[0],
      ]);
      expect(userService.updateUserRoom).toHaveBeenCalledWith(
        'testUserId',
        mockRoom,
      );
    });
  });

  describe('onRoomLeave', () => {
    it('should leave client from room', async () => {
      const leaveRoomDto: LeaveRoomDto = { roomId: 'testRoomId' };
      chatGateway.connectedUsers.set(client.id, 'testUserId');

      await chatGateway.onRoomLeave(client, leaveRoomDto);
      expect(client.leave).toHaveBeenCalledWith(leaveRoomDto.roomId);
      expect(userService.updateUserRoom).toHaveBeenCalledWith(
        'testUserId',
        null,
      );
    });
  });
});
